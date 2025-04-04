/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect } from "react"

interface Verification {
  result?: string
  status?: string
  details?: {
    confidence?: number
  }
}

interface VerificationProgressBarProps {
  verifications: Verification[]
}

type ConfidenceColor = "bg-green-500" | "bg-yellow-500" | "bg-red-500" | "bg-gray-200"

export function VerificationProgressBar({ verifications = [] }: VerificationProgressBarProps) {
  // Use state to avoid hydration mismatch
  const [completedVerifications, setCompletedVerifications] = useState<Verification[]>([])
  const [progress, setProgress] = useState(0)
  const [confidenceLevels, setConfidenceLevels] = useState<ConfidenceColor[]>([])

  // Update state after component mounts to avoid hydration issues
  useEffect(() => {
    // Filter only completed verifications
    const completed = verifications.filter((v) => v.result === "verified" || v.status === "completed")
    setCompletedVerifications(completed)
    setProgress(Math.min(completed.length, 3))

    // Calculate confidence levels for coloring
    const levels: ConfidenceColor[] = completed.map((v) => {
      const confidence = v.details?.confidence ? Number(v.details.confidence) : 0
      if (confidence > 70) return "bg-green-500"
      if (confidence >= 40) return "bg-yellow-500"
      return "bg-red-500"
    })

    // Fill with empty segments if needed
    while (levels.length < 3) {
      levels.push("bg-gray-200" as ConfidenceColor)
    }

    setConfidenceLevels(levels)
  }, [verifications])

  return (
    <div className="w-full mb-6">
      <div className="flex justify-between text-sm mb-2">
        <span>Verification Progress</span>
        <span>{progress}/3 Verifications</span>
      </div>
      <div className="flex gap-1 h-3 w-full rounded-full overflow-hidden">
        {confidenceLevels.map((color, i) => (
          <div key={i} className={`${color} flex-1 transition-all duration-300`} />
        ))}
      </div>
    </div>
  )
}

