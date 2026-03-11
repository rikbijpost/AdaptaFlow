'use client'

import { useState, useRef } from 'react'

type ModificationType = 'injury' | 'pregnancy' | 'beginner' | 'advanced' | ''

type Suggestion = {
  exercise: string
  action: 'modify' | 'replace' | 'skip'
  suggestion: string
  reason: string
}

const actionConfig = {
  modify: {
    label: 'Modify',
    badgeClass: 'bg-[#F5EBD8] text-[#8A6030]',
    borderClass: 'border-l-[#C9975A]',
  },
  replace: {
    label: 'Replace',
    badgeClass: 'bg-[#DDE8E4] text-[#3A6657]',
    borderClass: 'border-l-[#5A9E86]',
  },
  skip: {
    label: 'Skip',
    badgeClass: 'bg-[#EDE0DF] text-[#7A3F3C]',
    borderClass: 'border-l-[#B87270]',
  },
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [modificationType, setModificationType] = useState<ModificationType>('')
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setSuggestions(null)
      setError('')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) {
      setFile(dropped)
      setSuggestions(null)
      setError('')
    }
  }

  const handleSubmit = async () => {
    if (!file || !modificationType || loading) return

    setLoading(true)
    setError('')
    setSuggestions(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('modificationType', modificationType)
    formData.append('details', details)

    try {
      const response = await fetch('/api/modify-flow', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
      } else {
        setSuggestions(data.suggestions)
      }
    } catch {
      setError('Could not connect to the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const modificationOptions = [
    {
      id: 'injury' as const,
      label: '🩹 Injury',
      desc: 'Adapt exercises for an injury',
      placeholder: 'e.g. left knee injury, lower back pain',
    },
    {
      id: 'pregnancy' as const,
      label: '🤰 Pregnancy',
      desc: 'Make the flow safe for pregnancy',
      placeholder: 'e.g. 2nd trimester, 28 weeks',
    },
    {
      id: 'beginner' as const,
      label: '🌱 Beginner',
      desc: 'Simplify for a new student',
      placeholder: 'e.g. first pilates class',
    },
    {
      id: 'advanced' as const,
      label: '🔥 Advanced',
      desc: 'Intensify for an experienced student',
      placeholder: 'e.g. 5 years experience, strong core',
    },
  ]

  const selectedOption = modificationOptions.find((o) => o.id === modificationType)
  const canSubmit = !!file && !!modificationType && details.trim().length > 0 && !loading

  return (
    <div className="min-h-screen bg-[#F7F4F0] py-16 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="font-[family-name:var(--font-playfair)] text-6xl font-semibold text-[#1C1916] tracking-tight mb-5">
            AdaptaFlow
          </h1>
          <div className="w-10 h-px bg-[#D4C5B8] mx-auto mb-5" />
          <p className="text-[#8C8279] text-sm max-w-xs mx-auto leading-relaxed">
            Upload your class flow and receive tailored modification suggestions for your student.
          </p>
        </div>

        {/* Info section */}
        <div className="mb-10">

          {/* Top row: What does AdaptaFlow do / What can I upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start mb-3">

            {/* What does AdaptaFlow do? */}
            <div className="bg-white rounded-3xl border border-[#E8E1D8] shadow-[0_2px_20px_rgba(0,0,0,0.05)] p-6">
              <h2 className="font-[family-name:var(--font-playfair)] text-lg text-[#1C1916] mb-3">
                What does AdaptaFlow do?
              </h2>
              <p className="text-[#5C534C] text-sm leading-relaxed">
                AdaptaFlow is a tool designed for pilates instructors. Upload your class flow and let us tailor it to all the different populations that might join your class. AdaptaFlow will analyse each exercise and give you specific, practical suggestions on what to modify, replace, or skip. No full rewrites, just clear guidance where it matters.
              </p>
            </div>

            {/* What can I upload? */}
            <div className="bg-white rounded-3xl border border-[#E8E1D8] shadow-[0_2px_20px_rgba(0,0,0,0.05)] p-6">
              <h2 className="font-[family-name:var(--font-playfair)] text-lg text-[#1C1916] mb-3">
                What can I upload?
              </h2>
              <p className="text-[#5C534C] text-sm leading-relaxed mb-4">
                Upload any document that lists your exercises or session plan. The clearer the structure, the better the suggestions.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { format: 'PDF', desc: 'Exported flow sheets or printed plans' },
                  { format: 'Word', desc: '.docx or .doc files from your templates' },
                  { format: 'Excel', desc: '.xlsx, .xls or .csv spreadsheets' },
                  { format: 'Image', desc: 'JPG, PNG or WebP photos of handwritten or printed flows' },
                ].map(({ format, desc }) => (
                  <div key={format} className="bg-[#F7F4F0] rounded-2xl p-3">
                    <p className="text-xs font-semibold text-[#1C1916] mb-1">{format}</p>
                    <p className="text-[#B5ADA6] text-xs leading-snug">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Pilates styles — full width card with 2-column inside */}
          <div className="bg-white rounded-3xl border border-[#E8E1D8] shadow-[0_2px_20px_rgba(0,0,0,0.05)] p-6">
            <h2 className="font-[family-name:var(--font-playfair)] text-lg text-[#1C1916] mb-1">
              Which pilates styles are supported?
            </h2>
            <p className="text-[#5C534C] text-sm leading-relaxed mb-5">
              AdaptaFlow works across every pilates discipline and teaching method. Simply upload your flow and it adapts its suggestions to the equipment, style, and approach it detects.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Left: Equipment & style */}
              <div>
                <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[#B5ADA6] mb-2">Equipment & style</p>
                <div className="space-y-0">
                  {[
                    { style: 'Mat Pilates', desc: 'Floor-based sequences using bodyweight, small props, or resistance bands.' },
                    { style: 'Reformer Pilates', desc: 'Spring-resistance exercises on the reformer carriage, for both studio and home reformer flows.' },
                    { style: 'Classical Pilates', desc: 'Traditional sequences based on the original Joseph Pilates repertoire and order.' },
                    { style: 'Clinical Pilates', desc: 'Rehabilitation-focused work, often used in physiotherapy and injury recovery settings.' },
                    { style: 'Tower, Cadillac, Chair & Barrel', desc: 'Full apparatus work including wall unit, trapeze table, Wunda Chair, and arc barrel.' },
                  ].map(({ style, desc }) => (
                    <div key={style} className="flex gap-3 py-3 border-b border-[#F0EBE5] last:border-0 last:pb-0">
                      <div className="w-1 shrink-0 rounded-full bg-[#D4C5B8] mt-1" />
                      <div>
                        <p className="text-sm font-semibold text-[#1C1916] mb-0.5">{style}</p>
                        <p className="text-xs text-[#8C8279] leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Teaching methods */}
              <div>
                <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[#B5ADA6] mb-2">Teaching methods</p>
                <div className="space-y-0">
                  {[
                    { style: 'BASI Pilates', desc: 'Body Arts and Science International method, known for its block system and evidence-based approach.' },
                    { style: 'Stott Pilates', desc: 'Contemporary method with a strong focus on spinal rehabilitation and modern biomechanics.' },
                    { style: 'Other methods', desc: 'Polestar, Peak, Romana, Balanced Body, and any other structured teaching system.' },
                  ].map(({ style, desc }) => (
                    <div key={style} className="flex gap-3 py-3 border-b border-[#F0EBE5] last:border-0 last:pb-0">
                      <div className="w-1 shrink-0 rounded-full bg-[#D4C5B8] mt-1" />
                      <div>
                        <p className="text-sm font-semibold text-[#1C1916] mb-0.5">{style}</p>
                        <p className="text-xs text-[#8C8279] leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Divider before the form */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px bg-[#E8E1D8]" />
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#C4B9AF] font-semibold">Your flow</p>
          <div className="flex-1 h-px bg-[#E8E1D8]" />
        </div>

        {/* Form — narrow and centered */}
        <div className="max-w-xl mx-auto">

        {/* Step 1: Upload */}
        <div className="bg-white rounded-3xl border border-[#E8E1D8] shadow-[0_2px_20px_rgba(0,0,0,0.05)] p-6 mb-3">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-6 h-6 rounded-full border border-[#C4B9AF] text-[#8C8279] text-[10px] font-semibold flex items-center justify-center shrink-0">
              1
            </span>
            <p className="text-xs font-semibold tracking-[0.12em] text-[#8C8279] uppercase">
              Upload your flow
            </p>
          </div>
          <div
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-[#C4B9AF] bg-[#F7F4F0]'
                : file
                ? 'border-[#2A2420] bg-[#F7F4F0]'
                : 'border-[#E8E1D8] hover:border-[#C4B9AF] hover:bg-[#FAF8F5]'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,.doc,.txt,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.webp"
              className="hidden"
            />
            {file ? (
              <div>
                <div className="w-9 h-9 rounded-full bg-[#2A2420] flex items-center justify-center mx-auto mb-3">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-[#1C1916] font-medium text-sm">{file.name}</p>
                <p className="text-[#B5ADA6] text-xs mt-1">Click to change file</p>
              </div>
            ) : (
              <div>
                <div className="w-9 h-9 rounded-full border border-[#E8E1D8] flex items-center justify-center mx-auto mb-3">
                  <svg className="w-4 h-4 text-[#B5ADA6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-[#5C534C] font-medium text-sm">Drop your flow here, or click to browse</p>
                <p className="text-[#B5ADA6] text-xs mt-1">PDF, Word, Excel, image, or plain text</p>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Modification type */}
        <div className="bg-white rounded-3xl border border-[#E8E1D8] shadow-[0_2px_20px_rgba(0,0,0,0.05)] p-6 mb-3">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-6 h-6 rounded-full border border-[#C4B9AF] text-[#8C8279] text-[10px] font-semibold flex items-center justify-center shrink-0">
              2
            </span>
            <p className="text-xs font-semibold tracking-[0.12em] text-[#8C8279] uppercase">
              Who is joining?
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {modificationOptions.map(({ id, label, desc }) => (
              <button
                key={id}
                onClick={() => {
                  setModificationType(id)
                  setDetails('')
                }}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  modificationType === id
                    ? 'border-[#2A2420] bg-[#2A2420]'
                    : 'border-[#E8E1D8] hover:border-[#C4B9AF]'
                }`}
              >
                <div className={`font-semibold text-sm ${modificationType === id ? 'text-white' : 'text-[#1C1916]'}`}>
                  {label}
                </div>
                <div className={`text-xs mt-0.5 leading-tight ${modificationType === id ? 'text-[#9E9189]' : 'text-[#B5ADA6]'}`}>
                  {desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Details */}
        <div className="bg-white rounded-3xl border border-[#E8E1D8] shadow-[0_2px_20px_rgba(0,0,0,0.05)] p-6 mb-3">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-6 h-6 rounded-full border border-[#C4B9AF] text-[#8C8279] text-[10px] font-semibold flex items-center justify-center shrink-0">
              3
            </span>
            <p className="text-xs font-semibold tracking-[0.12em] text-[#8C8279] uppercase">
              Add details
            </p>
          </div>
          <input
            type="text"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={selectedOption?.placeholder ?? 'e.g. left knee injury, 2nd trimester, first pilates class…'}
            className="w-full px-4 py-3 rounded-full border border-[#E8E1D8] bg-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#C4B9AF] text-[#1C1916] placeholder:text-[#C4B9AF] text-sm"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full py-4 rounded-full font-semibold text-sm tracking-widest uppercase transition-all mt-1 ${
            canSubmit
              ? 'bg-[#2A2420] text-white hover:bg-[#1C1916] active:scale-[0.99] shadow-[0_4px_24px_rgba(42,36,32,0.18)]'
              : 'bg-[#EAE5DF] text-[#C4B9AF] cursor-not-allowed'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Analysing your flow...
            </span>
          ) : (
            'Get suggestions'
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-[#EDE0DF] border border-[#D4B8B6] rounded-2xl text-[#7A3F3C] text-sm">
            {error}
          </div>
        )}

        {/* Suggestions */}
        {suggestions !== null && (
          <div className="mt-12">
            {suggestions.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#E8E1D8] shadow-[0_2px_20px_rgba(0,0,0,0.05)] p-10 text-center">
                <div className="w-10 h-10 rounded-full border border-[#C4B9AF] flex items-center justify-center mx-auto mb-4">
                  <svg className="w-5 h-5 text-[#8C8279]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-[family-name:var(--font-playfair)] text-lg text-[#1C1916] mb-1">No changes needed</p>
                <p className="text-[#B5ADA6] text-sm">Your flow looks great as-is for this student.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-[family-name:var(--font-playfair)] text-xl text-[#1C1916]">
                    {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}
                  </h2>
                  <div className="flex gap-2 flex-wrap justify-end">
                    {(['modify', 'replace', 'skip'] as const)
                      .filter((a) => suggestions.some((s) => s.action === a))
                      .map((action) => (
                        <span
                          key={action}
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${actionConfig[action].badgeClass}`}
                        >
                          {suggestions.filter((s) => s.action === action).length}{' '}
                          {actionConfig[action].label.toLowerCase()}
                        </span>
                      ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      className={`bg-white rounded-2xl border border-[#E8E1D8] border-l-4 ${actionConfig[s.action].borderClass} shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-5`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="font-semibold text-[#1C1916] text-sm leading-snug">{s.exercise}</p>
                        <span
                          className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full ${actionConfig[s.action].badgeClass}`}
                        >
                          {actionConfig[s.action].label}
                        </span>
                      </div>
                      <p className="text-[#3D352F] text-sm leading-relaxed mb-3">{s.suggestion}</p>
                      <div className="w-full h-px bg-[#F0EBE5] mb-3" />
                      <p className="text-[#B5ADA6] text-xs leading-relaxed">
                        <span className="font-medium text-[#8C8279]">Why: </span>
                        {s.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[#C4B9AF] text-[10px] tracking-widest uppercase mt-12">
          AdaptaFlow
        </p>

        </div>{/* end form wrapper */}
      </div>
    </div>
  )
}
