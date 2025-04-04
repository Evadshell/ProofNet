"use client"
import { Wallet } from "lucide-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"

interface WalletInfoProps {
  walletAddress: string
  isConnected: boolean
}

export function WalletInfo({ walletAddress, isConnected }: WalletInfoProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Wallet className={isConnected ? "text-green-500" : "text-gray-400"} size={20} />
      {isConnected ? (
        <div className="text-sm">
          <span className="font-medium">Connected: </span>
          <span className="text-xs text-gray-500">
            {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
          </span>
        </div>
      ) : (
        <div className="text-sm text-gray-500">Wallet not connected</div>
      )}
      <div className="ml-auto">
        <WalletMultiButton className="!bg-primary hover:!bg-primary/90 text-white rounded-md px-3 py-1 text-xs" />
      </div>
    </div>
  )
}

