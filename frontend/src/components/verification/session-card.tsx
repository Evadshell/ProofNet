"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"

interface Session {
  sessionId: string
  userId: string
  ip: string
  location: {
    latitude: number
    longitude: number
  }
  lastSeen: number
  verified: boolean
}

interface SessionCardProps {
  session: Session
  isSelected: boolean
  onClick: () => void
}

export function SessionCard({ session, isSelected, onClick }: SessionCardProps) {
  // Calculate time since last seen
  const timeSince = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)

    if (seconds < 60) return `${seconds} seconds ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
    return `${Math.floor(seconds / 3600)} hours ago`
  }

  return (
    <Card
      className={`cursor-pointer transition-all ${
        isSelected ? "border-primary bg-primary/5" : "hover:border-primary/50"
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium truncate">{session.sessionId}</h3>
            <p className="text-sm text-muted-foreground">User: {session.userId || "Anonymous"}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3" />
              <span>{timeSince(session.lastSeen)}</span>
            </div>
          </div>
          <Badge variant={session.verified ? "default" : "outline"}>
            {session.verified ? "Verified" : "Unverified"}
          </Badge>
        </div>
        <div className="mt-2 text-xs">
          <p>IP: {session.ip}</p>
          <p>
            Location: {session.location.latitude.toFixed(4)}, {session.location.longitude.toFixed(4)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

