import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock } from "lucide-react"

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

interface VerificationHistoryProps {
  verifications: Verification[]
}

export function VerificationHistory({ verifications }: VerificationHistoryProps) {
  // Format timestamp
  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "Unknown time"
    return new Date(timestamp).toLocaleTimeString()
  }

  // Get status icon and color
  const getStatusInfo = (verification: Verification) => {
    if (verification.result === "verified") {
      return {
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        label: "Verified",
        variant: "default" as const,
      }
    } else if (verification.result === "rejected") {
      return {
        icon: <XCircle className="h-4 w-4 text-red-500" />,
        label: "Rejected",
        variant: "destructive" as const,
      }
    } else {
      return {
        icon: <Clock className="h-4 w-4 text-yellow-500" />,
        label: "Pending",
        variant: "outline" as const,
      }
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Verification History</h3>

      {verifications.length === 0 ? (
        <p className="text-muted-foreground">No verification history available.</p>
      ) : (
        <div className="space-y-3">
          {verifications.map((verification) => {
            const statusInfo = getStatusInfo(verification)

            return (
              <Card key={verification.verificationId}>
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">Verification {verification.verificationId.substring(0, 8)}</h4>
                        <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                          {statusInfo.icon}
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {verification.targetSessionId === verification.verifierSessionId
                          ? "Self-verification"
                          : `With: ${verification.verifierSessionId.substring(0, 8)}`}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatTime(verification.timestamp)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

