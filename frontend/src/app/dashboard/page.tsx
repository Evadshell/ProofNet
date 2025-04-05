/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { io, type Socket } from "socket.io-client"
import { useWallet } from "@solana/wallet-adapter-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Clock, Radio, Wifi } from "lucide-react"
import * as anchor from "@coral-xyz/anchor"
import { useProgram } from "@/components/setup"
import { PublicKey } from "@solana/web3.js"

import { TokenDisplay } from "@/components/verification/token-display"
import { VerificationProgressBar } from "@/components/verification/verification-progress-bar"
import { VerificationResultCard } from "@/components/verification/verification-result-card"
import { VerificationHistory } from "@/components/verification/verification-history"
import { WalletInfo } from "@/components/verification/wallet-info"
import { SessionCard } from "@/components/verification/session-card"

import { DebugContract } from "@/components/debug-contract"

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

interface ResponseType {
  success: boolean
  message: string
  timestamp?: number
  requestId?: string
}

interface UserData {
  walletAddress: string
  isVerified: boolean
  verifiedBy: string[]
  verifiedUsers: string[]
  tokens: number
  sessionId: string | null
  pastSessionIds?: string[]
  publicKey?: string
}

const VERIFICATION_TOKENS_REWARD = 10
const REQUIRED_VERIFICATIONS = 3
const REQUEST_TIMEOUT = 5000

export default function Dashboard() {
  const { program } = useProgram()
  const wallet = useWallet()
  const [KyPair, setKeyPair] = useState<anchor.web3.Keypair>()
  const [isVerified, Verified] = useState()
  const [verifiedBy, setVerifiedBy] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [message, setMessage] = useState("")
  const [response, setResponse] = useState<ResponseType | null>(null)
  const [activeSessions, setActiveSessions] = useState<Session[]>([])
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [clientSessionId, setClientSessionId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStates, setLoadingStates] = useState({
    registration: false,
    verificationRequest: false,
    activeSessions: false,
    verificationStatus: false,
  })
  const [isRefreshingActiveSessions, setIsRefreshingActiveSessions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [userData, setUserData] = useState<UserData>({
    walletAddress: "",
    isVerified: false,
    verifiedBy: [],
    verifiedUsers: [],
    tokens: 0,
    sessionId: null,
  })
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null)
  const [userAccount, setUserAccount] = useState<any>(null)

  const socketRef = useRef<Socket | null>(null)
  const SOCKET_SERVER = process.env.NEXT_PUBLIC_SOCKET_SERVER
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const activeSessionsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const loadingTimeoutsRef = useRef<{ [key: string]: NodeJS.Timeout | null }>({})

  const { publicKey, connected } = useWallet()
  const walletAddress = publicKey ? publicKey.toString() : ""

  const clearLoadingTimeout = useCallback((key: string) => {
    if (loadingTimeoutsRef.current[key]) {
      clearTimeout(loadingTimeoutsRef.current[key]!)
      loadingTimeoutsRef.current[key] = null
    }
  }, [])
  const setSpecificLoading = useCallback((key: keyof typeof loadingStates, value: boolean) => {
    setLoadingStates((prev) => ({
      ...prev,
      [key]: value,
    }))
  }, [])
  async function getWallets() {
    const response = await fetch("/api/wallet")
    return response.json()
  }

  useEffect(() => {
    async function fetchData() {
      Verified(await getWallets())
    }
    fetchData()
  }, [])

  const setLoadingTimeout = useCallback(
    (key: string, callback: () => void, timeout: number) => {
      clearLoadingTimeout(key)
      loadingTimeoutsRef.current[key] = setTimeout(callback, timeout)
    },
    [clearLoadingTimeout],
  )

  const saveUserOnChain = useCallback(
    async (sessionId: string) => {
      if (!program || !wallet.publicKey) {
        toast.error("Wallet not connected or program not loaded")
        return null
      }

      try {
        const userKeypair = anchor.web3.Keypair.generate()
        setKeyPair(userKeypair)

        const tx = await program.methods
          .addUser(sessionId)
          .accounts({
            user: userKeypair.publicKey,
            signer: wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([userKeypair])
          .rpc()

        console.log("User added on-chain:", tx)

        return {
          publicKey: userKeypair.publicKey.toString(),
          tx,
        }
      } catch (error) {
        console.error("Error adding user on-chain:", error)
        toast.error("Failed to save user data on-chain")
        return null
      }
    },
    [program, wallet.publicKey],
  )

  const updateVerificationStatusOnChain = useCallback(
    async (userAccount: PublicKey, verifiedBy: string[]) => {
      if (!program || !wallet.publicKey) {
        toast.error("Wallet not connected or program not loaded")
        return null
      }

      try {
        const tx = await program.methods
          .getVerified(verifiedBy)
          .accounts({
            user: userAccount,
          })
          .rpc()

        console.log("User verification updated on-chain:", tx)

        return {
          tx,
        }
      } catch (error) {
        console.error("Error updating verification status on-chain:", error)
        toast.error("Failed to update verification status on-chain")
        return null
      }
    },
    [program, wallet.publicKey],
  )

  const saveVerificationOnChain = useCallback(
    async (verification: Verification, userAccount: PublicKey) => {
      if (!program || !wallet.publicKey) {
        toast.error("Wallet not connected or program not loaded")
        return null
      }

      try {
        const verificationKeypair = anchor.web3.Keypair.generate()

        const tx = await program.methods
          .addVerification(
            verification.verifierSessionId,
            verification.targetSessionId,
            verification.timestamp || Date.now(),
            verification.result || "pending",
            verification.verifierSessionId,
          )
          .accounts({
            verification: verificationKeypair.publicKey,
            user: userAccount,
            signer: wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([verificationKeypair])
          .rpc()

        console.log("Verification added on-chain:", tx)

        return {
          publicKey: verificationKeypair.publicKey.toString(),
          tx,
        }
      } catch (error) {
        console.error("Error adding verification on-chain:", error)
        toast.error("Failed to save verification data on-chain")
        return null
      }
    },
    [program, wallet.publicKey],
  )

  const fetchUserFromChain = useCallback(async () => {
    if (!program || !wallet.publicKey) {
      return null
    }

    try {
      const userAccounts = await (program.account as any).user.all([
        {
          memcmp: {
            offset: 8,
            bytes: wallet.publicKey.toBase58(),
          },
        },
      ])

      if (userAccounts.length > 0) {
        const userAccount = userAccounts[userAccounts.length - 1]
        setUserAccount(userAccount)

        const userData = {
          walletAddress: wallet.publicKey.toString(),
          isVerified: userAccount.account.isVerified,
          verifiedBy: userAccount.account.verifiedBy || [],
          verifiedUsers: userAccount.account.usersVerified || [],
          tokens: 0,
          sessionId: userAccount.account.clientSessionId,
          pastSessionIds: userAccount.account.pastSessionIds || [],
        }

        setUserData(userData)

        if (userData.sessionId) {
          setSavedSessionId(userData.sessionId)
          setClientSessionId(userData.sessionId)
        }

        return {
          ...userData,
          publicKey: userAccount.publicKey,
        }
      }

      return null
    } catch (error) {
      console.error("Error fetching user data from chain:", error)
      return null
    }
  }, [program, wallet.publicKey])

  const fetchVerificationsFromChain = useCallback(
    async (sessionId: string) => {
      if (!program) {
        return []
      }

      try {
        const verificationAccounts = await (program.account as any).verification.all([
          {
            memcmp: {
              offset: 8,
              bytes: anchor.utils.bytes.utf8.encode(sessionId),
            },
          },
        ])

        return verificationAccounts.map(
          (account: {
            publicKey: { toString: () => any }
            account: {
              targetedSessionId: any
              verifiedBy: any
              timestamp: any
              status: any
            }
          }) => ({
            verificationId: account.publicKey.toString(),
            targetSessionId: account.account.targetedSessionId,
            verifierSessionId: account.account.verifiedBy,
            timestamp: account.account.timestamp,
            result: account.account.status,
            status: account.account.status,
          }),
        )
      } catch (error) {
        console.error("Error fetching verifications from chain:", error)
        return []
      }
    },
    [program],
  )

  const getActiveSessions = useCallback(() => {
    if (socketRef.current && isConnected) {
      setIsRefreshingActiveSessions(true)

      if (activeSessionsTimeoutRef.current) {
        clearTimeout(activeSessionsTimeoutRef.current)
      }

      socketRef.current.emit("executeFunction", {
        functionType: "getActiveSessions",
        timestamp: Date.now(),
      })

      activeSessionsTimeoutRef.current = setTimeout(() => {
        setIsRefreshingActiveSessions(false)
        setError("Request timed out. Please try again.")
        toast.error("Failed to get active sessions. Please try again.")
      }, REQUEST_TIMEOUT)
    } else {
      toast.error("Please wait for the connection to be established")
    }
  }, [isConnected])

  const autoSelectVerificationSession = useCallback(() => {
    if (activeSessions.length === 0) {
      toast.error("No active sessions available for verification")
      return false
    }

    const sessionIdToUse = savedSessionId || clientSessionId
    const otherSessions = activeSessions.filter((session) => session.sessionId !== sessionIdToUse)

    if (otherSessions.length === 0) {
      toast.error("No other sessions available for verification")
      return false
    }

    setSelectedSession(otherSessions[0].sessionId)
    return true
  }, [activeSessions, savedSessionId, clientSessionId])

  const handleSuccessfulRegistration = useCallback(
    (sessionId: string) => {
      setSuccessMessage(`Successfully registered with session ID: ${sessionId}`)
      toast.success(`Successfully registered with session ID: ${sessionId}`)

      setSavedSessionId(sessionId)

      setUserData((prev) => ({
        ...prev,
        sessionId: sessionId,
      }))

      setClientSessionId("")

      setTimeout(() => {
        getActiveSessions()
      }, 500)
    },
    [getActiveSessions],
  )

  const handleVerificationComplete = useCallback(
    async (verification: Verification) => {
      if (verification.result === "verified" && walletAddress && program && wallet.publicKey) {
        try {
          const userData = await fetchUserFromChain()

          if (userData && userData.publicKey) {
            const verifiedBy = userData.verifiedBy || []

            const verifierSessionId = verification.verifierSessionId
            if (!verifiedBy.includes(verifierSessionId)) {
              const updatedVerifiedBy = [...verifiedBy, verifierSessionId]

              const isNowVerified = updatedVerifiedBy.length >= REQUIRED_VERIFICATIONS

              console.log("Updating user verification status:", {
                walletAddress,
                verifiedBy: updatedVerifiedBy,
                verifiedByCount: updatedVerifiedBy.length,
                isNowVerified,
              })
              if (KyPair) {
                if (isNowVerified && !userData.isVerified) {
                  await updateVerificationStatusOnChain(KyPair?.publicKey, updatedVerifiedBy)
                }
              }

              setUserData((prev) => ({
                ...prev,
                verifiedBy: updatedVerifiedBy,
                tokens: prev.tokens + VERIFICATION_TOKENS_REWARD,
                isVerified: isNowVerified,
                sessionId: prev.sessionId || savedSessionId,
              }))

              setTimeout(async () => {
                await fetchUserFromChain()
              }, 2000)
            }
          }
        } catch (error) {
          console.error("Error updating user data after verification:", error)
          toast.error("Failed to update verification status")
        }
      }
      // Inside handleVerificationComplete function, after updating user data
      if (verification.result === "verified" && walletAddress) {
        try {
          // Save wallet verification status to MongoDB
          const response = await fetch("/api/wallet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ walletAddress, isVerified: true }),
          })

          if (response.ok) {
            console.log("Wallet verification status saved to MongoDB")
            toast.success("Wallet verification status saved")
          } else {
            console.error("Failed to save wallet verification status")
            toast.error("Failed to save verification status")
          }
        } catch (error) {
          console.error("Error saving wallet verification status:", error)
        }
      }
    },
    [
      walletAddress,
      program,
      wallet.publicKey,
      fetchUserFromChain,
      savedSessionId,
      updateVerificationStatusOnChain,
      KyPair,
    ],
  )

  const checkVerificationStatus = useCallback(async () => {
    if (!walletAddress) {
      toast.error("Wallet not connected")
      return
    }

    try {
      setSpecificLoading("verificationStatus", true)

      // Check if user should be verified based on verification count
      const shouldBeVerified = verifiedBy.length >= REQUIRED_VERIFICATIONS

      console.log("Verification status check:", {
        currentStatus: verifiedBy,
        verifiedByCount: verifiedBy.length,
      })

      // Save verification status to MongoDB
      try {
        const response = await fetch("/api/wallet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress, isVerified: shouldBeVerified }),
        })

        if (response.ok) {
          console.log("Wallet verification status saved to MongoDB")
        } else {
          console.error("Failed to save wallet verification status")
        }
      } catch (error) {
        console.error("Error saving to MongoDB:", error)
      }

      // Update on-chain status if needed
      if (KyPair && KyPair.publicKey && shouldBeVerified) {
        const tx = await updateVerificationStatusOnChain(KyPair.publicKey, verifiedBy)
        console.log("On-chain update transaction:", tx)
      } else if (shouldBeVerified) {
        console.error("Keypair is undefined or does not have a publicKey")
        toast.error("Failed to update verification status on-chain")
      }

      // Update local state
      setUserData((prev) => ({
        ...prev,
        walletAddress: prev.walletAddress,
        isVerified: shouldBeVerified,
        verifiedBy: prev.verifiedBy || [],
        verifiedUsers: prev.verifiedUsers || [],
        tokens: prev.tokens || 0,
        sessionId: prev.sessionId || savedSessionId,
      }))

      toast.info(
        `Current verification status: ${
          shouldBeVerified ? "Verified" : "Not Verified"
        } (${verifiedBy.length}/${REQUIRED_VERIFICATIONS} verifications)`,
      )
    } catch (error) {
      console.error("Error checking verification status:", error)
      toast.error("Failed to check verification status")
    } finally {
      setSpecificLoading("verificationStatus", false)
    }
  }, [walletAddress, verifiedBy, KyPair, savedSessionId, updateVerificationStatusOnChain, setSpecificLoading])

  useEffect(() => {
    if (connected && walletAddress) {
      setUserData((prev) => ({
        ...prev,
        walletAddress: walletAddress,
      }))

      fetchUserFromChain()
    }
  }, [connected, walletAddress, fetchUserFromChain])

  useEffect(() => {
    const fetchInitialUserData = async () => {
      if (walletAddress) {
        try {
          setIsLoading(true)

          // Fetch user data from chain
          const userData = await fetchUserFromChain()

          // Also check if wallet is already verified in MongoDB
          try {
            const response = await fetch("/api/wallet")
            if (response.ok) {
              const wallets = await response.json()
              const walletData = wallets.find((w: { walletAddress: string }) => w.walletAddress === walletAddress)

              if (walletData && walletData.isVerified) {
                // Update local state if wallet is verified in MongoDB
                setUserData((prev) => ({
                  ...prev,
                  isVerified: true,
                }))
              }
            }
          } catch (error) {
            console.error("Error fetching wallet verification status:", error)
          }

          if (!userData) {
            console.warn("User data not found on chain, user will need to register")
          }
        } catch (error) {
          console.error("Error fetching initial user data:", error)
          toast.error("Failed to fetch user data from chain")
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchInitialUserData()
  }, [walletAddress, fetchUserFromChain, setIsLoading])

  useEffect(() => {
    const fetchInitialVerifications = async () => {
      const sessionIdToUse = savedSessionId || clientSessionId

      if (sessionIdToUse) {
        try {
          setIsLoading(true)

          const fetchedVerifications = await fetchVerificationsFromChain(sessionIdToUse)

          if (fetchedVerifications.length > 0) {
            setVerifications(fetchedVerifications)
          } else {
            setVerifications([])
          }
        } catch (error) {
          console.error("Error fetching verifications:", error)
          toast.error("Failed to fetch verification history")
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchInitialVerifications()
  }, [savedSessionId, clientSessionId, fetchVerificationsFromChain, setIsLoading])

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (activeSessionsTimeoutRef.current) {
      clearTimeout(activeSessionsTimeoutRef.current)
      activeSessionsTimeoutRef.current = null
    }

    const initializeSocket = () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }

      console.log(`Connecting to socket server: ${SOCKET_SERVER}`)

      socketRef.current = io(SOCKET_SERVER, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 30000,
      })

      socketRef.current.on("connect", () => {
        setIsConnected(true)
        setReconnectAttempts(0)
        setMessage(`Connected with ID: ${socketRef.current?.id || "unknown"}`)
        setError(null)

        toast.success("Successfully connected to the verification server")

        socketRef.current?.emit("register", "frontend")

        if (savedSessionId) {
          registerWithSavedSessionId(savedSessionId)
        }
      })

      socketRef.current.on("connect_error", (err) => {
        console.error("Connection error:", err.message)
        setError(`Connection error: ${err.message}`)
        setIsConnected(false)

        setReconnectAttempts((prev) => prev + 1)

        if (reconnectAttempts > 5) {
          toast.error("Unable to connect to the verification server after multiple attempts")
        }
      })

      socketRef.current.on("disconnect", (reason) => {
        setIsConnected(false)
        setMessage(`Disconnected from server: ${reason}`)

        toast.error(`Disconnected from server: ${reason}`)

        timeoutRef.current = setTimeout(() => {
          if (socketRef.current) {
            console.log("Attempting to reconnect...")
            socketRef.current.connect()
          }
        }, 3000)
      })

      socketRef.current.on("functionResponse", (data) => {
        console.log("Received response:", data)
        setResponse(data)

        setIsLoading(false)
        clearLoadingTimeout("functionResponse")

        if (data.success) {
          setSuccessMessage(data.message)
          timeoutRef.current = setTimeout(() => setSuccessMessage(null), 5000)

          toast.success(data.message)
        } else {
          setError(data.message)
          timeoutRef.current = setTimeout(() => setError(null), 5000)

          toast.error(data.message)
        }
      })

      socketRef.current.on("error", (data) => {
        console.error("Socket error:", data)
        setError(data.message || "An error occurred")

        setIsLoading(false)
        setIsRefreshingActiveSessions(false)
        clearLoadingTimeout("error")

        toast.error(data.message || "An error occurred")
      })

      socketRef.current.on("activeSessions", (data) => {
        console.log("Received active sessions:", data)
        setActiveSessions(data.sessions || [])
        setIsRefreshingActiveSessions(false)

        if (activeSessionsTimeoutRef.current) {
          clearTimeout(activeSessionsTimeoutRef.current)
          activeSessionsTimeoutRef.current = null
        }
      })

      socketRef.current.on("verificationResult", (data) => {
        console.log("Received verification result:", data)

        if (data.isFinal || !verifications.some((v) => v.verificationId === data.verificationId)) {
          setVerifications((prev) => {
            const existingIndex = prev.findIndex((v) => v.verificationId === data.verificationId)

            if (existingIndex >= 0) {
              const updated = [...prev]
              updated[existingIndex] = {
                ...updated[existingIndex],
                ...data,

                details: {
                  ...(updated[existingIndex].details || {}),
                  ...(data.details || {}),
                },

                status: data.result || updated[existingIndex].status,
              }

              if (data.isFinal && userAccount?.publicKey) {
                saveVerificationOnChain(updated[existingIndex], new PublicKey(userAccount.publicKey))
                handleVerificationComplete(updated[existingIndex])
              }

              return updated
            } else {
              const newVerification = {
                ...data,
                status: data.result || data.status || "pending",
              }

              if (data.isFinal && userAccount?.publicKey) {
                saveVerificationOnChain(newVerification, new PublicKey(userAccount.publicKey))
                handleVerificationComplete(newVerification)
              }

              return [...prev, newVerification]
            }
          })
        }

        if (data.isFinal) {
          setSuccessMessage(`Verification completed: ${data.result}`)
          timeoutRef.current = setTimeout(() => setSuccessMessage(null), 5000)
          setIsLoading(false)
          clearLoadingTimeout("verificationResult")

          toast.success(`Verification Complete: ${data.result}`)
        }
      })

      socketRef.current.on("verificationRequestSent", (data) => {
        console.log("Verification request sent:", data)
        setSuccessMessage(`Verification request sent to ${data.targetSessionId}`)
        setIsLoading(false)
        clearLoadingTimeout("verificationRequestSent")
        timeoutRef.current = setTimeout(() => setSuccessMessage(null), 5000)

        toast.success(`Verification request sent to ${data.targetSessionId}`)

        setVerifications((prev) => {
          const existing = prev.findIndex((v) => v.verificationId === data.verificationId)
          if (existing >= 0) {
            return prev
          } else {
            const newVerification = {
              verificationId: data.verificationId || `temp-${Date.now()}`,
              targetSessionId: data.targetSessionId,
              verifierSessionId: data.verifierSessionId,
              timestamp: data.timestamp,
              status: "pending",
            }

            if (userAccount?.publicKey) {
              saveVerificationOnChain(newVerification, new PublicKey(userAccount.publicKey))
            }

            return [...prev, newVerification]
          }
        })
      })

      socketRef.current.on("verificationCompleted", (data) => {
        console.log("Verification completed:", data)
        setSuccessMessage(`Verification ${data.verificationId} completed with result: ${data.result}`)
        setIsLoading(false)
        clearLoadingTimeout("verificationCompleted")
        timeoutRef.current = setTimeout(() => setSuccessMessage(null), 5000)

        toast.success(`Verification Complete: ${data.result}`)

        setVerifications((prev) => {
          const existingIndex = prev.findIndex((v) => v.verificationId === data.verificationId)
          if (existingIndex >= 0) {
            const updated = [...prev]
            updated[existingIndex] = {
              ...updated[existingIndex],
              ...data,

              details: {
                ...(updated[existingIndex].details || {}),
                ...(data.details || {}),
              },
              status: data.result || "completed",
            }

            if (userAccount?.publicKey) {
              saveVerificationOnChain(updated[existingIndex], new PublicKey(userAccount.publicKey))
              handleVerificationComplete(updated[existingIndex])
            }

            return updated
          } else {
            const newVerification = {
              ...data,
              status: data.result || "completed",
            }

            if (userAccount?.publicKey) {
              saveVerificationOnChain(newVerification, new PublicKey(userAccount.publicKey))
              handleVerificationComplete(newVerification)
            }

            return [...prev, newVerification]
          }
        })
      })

      socketRef.current.on("registrationConfirmed", (data) => {
        console.log("Registration confirmed:", data)
        if (data.success) {
          if (data.sessionId !== clientSessionId) {
            handleSuccessfulRegistration(data.sessionId)
          }
        } else {
          setError(`Registration failed: ${data.message}`)
        }
        setIsLoading(false)
        clearLoadingTimeout("registrationConfirmed")
      })

      socketRef.current.on("sessionRegistered", (data) => {
        console.log("New session registered:", data)
        setActiveSessions((prev) => {
          const exists = prev.some((s) => s.sessionId === data.sessionId)
          if (exists) return prev
          return [...prev, data]
        })
      })
    }

    initializeSocket()

    const connectionChecker = setInterval(() => {
      if (socketRef.current && !socketRef.current.connected && isConnected) {
        console.log("Socket appears disconnected but state is connected. Fixing...")
        setIsConnected(false)

        socketRef.current.connect()
      }
    }, 10000)

    return () => {
      clearInterval(connectionChecker)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (activeSessionsTimeoutRef.current) {
        clearTimeout(activeSessionsTimeoutRef.current)
      }

      Object.keys(loadingTimeoutsRef.current).forEach((key) => {
        if (loadingTimeoutsRef.current[key]) {
          clearTimeout(loadingTimeoutsRef.current[key]!)
          loadingTimeoutsRef.current[key] = null
        }
      })

      if (socketRef.current) {
        socketRef.current.off("connect")
        socketRef.current.off("connect_error")
        socketRef.current.off("disconnect")
        socketRef.current.off("functionResponse")
        socketRef.current.off("error")
        socketRef.current.off("activeSessions")
        socketRef.current.off("verificationResult")
        socketRef.current.off("verificationRequestSent")
        socketRef.current.off("verificationCompleted")
        socketRef.current.off("sessionRegistered")
        socketRef.current.off("registrationConfirmed")
        socketRef.current.disconnect()
      }
    }
  }, [
    reconnectAttempts,
    walletAddress,
    saveUserOnChain,
    saveVerificationOnChain,
    handleSuccessfulRegistration,
    getActiveSessions,
    verifications,
    savedSessionId,
    isConnected,
    handleVerificationComplete,
    clearLoadingTimeout,
    setLoadingTimeout,
    userAccount,
    fetchUserFromChain,
    setIsLoading,
    KyPair,
  ])

  const registerWithSavedSessionId = useCallback(
    (sessionId: string) => {
      if (socketRef.current && isConnected) {
        console.log(`Auto-registering with saved session ID: ${sessionId}`)

        socketRef.current.emit("registerClient", {
          sessionId: sessionId,
          timestamp: Date.now(),
        })

        socketRef.current.emit("register", "frontend")

        setClientSessionId(sessionId)
      }
    },
    [isConnected],
  )

  const requestVerification = useCallback(() => {
    const sessionIdToUse = savedSessionId || clientSessionId

    if (socketRef.current && isConnected && selectedSession && sessionIdToUse && !isLoading) {
      setSpecificLoading("verificationRequest", true)
      setError(null)

      setLoadingTimeout(
        "requestVerification",
        () => {
          setSpecificLoading("verificationRequest", false)
          setError("Verification request timed out. The request may still be processing.")
          toast.error("Verification request timed out. The request may still be processing.")
        },
        REQUEST_TIMEOUT,
      )
      setVerifiedBy([...verifiedBy, selectedSession])

      socketRef.current.emit("message", {
        action: "requestVerification",
        targetSessionId: selectedSession,
        sessionId: sessionIdToUse,
        timestamp: Date.now(),
      })

      console.log("Requesting verification for session:", selectedSession)

      const payload = {
        functionType: "requestVerification",
        targetSessionId: selectedSession,
        sessionId: sessionIdToUse,
        timestamp: Date.now(),
      }

      socketRef.current.emit("executeFunction", payload)

      setResponse({
        success: true,
        message: `Verification request sent for session ${selectedSession}`,
        timestamp: Date.now(),
      })

      setSuccessMessage(`Verification request sent to ${selectedSession}`)
      toast.success(`Verification request sent to ${selectedSession}`)

      setVerifications((prev) => {
        const existingIndex = prev.findIndex(
          (v) =>
            v.targetSessionId === selectedSession && v.verifierSessionId === sessionIdToUse && v.status === "pending",
        )

        if (existingIndex >= 0) return prev

        const newVerification = {
          verificationId: `frontend-${Date.now()}`,
          targetSessionId: selectedSession,
          verifierSessionId: sessionIdToUse,
          timestamp: Date.now(),
          status: "pending",
        }

        if (userAccount) {
          saveVerificationOnChain(newVerification, new PublicKey(userAccount.publicKey))
        }

        return [...prev, newVerification]
      })
    } else {
      const errorMessage = isLoading
        ? "Request in progress, please wait..."
        : !isConnected
          ? "Not connected to server. Please wait for connection."
          : !selectedSession
            ? "Please select a session or use the 'Get Verified' button"
            : !sessionIdToUse
              ? "Please enter your client session ID"
              : "Unable to send request"

      setError(errorMessage)
      toast.error(errorMessage)
    }
  }, [
    isConnected,
    selectedSession,
    clientSessionId,
    savedSessionId,
    isLoading,
    saveVerificationOnChain,
    setLoadingTimeout,
    userAccount,
  ])

  const registerClient = useCallback(async () => {
    if (socketRef.current && isConnected && clientSessionId) {
      setLoadingTimeout(
        "registerClient",
        () => {
          setSpecificLoading("registration", true)
          setError("Registration timed out. Please try again.")
          toast.error("Registration timed out. Please try again.")
        },
        REQUEST_TIMEOUT,
      )

      socketRef.current.emit("registerClient", {
        sessionId: clientSessionId,
        timestamp: Date.now(),
      })

      socketRef.current.emit("register", "frontend")

      if (program && wallet.publicKey) {
        try {
          toast.loading("Saving session to blockchain...")

          const txResult = await saveUserOnChain(clientSessionId)

          if (txResult) {
            toast.success("Session saved to blockchain successfully")

            handleSuccessfulRegistration(clientSessionId)

            setSpecificLoading("registration", false)
            clearLoadingTimeout("registerClient")
          } else {
            setError("Failed to save session on blockchain. Please try again.")
            toast.error("Failed to save session on blockchain")
            setSpecificLoading("registration", false)
            clearLoadingTimeout("registerClient")
          }
        } catch (error) {
          console.error("Error adding user on-chain: ", error)
          setSpecificLoading("registration", false)
          clearLoadingTimeout("registerClient")
          setError("Failed to register on-chain. Please try again.")
          toast.error("Failed to register on-chain. Please try again.")
        }
      }
    } else {
      const errorMessage = !isConnected
        ? "Not connected to server. Please wait for connection."
        : !clientSessionId
          ? "Please enter your client session ID"
          : "Unable to register client"

      setError(errorMessage)
      toast.error(errorMessage)
    }
  }, [
    isConnected,
    clientSessionId,
    program,
    wallet.publicKey,
    setLoadingTimeout,
    clearLoadingTimeout,
    saveUserOnChain,
    handleSuccessfulRegistration,
    setIsLoading,
  ])

  // Add this useEffect to fetch wallet verification status from MongoDB
  useEffect(() => {
    async function fetchWalletStatus() {
      if (walletAddress) {
        try {
          const response = await fetch("/api/wallet")
          if (response.ok) {
            const wallets = await response.json()
            const walletData = wallets.find((w: { walletAddress: string }) => w.walletAddress === walletAddress)

            if (walletData && walletData.isVerified) {
              // Update local state if wallet is verified in MongoDB
              setUserData((prev) => ({
                ...prev,
                isVerified: true,
              }))
            }
          }
        } catch (error) {
          console.error("Error fetching wallet verification status:", error)
        }
      }
    }

    fetchWalletStatus()
  }, [walletAddress])

  return (
    <div className="container mx-auto p-6 relative">
      <TokenDisplay tokens={userData.tokens} />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className={isConnected ? "text-green-500" : "text-red-500"} />
            Buffalu Communication
          </CardTitle>
          <CardDescription>Connect your UDP client to the verification server</CardDescription>
        </CardHeader>

        <CardContent>
          {/* Add Wallet Info */}
          <WalletInfo walletAddress={walletAddress} isConnected={connected} />

          <div className="mb-4">
            <div
              className={`inline-block px-2 py-1 rounded-full text-sm ${
                isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {isConnected ? "Connected" : "Disconnected"}
            </div>
            <p className="text-gray-600 mt-1">{message}</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-700">Success</AlertTitle>
              <AlertDescription className="text-green-600">{successMessage}</AlertDescription>
            </Alert>
          )}

          {/* Only show registration UI if not verified */}
          {!userData.isVerified && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="clientSessionId">Your Client Session ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="clientSessionId"
                    value={clientSessionId}
                    onChange={(e) => setClientSessionId(e.target.value)}
                    placeholder={savedSessionId ? "Using saved session ID" : "Enter your UDP client session ID"}
                    className="flex-1"
                  />
                  <Button
                    onClick={registerClient}
                    disabled={!isConnected || !clientSessionId || isLoading}
                    className="whitespace-nowrap"
                  >
                    {loadingStates.registration ? "Registering..." : savedSessionId ? "Update Session" : "Register"}
                  </Button>
                </div>
                {savedSessionId && (
                  <p className="text-xs text-green-600">
                    <CheckCircle className="h-3 w-3 inline mr-1" />
                    Using saved session ID: {savedSessionId.substring(0, 8)}...
                  </p>
                )}
                <p className="text-xs text-gray-500">This is the session ID from your UDP client</p>
              </div>

              {(savedSessionId || clientSessionId) && (
                <div className="mt-2">
                  <Button
                    onClick={() => {
                      getActiveSessions()
                      setTimeout(() => {
                        if (autoSelectVerificationSession()) {
                          setTimeout(() => {
                            requestVerification()
                            toast.success("Verification request sent automatically")
                          }, 500)
                        }
                      }, 1000)
                    }}
                    className="w-full"
                    disabled={!isConnected || isLoading}
                    variant="secondary"
                  >
                    Get Verified Now
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">
                    Click to automatically request verification from an available session
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {userData.isVerified ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="text-green-500" />
              Verified Account
            </CardTitle>
            <CardDescription>Your account has been successfully verified</CardDescription>
          </CardHeader>
          <CardContent>
            <VerificationHistory verifications={verifications} />
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="sessions">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
            <TabsTrigger value="verifications">Verifications</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio />
                  Active Sessions
                </CardTitle>
                <CardDescription>Request verification from active sessions</CardDescription>
              </CardHeader>

              <CardContent>
                <VerificationProgressBar verifications={verifications} />

                <div className="mb-4">
                  <Button
                    onClick={getActiveSessions}
                    disabled={!isConnected || isRefreshingActiveSessions}
                    className="flex items-center gap-2"
                  >
                    {isRefreshingActiveSessions ? "Loading..." : "Refresh Sessions"}
                  </Button>
                </div>

                {activeSessions.length > 0 ? (
                  <div className="grid gap-4">
                    {activeSessions.map((session) => (
                      <SessionCard
                        key={session.sessionId}
                        session={session}
                        isSelected={selectedSession === session.sessionId}
                        onClick={() => setSelectedSession(session.sessionId)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                    <p>No active sessions found</p>
                    <p className="text-sm">Click refresh to check for sessions</p>
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <Button
                  onClick={requestVerification}
                  disabled={!isConnected || !selectedSession || (!clientSessionId && !savedSessionId)}
                  className="w-full"
                >
                  {"Request Verification"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="verifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle />
                  Verification Results
                </CardTitle>
                <CardDescription>View the status and results of verification requests</CardDescription>
              </CardHeader>

              <CardContent>
                <VerificationProgressBar verifications={verifications} />

                <div className="mb-6">
                  <Button
                    onClick={checkVerificationStatus}
                    className="w-full mb-4"
                    disabled={!walletAddress || loadingStates.verificationStatus}
                  >
                    {loadingStates.verificationStatus ? "Checking..." : "Check Verification Status"}
                  </Button>
                </div>

                {verifications.length > 0 ? (
                  <div className="grid gap-4">
                    {verifications
                      .filter((v) => v.result === "verified" || v.result === "rejected" || v.status === "pending")
                      .map((verification) => (
                        <VerificationResultCard key={verification.verificationId} verification={verification} />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="mx-auto h-8 w-8 mb-2" />
                    <p>No verifications yet</p>
                    <p className="text-sm">Click Get Verified or request verification manually</p>
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <Button onClick={() => setVerifications([])} variant="outline" className="ml-auto">
                  Clear All Results
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {response && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Server Response</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">{JSON.stringify(response, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
      {/* Add the debug component at the end of the dashboard */}
      {/* <DebugContract /> */}
    </div>
  )
}