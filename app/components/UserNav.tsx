'use client'

import { useEffect, useState } from 'react'

type UserStatus = {
  count: number
  isPro: boolean
}

export default function UserNav() {
  const [status, setStatus] = useState<UserStatus | null>(null)

  useEffect(() => {
    fetch('/api/user-status')
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {})
  }, [])

  if (!status) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <span className="text-xs text-[#8C8279] bg-white border border-[#E8E1D8] rounded-full px-3 py-1 shadow-sm">
        {status.isPro ? (
          <span className="text-[#5A9E86] font-semibold">Pro</span>
        ) : status.count < 1 ? (
          <span>1 free use remaining</span>
        ) : (
          <span className="text-[#C9975A] font-semibold">Upgrade to Pro</span>
        )}
      </span>
    </div>
  )
}
