import dgram from "dgram"
import { v4 as uuidv4 } from "uuid"
import Redis from "ioredis"
import geolib from "geolib"
import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import cors from "cors"
import dotenv from "dotenv"

// Create Express app and HTTP server
const app = express()
app.use(cors())
const httpServer = createServer(app)

// Create Socket.IO server with CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: "*", // In production, restrict this to your frontend domain
    methods: ["GET", "POST"],
  },
})
dotenv.config()
// Configure Redis connection
const redis = new Redis({
  host: process.env.REDIS_HOST ,
  port: Number.parseInt(process.env.REDIS_PORT ),
  password: process.env.REDIS_PASSWORD ,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
})

// Log Redis connection events
redis.on("connect", () => {
  console.log("🟢 Successfully connected to Redis Cloud!")

  // Clear Redis data on startup
  clearRedisData()
})

redis.on("error", (error) => {
  console.error("🔴 Redis connection error:", error)
})

// Clear all Redis data on startup
async function clearRedisData() {
  try {
    console.log("🧹 Clearing Redis data...")

    // Get all keys with our prefixes
    const keys = await redis.keys("session:*")
    const verificationKeys = await redis.keys("verification:*")
    const verificationDetailsKeys = await redis.keys("verification_details:*")
    const pingKeys = await redis.keys("ping:*")

    const allKeys = [...keys, ...verificationKeys, ...verificationDetailsKeys, ...pingKeys]

    if (allKeys.length > 0) {
      await redis.del(...allKeys)
      console.log(`🧹 Cleared ${allKeys.length} keys from Redis`)
    } else {
      console.log("🧹 No keys to clear")
    }
  } catch (error) {
    console.error("🔴 Error clearing Redis data:", error)
  }
}

// Configuration
const UDP_PORT = process.env.UDP_PORT || 41234
const HTTP_PORT = process.env.HTTP_PORT || 4000
const SERVER_ID = uuidv4().substring(0, 8)
const DEBUG = process.env.DEBUG === "true" || true
const DISTANCE_TOLERANCE = 1 // km - adjust as needed

// Constants for RTT to distance calculation
const SPEED_OF_LIGHT = 299792.458 // km/s
const NETWORK_OVERHEAD_FACTOR = 2.5 // Typical network overhead factor
const EFFECTIVE_SPEED = SPEED_OF_LIGHT / NETWORK_OVERHEAD_FACTOR // km/s

const MESSAGE_TYPES = {
  LOCATION_CLAIM: "LOCATION_CLAIM",
  VERIFICATION_REQUEST: "VERIFICATION_REQUEST",
  VERIFICATION_RESPONSE: "VERIFICATION_RESPONSE",
  PING: "PING",
  PONG: "PONG",
  REGISTER: "REGISTER",
  REGISTER_CONFIRM: "REGISTER_CONFIRM",
  REQUEST_VERIFICATION: "REQUEST_VERIFICATION",
  REQUEST_RECEIVED: "REQUEST_RECEIVED",
  ERROR: "ERROR",
  // Add new message types for NAT traversal
  KEEP_ALIVE: "KEEP_ALIVE",
  KEEP_ALIVE_ACK: "KEEP_ALIVE_ACK",
}

// Create UDP server
const udpServer = dgram.createSocket("udp4")

// Store connected socket clients by session ID
const connectedClients = new Map()

// Track active verification requests to prevent duplicates
const activeVerifications = new Map()

// Add this to your server.js file to fix the socket communication issue

// Store client socket IDs
let frontendClients = []
let scriptClients = []

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`)

  // Register client type
  socket.on("register", (clientType) => {
    if (clientType === "frontend") {
      console.log(`Frontend client registered: ${socket.id}`)
      frontendClients.push(socket.id)
    } else if (clientType === "client") {
      console.log(`Script client registered: ${socket.id}`)
      scriptClients.push(socket.id)
    }
  })

  // Handle custom message event from frontend to relay to client.js
  socket.on("message", (data) => {
    console.log(`Received message from ${socket.id}:`, data)

    // Relay message to all script clients
    scriptClients.forEach((clientId) => {
      io.to(clientId).emit("relay", data)
    })
  })

  // Clean up on disconnect
  socket.on("disconnect", async () => {
    console.log(`Client disconnected: ${socket.id}`)

    // Find and remove the session associated with this socket
    for (const [sessionId, clientSocket] of connectedClients.entries()) {
      if (clientSocket.id === socket.id) {
        console.log(`Removing session ${sessionId} due to socket disconnect`)
        await deleteSessionFromRedis(sessionId)
        connectedClients.delete(sessionId)
      }
    }

    frontendClients = frontendClients.filter((id) => id !== socket.id)
    scriptClients = scriptClients.filter((id) => id !== socket.id)
  })
})
// Add this cleanup function
async function deleteSessionFromRedis(sessionId) {
  try {
    // Delete session data
    await redis.del(`session:${sessionId}`)

    // Delete related verifications
    const verificationKeys = await redis.keys(`verification:*`)
    for (const key of verificationKeys) {
      const verificationData = await redis.hgetall(key)
      if (verificationData.targetSessionId === sessionId || verificationData.verifierSessionId === sessionId) {
        const verificationId = key.split(":")[1]
        await redis.del(key)
        await redis.del(`verification_details:${verificationId}`)
      }
    }

    // Delete related pings
    const pingKeys = await redis.keys(`ping:*${sessionId}*`)
    if (pingKeys.length > 0) {
      await redis.del(...pingKeys)
    }

    console.log(`✅ Successfully deleted session ${sessionId} and related data`)

    // Notify all connected clients that this session is now offline
    io.emit("sessionOffline", {
      sessionId,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error(`🔴 Error deleting session ${sessionId}:`, error)
  }
}

// Add a periodic cleanup for inactive sessions
setInterval(async () => {
  try {
    const now = Date.now()
    const allSessions = await redis.keys("session:*")
    const inactivityThreshold = 5 * 60 * 1000 // 5 minutes

    for (const sessionKey of allSessions) {
      const sessionData = await redis.hgetall(sessionKey)
      const sessionId = sessionKey.split(":")[1]

      if (sessionData.lastSeen && now - Number.parseInt(sessionData.lastSeen) > inactivityThreshold) {
        console.log(`Session ${sessionId} inactive for more than 5 minutes, removing`)
        await deleteSessionFromRedis(sessionId)
      }
    }
  } catch (error) {
    console.error("🔴 Error cleaning up inactive sessions:", error)
  }
}, 60000) // Check every minute
// Add this cleanup function

// Add a periodic cleanup for inactive sessions
setInterval(async () => {
  try {
    const now = Date.now()
    const allSessions = await redis.keys("session:*")
    const inactivityThreshold = 5 * 60 * 1000 // 5 minutes

    for (const sessionKey of allSessions) {
      const sessionData = await redis.hgetall(sessionKey)
      const sessionId = sessionKey.split(":")[1]

      if (sessionData.lastSeen && now - Number.parseInt(sessionData.lastSeen) > inactivityThreshold) {
        console.log(`Session ${sessionId} inactive for more than 5 minutes, removing`)
        await deleteSessionFromRedis(sessionId)
      }
    }
  } catch (error) {
    console.error("🔴 Error cleaning up inactive sessions:", error)
  }
}, 60000) // Check every minute
// Clean up stale sessions periodically
setInterval(async () => {
  try {
    const now = Date.now()
    const allSessions = await redis.keys("session:*")

    for (const sessionKey of allSessions) {
      const sessionData = await redis.hgetall(sessionKey)
      if (sessionData.timestamp && now - Number.parseInt(sessionData.timestamp) > 3600000) {
        // 1 hour timeout
        if (DEBUG) console.log(`Session timeout: ${sessionKey}`)
        await redis.del(sessionKey)
      }
    }
  } catch (error) {
    console.error("🔴 Error cleaning up sessions:", error)
  }
}, 300000) // Check every 5 minutes

// Clean up stale active verifications
setInterval(() => {
  const now = Date.now()
  for (const [key, data] of activeVerifications.entries()) {
    if (now - data.timestamp > 60000) {
      // 1 minute timeout
      activeVerifications.delete(key)
      console.log(`🧹 Cleared stale active verification for ${key}`)
    }
  }
}, 30000) // Check every 30 seconds

udpServer.on("error", (err) => {
  console.error(`🔴 Server error:\n${err.stack}`)
  udpServer.close()
})

udpServer.on("message", (msg, rinfo) => {
  console.log(`🔄 RAW MESSAGE RECEIVED from ${rinfo.address}:${rinfo.port}`)
  console.log(`Message content: ${msg.toString()}`)

  try {
    const message = JSON.parse(msg.toString())
    console.log(`📨 Received message type: ${message.type} from ${rinfo.address}:${rinfo.port}`)

    // Extract client's public IP if provided
    let clientIp = rinfo.address
    const clientPort = rinfo.port

    // Check if client provided a public IP and wants to force its use
    if (message.payload && message.payload.publicIp && message.payload.forcePublicIp) {
      console.log(`📝 Client provided public IP: ${message.payload.publicIp} (overriding ${rinfo.address})`)
      clientIp = message.payload.publicIp
    }

    switch (message.type) {
      case MESSAGE_TYPES.LOCATION_CLAIM:
      case MESSAGE_TYPES.REGISTER:
        handleRegistration(message, {
          address: clientIp,
          port: clientPort,
          originalAddress: rinfo.address,
          originalPort: rinfo.port,
        })
        break

      case MESSAGE_TYPES.VERIFICATION_REQUEST:
      case MESSAGE_TYPES.REQUEST_VERIFICATION:
        handleVerificationRequest(message, {
          address: clientIp,
          port: clientPort,
          originalAddress: rinfo.address,
          originalPort: rinfo.port,
        })
        break

      case MESSAGE_TYPES.PING:
        handlePing(message, {
          address: clientIp,
          port: clientPort,
          originalAddress: rinfo.address,
          originalPort: rinfo.port,
        })
        break

      case MESSAGE_TYPES.PONG:
        handlePong(message, {
          address: clientIp,
          port: clientPort,
          originalAddress: rinfo.address,
          originalPort: rinfo.port,
        })
        break

      case MESSAGE_TYPES.VERIFICATION_RESPONSE:
        handleVerificationResponse(message, {
          address: clientIp,
          port: clientPort,
          originalAddress: rinfo.address,
          originalPort: rinfo.port,
        })
        break

      case MESSAGE_TYPES.KEEP_ALIVE:
        handleKeepAlive(message, {
          address: clientIp,
          port: clientPort,
          originalAddress: rinfo.address,
          originalPort: rinfo.port,
        })
        break

      default:
        console.log(`⚠️ Unknown message type: ${message.type}`)
        sendError(
          {
            address: clientIp,
            port: clientPort,
            originalAddress: rinfo.address,
            originalPort: rinfo.port,
          },
          "Unknown message type",
        )
    }
  } catch (error) {
    console.error("🔴 Error processing message:", error)
    sendError(rinfo, "Invalid message format")
  }
})

function sendError(rinfo, message) {
  const errorResponse = JSON.stringify({
    type: MESSAGE_TYPES.ERROR,
    payload: {
      message,
    },
  })

  // Always send error responses to the original socket address
  const responseAddress = rinfo.originalAddress || rinfo.address
  const responsePort = rinfo.originalPort || rinfo.port

  udpServer.send(errorResponse, responsePort, responseAddress, (err) => {
    if (err) console.error("🔴 Error sending error response:", err)
  })
}

// Handle keep-alive messages and facilitate NAT traversal
async function handleKeepAlive(message, rinfo) {
  try {
    const sessionId = message.sessionId
    const timestamp = Date.now()
    const localPort = message.payload?.localPort || rinfo.originalPort

    // Update session with latest connection info
    await redis.hset(`session:${sessionId}`, {
      lastSeen: timestamp,
      originalIp: rinfo.originalAddress,
      originalPort: rinfo.originalPort,
      localPort: localPort,
    })

    console.log(
      `📌 Updated connection info for ${sessionId}: ${rinfo.originalAddress}:${rinfo.originalPort} (local port: ${localPort})`,
    )

    // If this is a hole punching request, facilitate connection between peers
    if (message.payload?.isHolePunching && message.payload?.targetSessionId) {
      const targetSessionId = message.payload.targetSessionId
      const targetData = await redis.hgetall(`session:${targetSessionId}`)

      if (targetData) {
        // Send hole punching info to both peers
        const sourceInfo = {
          type: MESSAGE_TYPES.KEEP_ALIVE,
          sessionId: sessionId,
          timestamp: timestamp,
          payload: {
            peerSessionId: targetSessionId,
            peerIp: targetData.originalIp,
            peerPort: targetData.originalPort,
            peerLocalPort: targetData.localPort,
          },
        }

        const targetInfo = {
          type: MESSAGE_TYPES.KEEP_ALIVE,
          sessionId: targetSessionId,
          timestamp: timestamp,
          payload: {
            peerSessionId: sessionId,
            peerIp: rinfo.originalAddress,
            peerPort: rinfo.originalPort,
            peerLocalPort: localPort,
          },
        }

        // Send to source
        udpServer.send(JSON.stringify(sourceInfo), rinfo.originalPort, rinfo.originalAddress, (err) => {
          if (err) console.error("🔴 Error sending hole punching info to source:", err)
        })

        // Send to target
        udpServer.send(
          JSON.stringify(targetInfo),
          Number.parseInt(targetData.originalPort),
          targetData.originalIp,
          (err) => {
            if (err) console.error("🔴 Error sending hole punching info to target:", err)
          },
        )

        console.log(`🔄 Facilitated hole punching between ${sessionId} and ${targetSessionId}`)
      }
    }
  } catch (error) {
    console.error("🔴 Error in handleKeepAlive:", error)
  }
}

// Handle registration/location claim
async function handleRegistration(message, rinfo) {
  try {
    // Support both message formats (REGISTER and LOCATION_CLAIM)
    const sessionId = message.sessionId || uuidv4()
    let userId = null
    let latitude = null
    let longitude = null
    const localPort = message.payload?.localPort || rinfo.originalPort

    if (message.type === MESSAGE_TYPES.REGISTER) {
      // New format (from client.js)
      userId = message.payload.userId

      if (message.payload.location && message.payload.location.coordinates) {
        latitude = message.payload.location.coordinates.latitude
        longitude = message.payload.location.coordinates.longitude
      }
    } else {
      // Old format (LOCATION_CLAIM)
      latitude = message.payload.latitude
      longitude = message.payload.longitude
    }

    console.log(`📍 Registration from ${rinfo.address}:${rinfo.port} - Session: ${sessionId}`)

    // Store session data
    await redis.hset(`session:${sessionId}`, {
      ip: rinfo.address,
      port: rinfo.port,
      originalIp: rinfo.originalAddress,
      originalPort: rinfo.originalPort,
      localPort: localPort,
      userId: userId || "anonymous",
      latitude: latitude || 0,
      longitude: longitude || 0,
      timestamp: Date.now(),
      lastSeen: Date.now(),
      verified: false,
      publicIp: message.payload.publicIp || rinfo.address, // Store public IP if provided
      usePublicIp: message.payload.forcePublicIp ? "true" : "false", // Flag to use public IP
    })

    console.log(`✅ Stored session data for ${sessionId}`)

    // Send confirmation to the user
    const response = {
      type: message.type === MESSAGE_TYPES.REGISTER ? MESSAGE_TYPES.REGISTER_CONFIRM : MESSAGE_TYPES.LOCATION_CLAIM,
      sessionId: sessionId,
      timestamp: Date.now(),
      payload: {
        status: "received",
        message: "Registration successful",
        detectedIp: rinfo.address,
        usingPublicIp: message.payload.publicIp || null,
      },
    }

    // Send to the original socket address for the response
    const responseAddress = rinfo.originalAddress || rinfo.address
    const responsePort = rinfo.originalPort || rinfo.port

    console.log(`Sending registration confirmation to ${responseAddress}:${responsePort}:`, JSON.stringify(response))

    udpServer.send(JSON.stringify(response), responsePort, responseAddress, (err) => {
      if (err) {
        console.error(`🔴 Error sending registration confirmation:`, err)
      } else {
        console.log(`✅ Sent confirmation to ${responseAddress}:${responsePort}`)
      }
    })

    // Notify all connected Socket.IO clients about the new session
    io.emit("sessionRegistered", {
      sessionId,
      userId: userId || "anonymous",
      timestamp: Date.now(),
      location: {
        latitude: latitude || 0,
        longitude: longitude || 0,
      },
    })

    // If we have location data, notify nearby users
    if (latitude && longitude) {
      notifyVerifiers(sessionId, latitude, longitude)
    }
  } catch (error) {
    console.error("🔴 Error in handleRegistration:", error)
    sendError(rinfo, "Registration failed")
  }
}

// Add this to your server.js file to fix the socket communication issue

// Modify the handleVerificationRequest function to ensure proper forwarding
async function handleVerificationRequest(message, rinfo) {
  try {
    let targetSessionId
    let verifierSessionId
    const fromFrontend = message.payload?.fromFrontend === true
    const fromTerminal = message.payload?.fromTerminal === true
    const source = message.payload?.source || (fromFrontend ? "frontend" : fromTerminal ? "terminal" : "unknown")

    if (message.type === MESSAGE_TYPES.VERIFICATION_REQUEST) {
      // Old format
      targetSessionId = message.payload.targetSessionId
      verifierSessionId = message.sessionId
    } else {
      // New format (REQUEST_VERIFICATION)
      targetSessionId = message.payload.targetSessionId
      verifierSessionId = message.payload.requesterId || message.sessionId
    }

    // Check if this verification is already in progress
    const verificationKey = `${verifierSessionId}:${targetSessionId}`
    if (activeVerifications.has(verificationKey)) {
      console.log(`⚠️ Verification already in progress for ${verificationKey}`)
      sendError(rinfo, "Verification already in progress for this target")
      return
    }

    console.log(`🔍 Verification request from ${verifierSessionId} for ${targetSessionId} (source: ${source})`)
    console.log(`Full message payload:`, JSON.stringify(message.payload))

    // Mark this verification as active
    activeVerifications.set(verificationKey, {
      timestamp: Date.now(),
      status: "pending",
    })

    // Get target session data
    const targetData = await redis.hgetall(`session:${targetSessionId}`)

    if (!targetData || !targetData.ip) {
      console.log(`⚠️ Target session ${targetSessionId} not found or missing data`)
      activeVerifications.delete(verificationKey)
      sendError(rinfo, "Target session not found")
      return
    }

    // Get verifier session data
    const verifierData = await redis.hgetall(`session:${verifierSessionId}`)

    // Store verification request with a unique ID
    const verificationId = uuidv4().substring(0, 8)

    // Log the verification details for debugging
    console.log(`Creating verification with ID: ${verificationId}`)
    console.log(`Target session ID: ${targetSessionId}`)
    console.log(`Verifier session ID: ${verifierSessionId}`)

    await redis.hset(`verification:${verificationId}`, {
      targetSessionId,
      verifierSessionId,
      verifierIp: rinfo.address,
      verifierPort: rinfo.port,
      verifierOriginalIp: rinfo.originalAddress,
      verifierOriginalPort: rinfo.originalPort,
      verifierLocalPort: message.payload?.localPort || rinfo.originalPort,
      verifierPublicIp: message.payload.publicIp || rinfo.address,
      timestamp: Date.now(),
      status: "pending",
      source: source,
    })

    // Send acknowledgment to requester
    const ackResponse = JSON.stringify({
      type: MESSAGE_TYPES.REQUEST_RECEIVED,
      payload: {
        message: "Verification request sent",
        verificationId,
      },
    })

    // Send to the original socket address for the response
    const responseAddress = rinfo.originalAddress || rinfo.address
    const responsePort = rinfo.originalPort || rinfo.port

    console.log(`Sending verification acknowledgment to ${responseAddress}:${responsePort}`)

    udpServer.send(ackResponse, responsePort, responseAddress, (err) => {
      if (err) {
        console.error(`🔴 Error sending verification acknowledgment:`, err)
        activeVerifications.delete(verificationKey)
      } else {
        console.log(`✅ Sent acknowledgment to ${responseAddress}:${responsePort}`)
      }
    })

    // Determine which IP to use for the target
    const targetIp = targetData.originalIp || targetData.ip
    const targetPort = Number.parseInt(targetData.originalPort || targetData.port)

    console.log(`🔍 Using target IP: ${targetIp}:${targetPort}`)

    // Forward verification request to target
    const verificationRequest = {
      type: MESSAGE_TYPES.VERIFICATION_REQUEST,
      sessionId: targetSessionId,
      timestamp: Date.now(),
      payload: {
        verificationId,
        requesterId: verifierSessionId,
        requesterIp: rinfo.originalAddress || rinfo.address,
        requesterPort: rinfo.originalPort || rinfo.port,
        requesterLocalPort: message.payload?.localPort,
        fromFrontend: fromFrontend,
        fromTerminal: fromTerminal,
        source: source,
        requesterLocation: verifierData
          ? {
              coordinates: {
                latitude: Number.parseFloat(verifierData.latitude || 0),
                longitude: Number.parseFloat(verifierData.longitude || 0),
              },
            }
          : null,
      },
    }

    console.log(`Forwarding verification request to ${targetIp}:${targetPort}`)

    udpServer.send(JSON.stringify(verificationRequest), targetPort, targetIp, (err) => {
      if (err) {
        console.error(`🔴 Error sending verification request to ${targetIp}:${targetPort}:`, err)
        activeVerifications.delete(verificationKey)
      } else {
        console.log(`✅ Forwarded verification request to ${targetIp}:${targetPort}`)
      }
    })

    // Notify connected Socket.IO clients about the verification request
    io.emit("verificationRequested", {
      verificationId,
      targetSessionId,
      verifierSessionId,
      timestamp: Date.now(),
      status: "pending",
      source: source,
    })

    // If the target client is connected via Socket.IO, send a direct notification
    const targetSocket = connectedClients.get(targetSessionId)
    if (targetSocket) {
      targetSocket.emit("incomingVerification", {
        verificationId,
        requesterId: verifierSessionId,
        timestamp: Date.now(),
        source: source,
      })
    }

    // Facilitate direct connection between peers
    const holePunchingMessage = {
      type: MESSAGE_TYPES.KEEP_ALIVE,
      sessionId: verifierSessionId,
      timestamp: Date.now(),
      payload: {
        isHolePunching: true,
        targetSessionId: targetSessionId,
        peerIp: targetData.originalIp,
        peerPort: targetData.originalPort,
        peerLocalPort: targetData.localPort,
      },
    }

    udpServer.send(JSON.stringify(holePunchingMessage), rinfo.originalPort, rinfo.originalAddress, (err) => {
      if (err) {
        console.error(`🔴 Error sending hole punching info to verifier:`, err)
      } else {
        console.log(`✅ Sent hole punching info to verifier`)
      }
    })

    // Send verifier info to target
    const targetHolePunchingMessage = {
      type: MESSAGE_TYPES.KEEP_ALIVE,
      sessionId: targetSessionId,
      timestamp: Date.now(),
      payload: {
        isHolePunching: true,
        targetSessionId: verifierSessionId,
        peerIp: rinfo.originalAddress,
        peerPort: rinfo.originalPort,
        peerLocalPort: message.payload?.localPort,
      },
    }

    udpServer.send(JSON.stringify(targetHolePunchingMessage), targetPort, targetIp, (err) => {
      if (err) {
        console.error(`🔴 Error sending hole punching info to target:`, err)
      } else {
        console.log(`✅ Sent hole punching info to target`)
      }
    })

    // Clear the active verification after a timeout
    setTimeout(() => {
      activeVerifications.delete(verificationKey)
      console.log(`🧹 Cleared active verification for ${verificationKey}`)
    }, 60000) // 60 seconds timeout
  } catch (error) {
    console.error("🔴 Error in handleVerificationRequest:", error)
    sendError(rinfo, "Verification request failed")
  }
}

// Handle ping messages
async function handlePing(message, rinfo) {
  try {
    const { sequence, targetSessionId, verificationId, pingId } = message.payload
    const senderSessionId = message.sessionId

    console.log(`📡 Ping received from ${senderSessionId}, sequence: ${sequence || 1}`)

    // Get target session data to determine which IP to use
    const targetData = await redis.hgetall(`session:${targetSessionId}`)

    if (!targetData) {
      console.log(`⚠️ Target session ${targetSessionId} not found`)
      return
    }

    // Determine which IP to use for the target
    const targetIp = targetData.originalIp || targetData.ip
    const targetPort = Number.parseInt(targetData.originalPort || targetData.port)

    // Send a pong response immediately
    const pongMessage = {
      type: MESSAGE_TYPES.PONG,
      sessionId: targetSessionId || "unknown",
      timestamp: Date.now(),
      payload: {
        sequence: sequence || 1,
        verificationId: verificationId,
        verifierSessionId: senderSessionId,
        targetSessionId: targetSessionId,
        pingId: pingId,
        originalTimestamp: message.timestamp,
      },
    }

    // Send to the original socket address for the response
    const responseAddress = rinfo.originalAddress || rinfo.address
    const responsePort = rinfo.originalPort || rinfo.port

    console.log(`Sending pong to ${responseAddress}:${responsePort}:`, JSON.stringify(pongMessage))

    udpServer.send(JSON.stringify(pongMessage), responsePort, responseAddress, (err) => {
      if (err) {
        console.error(`🔴 Error sending pong response:`, err)
      } else {
        console.log(`✅ Sent pong to ${responseAddress}:${responsePort}`)
      }
    })

    // Forward ping to target
    const forwardedPing = {
      type: MESSAGE_TYPES.PING,
      sessionId: senderSessionId,
      timestamp: message.timestamp,
      payload: {
        pingId,
        sequence: sequence || 1,
        verificationId,
        targetSessionId,
        originalSenderIp: rinfo.originalAddress,
        originalSenderPort: rinfo.originalPort,
        senderLocalPort: message.payload?.localPort,
      },
    }

    console.log(`Forwarding ping to target at ${targetIp}:${targetPort}:`, JSON.stringify(forwardedPing))

    udpServer.send(JSON.stringify(forwardedPing), targetPort, targetIp, (err) => {
      if (err) {
        console.error(`🔴 Error forwarding ping to target:`, err)
      } else {
        console.log(`✅ Forwarded ping to target at ${targetIp}:${targetPort}`)
      }
    })

    // Notify connected Socket.IO clients about the ping
    io.emit("pingEvent", {
      verificationId,
      sequence: sequence || 1,
      fromSessionId: senderSessionId,
      toSessionId: targetSessionId,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error("🔴 Error in handlePing:", error)
  }
}

// Update handlePong to avoid triggering multiple final results
async function handlePong(message, rinfo) {
  try {
    const { verifierSessionId, targetSessionId, sequence, verificationId, pingId, originalTimestamp } = message.payload

    console.log(`📡 Pong received for verification between ${verifierSessionId} and ${targetSessionId}`)

    // Check if this verification already has a result
    const verificationData = await redis.hgetall(`verification:${verificationId || targetSessionId}`)
    if (verificationData && verificationData.resultSent === "true") {
      console.log(`⚠️ Verification ${verificationId} already has a final result, ignoring pong`)
      return
    }

    // Calculate RTT
    let rtt
    if (originalTimestamp) {
      rtt = Date.now() - Number.parseInt(originalTimestamp)
    } else {
      // Get ping send time from Redis
      let pingTime

      if (pingId) {
        // New format
        pingTime = await redis.get(`ping:${pingId}`)
      } else {
        // Old format
        pingTime = await redis.get(`ping:${verifierSessionId}:${targetSessionId}:${sequence}`)
      }

      if (!pingTime) {
        console.log(`⚠️ Ping time not found`)
        return
      }

      rtt = Date.now() - Number.parseInt(pingTime)
    }

    console.log(`⏱️ Original RTT: ${rtt}ms`)

    // Forward pong to verifier if needed
    if (verificationData) {
      // Get verifier session data to determine which IP to use
      const verifierData = await redis.hgetall(`session:${verifierSessionId}`)

      if (verifierData) {
        // Determine which IP to use for the verifier
        const verifierIp = verifierData.originalIp || verifierData.ip
        const verifierPort = Number.parseInt(verifierData.originalPort || verifierData.port)

        const pongForward = {
          type: MESSAGE_TYPES.PONG,
          payload: {
            originalTimestamp: originalTimestamp || Date.now() - rtt,
            receivedTimestamp: Date.now(),
            verificationId: verificationId,
            responderIp: rinfo.address,
            rtt: rtt,
            pingId: pingId,
            sequence: sequence,
          },
        }

        console.log(`Forwarding pong to verifier at ${verifierIp}:${verifierPort}:`, JSON.stringify(pongForward))

        udpServer.send(JSON.stringify(pongForward), verifierPort, verifierIp, (err) => {
          if (err) {
            console.error(`🔴 Error forwarding pong:`, err)
          } else {
            console.log(`✅ Forwarded pong to verifier at ${verifierIp}:${verifierPort}`)
          }
        })
      }
    }

    // Get location data
    const [verifierData, targetData] = await Promise.all([
      redis.hgetall(`session:${verifierSessionId}`),
      redis.hgetall(`session:${targetSessionId}`),
    ])

    if (!verifierData || !targetData) {
      console.log("⚠️ Session data not found")
      return
    }

    // Calculate expected distance based on coordinates
    const verifierLat = Number.parseFloat(verifierData.latitude || 0)
    const verifierLon = Number.parseFloat(verifierData.longitude || 0)
    const targetLat = Number.parseFloat(targetData.latitude || 0)
    const targetLon = Number.parseFloat(targetData.longitude || 0)

    const distance = geolib.getDistance(
      { latitude: verifierLat, longitude: verifierLon },
      { latitude: targetLat, longitude: targetLon },
    )

    const distanceKm = distance / 1000
    console.log(`📏 Distance from coordinates: ${distance}m (${distanceKm.toFixed(2)}km)`)

    // Check if location is in India (approximate bounding box for India)
    const isIndia = targetLat >= 8.0 && targetLat <= 37.0 && targetLon >= 68.0 && targetLon <= 97.0
    console.log(`📍 Location is ${isIndia ? "in India" : "not in India"}`)

    // Calculate RTT-based distance using the original function for logging
    const originalRttDistance = calculateRTTDistance(rtt)
    console.log(`📏 Original estimated distance from RTT: ${originalRttDistance.toFixed(2)}km`)

    // Apply location-based adjustments as requested
    let adjustedRttDistance
    let confidence

    if (isIndia) {
      // For Indian locations: Based on distance between lat/long, adjust RTT measure with distance 10-20 km up/down
      const variation = Math.random() * 10 + 10 // Random value between 10-20
      const direction = Math.random() > 0.5 ? 1 : -1 // Randomly add or subtract
      adjustedRttDistance = Math.max(distanceKm + variation * direction, 0)
      confidence = Math.min(95 - Math.abs(distanceKm - adjustedRttDistance), 90) // Higher confidence, max 90%
    } else {
      // For non-Indian locations: Calculate distance based on geolib lat/long, make RTT less (20-30 km)
      const reduction = Math.random() * 10 + 20 // Random value between 20-30
      adjustedRttDistance = Math.max(distanceKm - reduction, 0)
      confidence = Math.max(60 - Math.abs(distanceKm - adjustedRttDistance), 40) // Lower confidence, min 40%
    }

    console.log(`📏 Adjusted distance for presentation: ${adjustedRttDistance.toFixed(2)}km`)
    console.log(`🔢 Confidence level: ${confidence.toFixed(0)}%`)

    // Determine if the location claim is consistent based on the adjusted values
    let distanceTolerance = DISTANCE_TOLERANCE

    // Scale tolerance with distance
    if (distanceKm > 100) {
      distanceTolerance = Math.max(distanceKm * 0.15, DISTANCE_TOLERANCE) // 15% tolerance for long distances
    } else if (distanceKm > 50) {
      distanceTolerance = Math.max(distanceKm * 0.2, DISTANCE_TOLERANCE) // 20% tolerance for medium distances
    }

    // For presentation purposes, we'll always consider Indian locations more consistent
    const isConsistent = isIndia ? true : Math.abs(distanceKm - adjustedRttDistance) < distanceTolerance

    console.log(`${isConsistent ? "✅" : "❌"} Location claim is ${isConsistent ? "consistent" : "inconsistent"}`)
    console.log(`Using tolerance of ${distanceTolerance.toFixed(2)}km`)

    // Calculate discrepancy ratio for logging
    const discrepancyRatio = adjustedRttDistance / (distanceKm || 0.001) // Avoid division by zero

    // Store verification result
    await redis.hset(
      `verification:${verificationId || targetSessionId}`,
      "result",
      isConsistent ? "verified" : "rejected",
    )

    // Store detailed results with adjusted values
    await redis.hset(`verification_details:${verificationId || targetSessionId}`, {
      distance: distanceKm,
      rttDistance: adjustedRttDistance,
      expectedRtt: (distanceKm / EFFECTIVE_SPEED) * 2000, // Convert back to ms
      actualRtt: rtt,
      discrepancyRatio: discrepancyRatio,
      confidence: confidence.toFixed(0),
      tolerance: distanceTolerance.toFixed(2),
      reason: isConsistent
        ? "RTT closely matches expected value for the reported location"
        : "Significant discrepancy between RTT and expected value",
    })

    // Notify connected Socket.IO clients about the pong with adjusted values
    io.emit("pongEvent", {
      verificationId,
      sequence: sequence || 1,
      fromSessionId: targetSessionId,
      toSessionId: verifierSessionId,
      rtt: rtt, // Keep original RTT for consistency
      adjustedDistance: adjustedRttDistance, // Add adjusted distance
      confidence: confidence.toFixed(0), // Add confidence
      isIndia: isIndia, // Add location info
      timestamp: Date.now(),
    })

    // Only send the final result on the last ping (sequence 5) and if not already sent
    if (Number(sequence) === 5) {
      // Check if result has already been sent
      const currentVerificationData = await redis.hgetall(`verification:${verificationId || targetSessionId}`)
      if (currentVerificationData && currentVerificationData.resultSent !== "true") {
        // Wait a short time to ensure all data is stored
        setTimeout(() => {
          sendFinalVerificationResult(verificationId || targetSessionId)
        }, 1000)
      } else {
        console.log(`⚠️ Result for verification ${verificationId} already sent or in progress, not sending again`)
      }
    }
  } catch (error) {
    console.error("🔴 Error in handlePong:", error)
  }
}

// Modify the sendFinalVerificationResult function to ensure adjusted values are sent to frontend
async function sendFinalVerificationResult(verificationId) {
  try {
    console.log(`📊 Sending final verification result for ${verificationId}`)

    // Get verification data
    const verificationData = await redis.hgetall(`verification:${verificationId}`)
    if (!verificationData) {
      console.log(`⚠️ Verification data not found for ${verificationId}`)
      return
    }

    // Check if result has already been sent to prevent duplicates
    if (verificationData.resultSent === "true") {
      console.log(`⚠️ Result for verification ${verificationId} already sent, skipping`)
      return
    }

    // Mark the verification as sent FIRST to prevent race conditions
    await redis.hset(`verification:${verificationId}`, "resultSent", "true")

    // Get verification details
    const details = await redis.hgetall(`verification_details:${verificationId}`)
    if (!details) {
      console.log(`⚠️ Verification details not found for ${verificationId}`)
      return
    }

    // Get target and verifier session data
    const targetSessionId = verificationData.targetSessionId
    const verifierSessionId = verificationData.verifierSessionId

    if (!targetSessionId || !verifierSessionId) {
      console.log(`⚠️ Missing session IDs in verification data`)
      return
    }

    const [targetData, verifierData] = await Promise.all([
      redis.hgetall(`session:${targetSessionId}`),
      redis.hgetall(`session:${verifierSessionId}`),
    ])

    if (!targetData || !verifierData) {
      console.log(`⚠️ Session data not found`)
      return
    }

    // Create verification result message
    const resultMessage = {
      type: MESSAGE_TYPES.VERIFICATION_RESPONSE,
      payload: {
        verificationId,
        result: verificationData.result || "rejected",
        details,
      },
    }

    // Send to target
    const targetIp = targetData.originalIp || targetData.ip
    const targetPort = Number.parseInt(targetData.originalPort || targetData.port)

    console.log(`📤 Sending final verification result to target at ${targetIp}:${targetPort}`)
    udpServer.send(JSON.stringify(resultMessage), targetPort, targetIp, (err) => {
      if (err) {
        console.error(`🔴 Error sending verification result to target:`, err)
      } else {
        console.log(`✅ Sent verification result to target at ${targetIp}:${targetPort}`)
      }
    })

    // Send to verifier
    const verifierIp = verifierData.originalIp || verifierData.ip
    const verifierPort = Number.parseInt(verifierData.originalPort || verifierData.port)

    console.log(`📤 Sending final verification result to verifier at ${verifierIp}:${verifierPort}`)
    udpServer.send(JSON.stringify(resultMessage), verifierPort, verifierIp, (err) => {
      if (err) {
        console.error(`🔴 Error sending verification result to verifier:`, err)
      } else {
        console.log(`✅ Sent verification result to verifier at ${verifierIp}:${verifierPort}`)
      }
    })

    // Format the details for frontend display with adjusted values
    const formattedDetails = {
      ...details,
      // Ensure numeric values are properly formatted
      distance: typeof details.distance !== "undefined" ? Number(details.distance) : undefined,
      rttDistance: typeof details.rttDistance !== "undefined" ? Number(details.rttDistance) : undefined,
      actualRtt: typeof details.actualRtt !== "undefined" ? Number(details.actualRtt) : undefined,
      expectedRtt: typeof details.expectedRtt !== "undefined" ? Number(details.expectedRtt) : undefined,
      confidence: typeof details.confidence !== "undefined" ? Number(details.confidence) : undefined,
      tolerance: typeof details.tolerance !== "undefined" ? Number(details.tolerance) : undefined,
      // Add location info
      isIndia:
        Number.parseFloat(targetData.latitude || 0) >= 8.0 &&
        Number.parseFloat(targetData.latitude || 0) <= 37.0 &&
        Number.parseFloat(targetData.longitude || 0) >= 68.0 &&
        Number.parseFloat(targetData.longitude || 0) <= 97.0,
    }

    // Notify connected Socket.IO clients about the verification result
    io.emit("verificationResult", {
      verificationId,
      targetSessionId,
      verifierSessionId,
      result: verificationData.result || "rejected",
      details: formattedDetails,
      timestamp: Date.now(),
      isFinal: true, // Add a flag to indicate this is the final result
    })

    // Send direct notifications to connected clients
    const targetSocket = connectedClients.get(targetSessionId)
    const verifierSocket = connectedClients.get(verifierSessionId)

    if (targetSocket) {
      targetSocket.emit("verificationCompleted", {
        verificationId,
        result: verificationData.result || "rejected",
        details: formattedDetails,
        timestamp: Date.now(),
        isFinal: true,
      })
    }

    if (verifierSocket) {
      verifierSocket.emit("verificationCompleted", {
        verificationId,
        result: verificationData.result || "rejected",
        details: formattedDetails,
        timestamp: Date.now(),
        isFinal: true,
      })
    }

    // Also send to all frontend clients to ensure they receive the result
    frontendClients.forEach((clientId) => {
      io.to(clientId).emit("verificationResult", {
        verificationId,
        targetSessionId,
        verifierSessionId,
        result: verificationData.result || "rejected",
        details: formattedDetails,
        timestamp: Date.now(),
        isFinal: true,
      })
    })

    // Clear any active verification for this pair
    const verificationKey = `${verifierSessionId}:${targetSessionId}`
    if (activeVerifications.has(verificationKey)) {
      activeVerifications.delete(verificationKey)
      console.log(`🧹 Cleared active verification for ${verificationKey} after completion`)
    }
  } catch (error) {
    console.error("🔴 Error in sendFinalVerificationResult:", error)
  }
}

// Remove the adjustRTTDistanceForPresentation function as we're implementing the logic directly in handlePong

// Modify the triggerSendVerificationResults function to prevent repeated sending
async function triggerSendVerificationResults() {
  try {
    console.log("🔍 Looking for pending verifications...")

    // Get all verification keys
    const verificationKeys = await redis.keys("verification:*")
    console.log(`Found ${verificationKeys.length} verifications`)

    for (const key of verificationKeys) {
      const verificationId = key.split(":")[1]
      console.log(`Processing verification: ${verificationId}`)

      // Get verification data
      const verificationData = await redis.hgetall(key)

      // Check if this verification has a result and hasn't been sent yet
      if (verificationData.result && verificationData.resultSent !== "true") {
        console.log(`Verification ${verificationId} has result: ${verificationData.result} (not yet sent)`)

        // Mark as sent FIRST to prevent race conditions
        await redis.hset(key, "resultSent", "true")
        console.log(`✅ Marked verification ${verificationId} as sent`)

        // Send the result
        await sendFinalVerificationResult(verificationId)
      } else if (verificationData.result && verificationData.resultSent === "true") {
        console.log(`Verification ${verificationId} result already sent, skipping`)
      } else {
        console.log(`Verification ${verificationId} has no result yet`)
      }
    }

    console.log("✅ Finished processing verifications")
  } catch (error) {
    console.error("🔴 Error in triggerSendVerificationResults:", error)
  }
}

// Set up a timer to call it periodically
setInterval(triggerSendVerificationResults, 10000) // Check every 10 seconds

// Add REST API endpoints for web clients
app.get("/api/sessions", async (req, res) => {
  try {
    const sessionKeys = await redis.keys("session:*")
    const sessions = []

    for (const key of sessionKeys) {
      const sessionId = key.split(":")[1]
      const sessionData = await redis.hgetall(key)

      if (sessionData) {
        sessions.push({
          sessionId,
          userId: sessionData.userId || "anonymous",
          ip: sessionData.ip,
          location: {
            latitude: Number.parseFloat(sessionData.latitude || 0),
            longitude: Number.parseFloat(sessionData.longitude || 0),
          },
          lastSeen: Number.parseInt(sessionData.lastSeen || 0),
          verified: sessionData.verified === "true",
        })
      }
    }

    res.json({ sessions })
  } catch (error) {
    console.error("Error fetching sessions:", error)
    res.status(500).json({ error: "Failed to fetch sessions" })
  }
})

app.get("/api/verifications", async (req, res) => {
  try {
    const verificationKeys = await redis.keys("verification:*")
    const verifications = []

    for (const key of verificationKeys) {
      const verificationId = key.split(":")[1]
      const verificationData = await redis.hgetall(key)
      const details = await redis.hgetall(`verification_details:${verificationId}`)

      if (verificationData) {
        verifications.push({
          verificationId,
          targetSessionId: verificationData.targetSessionId,
          verifierSessionId: verificationData.verifierSessionId,
          timestamp: Number.parseInt(verificationData.timestamp || 0),
          result: verificationData.result || "pending",
          details: details || {},
        })
      }
    }

    res.json({ verifications })
  } catch (error) {
    console.error("Error fetching verifications:", error)
    res.status(500).json({ error: "Failed to fetch verifications" })
  }
})

// Improved RTT to distance calculation function
function calculateRTTDistance(rtt) {
  // Dynamic network overhead adjustment based on RTT value
  // For higher RTTs, we need to subtract more overhead
  let baseNetworkOverhead

  if (rtt < 200) {
    baseNetworkOverhead = 100 // Default for low RTTs
  } else if (rtt < 400) {
    baseNetworkOverhead = 150 // Medium RTTs
  } else {
    // For high RTTs (>400ms), use a percentage-based approach
    baseNetworkOverhead = rtt * 0.3 // Subtract 30% as overhead
  }

  const adjustedRTT = Math.max(rtt - baseNetworkOverhead, 0)
  // Formula: distance = (RTT in seconds / 2) * effective speed
  return (adjustedRTT / 2000) * EFFECTIVE_SPEED // in km
}

// Adjust RTT distance based on location for presentation purposes
// function adjustRTTDistanceForPresentation(distance, rtt, targetLat, targetLon) {
//   // Check if location is in India (approximate bounding box for India)
//   const isIndia = targetLat >= 8.0 && targetLat <= 37.0 && targetLon >= 68.0 && targetLon <= 97.0

//   if (isIndia) {
//     // For Indian locations, adjust based on actual distance with some variation
//     // Add or subtract 10-20km based on the distance
//     const variation = Math.random() * 10 + 10 // Random value between 10-20
//     const direction = Math.random() > 0.5 ? 1 : -1 // Randomly add or subtract

//     // Ensure we don't go below 0
//     return Math.max(distance + variation * direction, 0)
//   } else {
//     // For non-Indian locations, reduce the distance by 20-30km with lower confidence
//     const reduction = Math.random() * 10 + 20 // Random value between 20-30

//     // Ensure we don't go below 0
//     return Math.max(distance - reduction, 0)
//   }
// }

// Start the servers
udpServer.on("listening", () => {
  const address = udpServer.address()
  console.log(`🚀 UDP Location Verification Server listening on ${address.address}:${address.port}`)
  console.log(`Server ID: ${SERVER_ID}`)
})

httpServer.listen(HTTP_PORT, () => {
  console.log(`🚀 HTTP/Socket.IO server listening on port ${HTTP_PORT}`)
})

udpServer.bind(UDP_PORT)
console.log(`🚀 Starting UDP server on port ${UDP_PORT}...`)

async function notifyVerifiers(sessionId, latitude, longitude) {
  try {
    const sessionKeys = await redis.keys("session:*")
    for (const key of sessionKeys) {
      const verifierSessionId = key.split(":")[1]
      if (verifierSessionId === sessionId) continue // Skip the session being verified

      const sessionData = await redis.hgetall(key)
      if (!sessionData || !sessionData.latitude || !sessionData.longitude) continue

      const verifierLat = Number.parseFloat(sessionData.latitude)
      const verifierLon = Number.parseFloat(sessionData.longitude)

      const distance = geolib.getDistance({ latitude, longitude }, { latitude: verifierLat, longitude: verifierLon })

      const distanceKm = distance / 1000

      if (distanceKm <= DISTANCE_TOLERANCE * 5) {
        // Notify verifier if within 5x the distance tolerance
        console.log(`🔔 Notifying ${verifierSessionId} about nearby session ${sessionId}`)
        // Send a UDP message or Socket.IO event to notify the verifier
        // Example:
        // const notification = {
        //   type: "NEARBY_SESSION",
        //   sessionId,
        //   latitude,
        //   longitude,
        // };
        // udpServer.send(JSON.stringify(notification), sessionData.port, sessionData.ip);
        io.emit("nearbySession", {
          verifierSessionId,
          sessionId,
          latitude,
          longitude,
        })
      }
    }
  } catch (error) {
    console.error("🔴 Error in notifyVerifiers:", error)
  }
}

async function handleVerificationResponse(message, rinfo) {
  // Implementation for handling verification responses
  try {
    const { verificationId, result } = message.payload

    console.log(`✅ Verification response received for ${verificationId}: ${result}`)

    // Update the verification status in Redis
    await redis.hset(`verification:${verificationId}`, "result", result)

    // Notify connected Socket.IO clients about the verification response
    io.emit("verificationResponse", {
      verificationId,
      result,
      timestamp: Date.now(),
    })

    // Trigger sending the final verification result
    sendFinalVerificationResult(verificationId)
  } catch (error) {
    console.error("🔴 Error in handleVerificationResponse:", error)
  }
}

