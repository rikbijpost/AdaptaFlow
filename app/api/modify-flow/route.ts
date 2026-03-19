import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

type FileContent =
  | { type: 'text'; text: string }
  | { type: 'image'; base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' }
  | { type: 'document'; base64: string; mediaType: 'application/pdf' }

async function extractContent(file: File): Promise<FileContent> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const name = file.name.toLowerCase()

  if (name.endsWith('.txt')) {
    return { type: 'text', text: buffer.toString('utf-8') }
  }

  if (name.endsWith('.docx') || name.endsWith('.doc')) {
    const result = await mammoth.extractRawText({ buffer })
    return { type: 'text', text: result.value }
  }

  if (name.endsWith('.pdf')) {
    return {
      type: 'document',
      base64: buffer.toString('base64'),
      mediaType: 'application/pdf',
    }
  }

  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const lines: string[] = []
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]
      const csv = XLSX.utils.sheet_to_csv(sheet)
      if (csv.trim()) {
        lines.push(`--- ${sheetName} ---\n${csv}`)
      }
    }
    return { type: 'text', text: lines.join('\n\n') }
  }

  if (name.endsWith('.csv')) {
    return { type: 'text', text: buffer.toString('utf-8') }
  }

  if (
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.png') ||
    name.endsWith('.gif') ||
    name.endsWith('.webp')
  ) {
    const ext = name.split('.').pop()!
    const mediaTypeMap: Record<string, 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    }
    return {
      type: 'image',
      base64: buffer.toString('base64'),
      mediaType: mediaTypeMap[ext],
    }
  }

  throw new Error('Unsupported file type. Please upload a PDF, Word, Excel, image, or plain text file.')
}

function buildTextPrompt(flowText: string, modificationType: string, details: string): string {
  return `${systemContext(modificationType, details)}

ORIGINAL FLOW:
${flowText}

${instructions}`
}

function buildImagePrompt(modificationType: string, details: string): string {
  return `${systemContext(modificationType, details)}

The pilates flow is in the image attached. Read all the exercises from it, then follow the instructions below.

${instructions}`
}

function systemContext(modificationType: string, details: string): string {
  const modDescriptions: Record<string, string> = {
    injury: `one of the participants has an injury: ${details || 'unspecified injury (be conservative)'}`,
    pregnancy: `one of the participants is pregnant${details ? ` (${details})` : ' (be conservative and prioritise safety)'}`,
    beginner: `one of the participants is a beginner${details ? ` (${details})` : ' with no prior pilates experience'}`,
    advanced: `one of the participants is an advanced student${details ? ` (${details})` : ' with strong pilates experience'} — your goal is to make the flow more challenging and demanding for them`,
  }
  const modDescription = modDescriptions[modificationType] ?? modificationType

  return `You are a highly experienced pilates instructor and certified movement specialist.

A pilates instructor has shared a class flow with you. Your job is to review the flow because ${modDescription}, and provide specific suggestions only for exercises that need to be changed.`
}

const instructions = `INSTRUCTIONS:
- Review each exercise in the flow carefully.
- Only include exercises that need to be changed — do NOT include exercises that are safe and appropriate as-is.
- For each exercise that needs a change, specify the action:
  - "modify": keep the exercise but change something about it (e.g. range of motion, speed, props, added challenge)
  - "replace": swap it with a different exercise (safer or more challenging depending on context)
  - "skip": remove the exercise entirely
- Write suggestions in practical, instructor-ready language.
- If all exercises are appropriate as-is, return an empty array.

Return ONLY a valid JSON array with no other text before or after it. Use this exact format:
[
  {
    "exercise": "the exercise name or number exactly as it appears in the flow",
    "action": "modify",
    "suggestion": "clear instruction for the instructor on what to do",
    "reason": "brief explanation of why this change is needed"
  }
]`

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured. Add your ANTHROPIC_API_KEY to the .env.local file.' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const modificationType = formData.get('modificationType') as string | null
    const details = (formData.get('details') as string) ?? ''

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 })
    }
    if (!modificationType) {
      return NextResponse.json({ error: 'No modification type selected.' }, { status: 400 })
    }

    let content: FileContent
    try {
      content = await extractContent(file)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not read the file.'
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    if (content.type === 'text' && !content.text.trim()) {
      return NextResponse.json({ error: 'The uploaded file appears to be empty.' }, { status: 400 })
    }

    let messageContent: Anthropic.MessageParam['content']
    if (content.type === 'document') {
      messageContent = [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: content.mediaType,
            data: content.base64,
          },
        },
        {
          type: 'text',
          text: buildImagePrompt(modificationType, details),
        },
      ]
    } else if (content.type === 'image') {
      messageContent = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: content.mediaType,
            data: content.base64,
          },
        },
        {
          type: 'text',
          text: buildImagePrompt(modificationType, details),
        },
      ]
    } else {
      messageContent = buildTextPrompt(content.text, modificationType, details)
    }

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: messageContent }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    let suggestions
    try {
      suggestions = JSON.parse(text)
    } catch {
      const match = text.match(/\[[\s\S]*\]/)
      if (match) {
        try {
          suggestions = JSON.parse(match[0])
        } catch {
          return NextResponse.json({ error: 'Could not parse suggestions. Please try again.' }, { status: 500 })
        }
      } else {
        return NextResponse.json({ error: 'Could not parse suggestions. Please try again.' }, { status: 500 })
      }
    }

    return NextResponse.json({ suggestions })
  } catch (error: unknown) {
    console.error('Error in modify-flow route:', error)
    const msg = error instanceof Error ? error.message : 'An unexpected error occurred.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
