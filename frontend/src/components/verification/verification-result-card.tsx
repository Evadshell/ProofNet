"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface VerificationDetails {
  distance?: number
  rttDistance?: number
  actualRtt?: number
  expectedRtt?: number
  confidence?: number
  reason?: string
  tolerance?: number
}

interface Verification {
  verificationId: string
  targetSessionId: string
  verifierSessionId: string
  timestamp?: number
  result?: string
  status?: string
  details?: VerificationDetails
}

interface VerificationResultCardProps {
  verification: Verification
}

export function VerificationResultCard({ verification }: VerificationResultCardProps) {
  // Use state to avoid hydration mismatch
  const [displayStatus, setDisplayStatus] = useState<string>("pending")
  const [formattedTimestamp, setFormattedTimestamp] = useState<string>("Unknown")
  const [formattedDiscrepancy, setFormattedDiscrepancy] = useState<string>("Unknown")

  // Update state after component mounts to avoid hydration issues
  useEffect(() => {
    // Determine what status to display (result or status field)
    setDisplayStatus(verification.result || verification.status || "pending")

    // Format timestamp
    if (verification.timestamp) {
      setFormattedTimestamp(new Date(Number(verification.timestamp)).toLocaleString())
    }

    // Format distance discrepancy
    if (verification.details) {
      const { distance, rttDistance } = verification.details
      if (distance !== undefined && rttDistance !== undefined) {
        const diff = Math.abs(Number(distance) - Number(rttDistance))
        const percentage = (diff / Number(distance || 1)) * 100
        setFormattedDiscrepancy(`${diff.toFixed(2)} km (${isFinite(percentage) ? percentage.toFixed(1) : "N/A"}%)`)
      }
    }
  }, [verification])

  // Calculate a color based on confidence
  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return "text-gray-500"
    const confNum = Number(confidence)
    if (confNum >= 80) return "text-green-600"
    if (confNum >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  // Get status badge with enhanced styling
  const getStatusBadge = (result?: string, details?: VerificationDetails) => {
    if (!result) return <Badge variant="outline">Unknown</Badge>

    switch (result.toLowerCase()) {
      case "verified":
        return (
          <div className="flex flex-col items-center">
            <Badge className="bg-green-500 mb-1">Verified</Badge>
            {details?.confidence && (
              <span className={`text-xs ${getConfidenceColor(details.confidence)}`}>
                {details.confidence}% confidence
              </span>
            )}
          </div>
        )
      case "rejected":
      case "suspicious":
        return (
          <div className="flex flex-col items-center">
            <Badge className="bg-red-500 mb-1">Rejected</Badge>
            {details?.confidence && (
              <span className={`text-xs ${getConfidenceColor(details.confidence)}`}>
                {details.confidence}% confidence
              </span>
            )}
          </div>
        )
      case "pending":
        return (
          <div className="flex flex-col items-center">
            <Badge className="bg-yellow-500">Pending</Badge>
            <span className="text-xs text-gray-500">Awaiting result</span>
          </div>
        )
      default:
        return <Badge variant="outline">{result}</Badge>
    }
  }

  return (
    <Card key={verification.verificationId} className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="font-medium text-lg">Verification {verification.verificationId.substring(0, 8)}</p>
            <p className="text-sm text-gray-500">{formattedTimestamp}</p>
          </div>
          {getStatusBadge(displayStatus, verification.details)}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-gray-500 font-medium">Target:</p>
            <p className="truncate">{verification.targetSessionId || "Unknown"}</p>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-gray-500 font-medium">Verifier:</p>
            <p className="truncate">{verification.verifierSessionId || "Unknown"}</p>
          </div>
        </div>

        {verification.details && (
          <div className="mt-4 pt-4 border-t">
            <p className="font-medium mb-3">Verification Details:</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <p className="text-gray-500 font-medium">IP-based Distance:</p>
                <p>
                  {typeof verification.details.distance !== "undefined"
                    ? Number(verification.details.distance).toFixed(2)
                    : "Unknown"}{" "}
                  km
                </p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">RTT-based Distance:</p>
                <p>
                  {verification.details.rttDistance !== undefined
                    ? Number(verification.details.rttDistance).toFixed(2)
                    : "Unknown"}{" "}
                  km
                </p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">Distance Discrepancy:</p>
                <p>{formattedDiscrepancy}</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">Tolerance Used:</p>
                <p>{verification.details.tolerance || "1.00"} km</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">Actual RTT:</p>
                <p>
                  {verification.details.actualRtt !== undefined
                    ? Number(verification.details.actualRtt).toFixed(2)
                    : "Unknown"}{" "}
                  ms
                </p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">Expected RTT:</p>
                <p>
                  {verification.details.expectedRtt !== undefined
                    ? Number(verification.details.expectedRtt).toFixed(2)
                    : "Unknown"}{" "}
                  ms
                </p>
              </div>
            </div>
            {verification.details.reason && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                <p className="text-gray-700 font-medium">Analysis:</p>
                <p className="text-sm">{verification.details.reason}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

