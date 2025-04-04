import { Coins } from "lucide-react"

interface TokenDisplayProps {
  tokens: number
}

export function TokenDisplay({ tokens }: TokenDisplayProps) {
  return (
    <div className="absolute top-4 right-4 flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
      <Coins className="h-4 w-4 text-primary" />
      <span className="font-medium">{tokens}</span>
    </div>
  )
}

