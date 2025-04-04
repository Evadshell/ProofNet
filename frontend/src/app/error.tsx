"use client"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center h-screen p-4">
      <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-bold mb-2">Something went wrong!</h2>
      <p className="text-gray-600 mb-6 text-center max-w-md">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <div className="flex gap-4">
        <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        <Button variant="outline" onClick={() => reset()}>
          Try Again
        </Button>
      </div>
    </div>
  )
}

