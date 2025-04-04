/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useProgram } from "@/components/setup"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import * as anchor from "@coral-xyz/anchor"

export function DebugContract() {
  const { program } = useProgram()
  const wallet = useWallet()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userAccounts, setUserAccounts] = useState<any[]>([])
  const [verificationAccounts, setVerificationAccounts] = useState<any[]>([])

  const fetchAllAccounts = async () => {
    if (!program || !wallet.publicKey) {
      setError("Wallet not connected or program not loaded")
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch all user accounts
      const users = await (program.account as any ).user.all()
      setUserAccounts(users)

      // Fetch all verification accounts
      const verifications = await (program.account as any).verification.all()
      setVerificationAccounts(verifications)

      console.log("User accounts:", users)
      console.log("Verification accounts:", verifications)
    } catch (err: any) {
      console.error("Error fetching accounts:", err)
      setError(err.message || "Failed to fetch accounts")
    } finally {
      setLoading(false)
    }
  }
  const fetchUser = async () => {
    if (!program || !wallet.publicKey) {
      console.error("Wallet not connected or program not loaded")
      return null
    }
  
    try {
      // Derive the PDA using the wallet address (not sessionId)
      const [userPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user"), wallet.publicKey.toBuffer()],
        program.programId
      )
  
      // Fetch user data
      const user = await (program.account as any).user.fetchNullable(userPda)
  
      if (!user) {
        console.error("User not found on-chain")
        return null
      }
  
      console.log("Fetched User:", user)
      return user
    } catch (error) {
      console.error("Error fetching user:", error)
      console.error("Failed to fetch user data")
      return null
    }
  }
  const createTestUser = async () => {
    if (!program || !wallet.publicKey) {
      setError("Wallet not connected or program not loaded")
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Generate a new keypair for the user account
      const userKeypair = anchor.web3.Keypair.generate()
      const sessionId = `test-${Date.now().toString().slice(-6)}`

      // Call the addUser method
      const tx = await program.methods
        .addUser(sessionId)
        .accounts({
          user: userKeypair.publicKey,
          signer: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc()

      console.log("Test user created:", {
        tx,
        publicKey: userKeypair.publicKey.toString(),
        sessionId,
      })

      // Refresh accounts
      await fetchAllAccounts()
      await fetchUser();

    } catch (err: any) {
      console.error("Error creating test user:", err)
      setError(err.message || "Failed to create test user")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Solana Contract Debugger</CardTitle>
        <CardDescription>View and test your Solana contract integration</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">User Accounts ({userAccounts.length})</h3>
            <div className="mt-2 max-h-60 overflow-auto rounded border p-2">
              {userAccounts.length > 0 ? (
                userAccounts.map((account, i) => (
                  <div key={i} className="mb-2 rounded bg-muted p-2 text-sm">
                    <p>
                      <strong>Public Key:</strong> {account.publicKey.toString()}
                    </p>
                    <p>
                      <strong>Session ID:</strong> {account.account.clientSessionId}
                    </p>
                    <p>
                      <strong>Verified:</strong> {account.account.isVerified ? "Yes" : "No"}
                    </p>
                    <p>
                      <strong>Verified By:</strong> {account.account.verifiedBy?.length || 0} users
                    </p>
                    <p>
                      <strong>Users Verified:</strong> {account.account.usersVerified?.length || 0}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No user accounts found</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium">Verification Accounts ({verificationAccounts.length})</h3>
            <div className="mt-2 max-h-60 overflow-auto rounded border p-2">
              {verificationAccounts.length > 0 ? (
                verificationAccounts.map((account, i) => (
                  <div key={i} className="mb-2 rounded bg-muted p-2 text-sm">
                    <p>
                      <strong>Public Key:</strong> {account.publicKey.toString()}
                    </p>
                    <p>
                      <strong>Verified By:</strong> {account.account.verifiedBy}
                    </p>
                    <p>
                      <strong>Target Session:</strong> {account.account.targetedSessionId}
                    </p>
                    <p>
                      <strong>Status:</strong> {account.account.status}
                    </p>
                    <p>
                      <strong>Timestamp:</strong> {new Date(account.account.timestamp * 1000).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No verification accounts found</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={fetchAllAccounts} disabled={loading} variant="outline">
          {loading ? "Loading..." : "Refresh Accounts"}
        </Button>
        <Button onClick={createTestUser} disabled={loading}>
          {loading ? "Creating..." : "Create Test User"}
        </Button>
      </CardFooter>
    </Card>
  )
}

