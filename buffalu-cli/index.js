#!/usr/bin/env node
import { createSocket } from "dgram"
import axios from "axios"
import { createInterface } from "readline"
import { randomBytes } from "crypto"
import { getDistance } from "geolib"
import { io } from "socket.io-client"

const client = createSocket("udp4")

// const SERVER_HOST = "localhost"
// const SERVER_PORT = 41234 // Convert to number, not string
// const SOCKET_SERVER = "http://localhost:4000"
const SERVER_HOST = "rnhxi-14-139-241-220.a.free.pinggy.link"
const SERVER_PORT = 53340 // Convert to number, not string
const SOCKET_SERVER =  "https://rhythm-soap-poly-interference.trycloudflare.com/"
// Configuration
// const SERVER_HOST = "rnaat-2405-201-301c-4114-5589-1cac-5504-9dea.a.free.pinggy.link"
// const SERVER_PORT = 38541 // Convert to number, not string
// const SOCKET_SERVER = process.env.SOCKET_SERVER || "https://cc82-2405-201-301c-4114-5589-1cac-5504-9dea.ngrok-free.app"
const IP_API = "https://ipinfo.io/json"
const DEBUG =  true

// Constants for RTT to distance calculation
const SPEED_OF_LIGHT = 299792.458 // km/s
const NETWORK_OVERHEAD_FACTOR = 2.5 // Typical network overhead factor
const EFFECTIVE_SPEED = SPEED_OF_LIGHT / NETWORK_OVERHEAD_FACTOR // km/s

// Message types to match server
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
  DIRECT_PING: "DIRECT_PING",
  DIRECT_PONG: "DIRECT_PONG",
}

// Client state
let sessionId = null
const userId = randomBytes(4).toString("hex")
let locationInfo = null
const pendingPings = new Map()
const pendingVerifications = new Map()
// Store peer information for direct communication
const peerInfo = new Map()

// Socket.IO connection
let socket = null

// Flag to track if a verification is in progress
let verificationInProgress = false

// Create readline interface for user input
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Setup error handling
client.on("error", (err) => {
  console.error(`Client error:\n${err.stack}`)
  client.close()
})

// Handle incoming messages
client.on("message", (msg, rinfo) => {
  try {
    const data = JSON.parse(msg.toString())
    const { type, payload } = data

    if (DEBUG) console.log(`Received ${type} from ${rinfo.address}:${rinfo.port}`)
    console.log(`DEBUG: Received message type: ${data.type} from ${rinfo.address}:${rinfo.port}`)

    switch (type) {
      case MESSAGE_TYPES.REGISTER_CONFIRM:
      case MESSAGE_TYPES.LOCATION_CLAIM:
        handleRegistrationConfirm(data)
        break

      case MESSAGE_TYPES.REQUEST_RECEIVED:
        console.log(`Verification request received by server: ${payload.verificationId}`)
        break

      case MESSAGE_TYPES.VERIFICATION_REQUEST:
        handleVerificationRequest(data, rinfo)
        break

      case MESSAGE_TYPES.PING:
        handlePing(data, rinfo)
        break

      case MESSAGE_TYPES.PONG:
        handlePong(data)
        break

      case MESSAGE_TYPES.VERIFICATION_RESPONSE:
        handleVerificationResult(data)
        break

      case MESSAGE_TYPES.ERROR:
        console.error(`Error from server: ${payload.message}`)
        break

      // Handle new message types for NAT traversal
      case MESSAGE_TYPES.KEEP_ALIVE:
        handleKeepAlive(data, rinfo)
        break

      case MESSAGE_TYPES.DIRECT_PING:
        handleDirectPing(data, rinfo)
        break

      case MESSAGE_TYPES.DIRECT_PONG:
        handleDirectPong(data, rinfo)
        break

      default:
        console.warn(`Unknown message type: ${type}`)
    }
  } catch (error) {
    console.error("Error processing message:", error)
  }
})

// Improved Socket.IO connection handling
function initializeSocketIO() {
  if (socket) {
    // Close existing connection if any
    socket.disconnect()
  }

  console.log(`Connecting to Socket.IO server at ${SOCKET_SERVER}...`)

  // Create socket with explicit configuration for reliable connection
  socket = io(SOCKET_SERVER, {
    reconnection: true,
    reconnectionAttempts: Number.POSITIVE_INFINITY, // Keep trying to reconnect
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    transports: ["websocket", "polling"], // Try WebSocket first, fall back to polling
  })

  socket.on("connect", () => {
    console.log(`🔌 Connected to Socket.IO server with ID: ${socket.id}`)
    console.log(`Using Socket.IO server URL: ${SOCKET_SERVER}`)

    // Register with the Socket.IO server if we have a session ID
    if (sessionId) {
      registerWithSocketServer()
    }

    // Register as a client script
    socket.emit("register", "client")
  })

  socket.on("disconnect", (reason) => {
    console.log(`🔌 Disconnected from Socket.IO server: ${reason}`)
    // Try to reconnect after a short delay
    setTimeout(() => {
      console.log("Attempting to reconnect to Socket.IO server...")
      socket.connect()
    }, 5000)
  })

  socket.on("connect_error", (error) => {
    console.error("🔴 Socket.IO connection error:", error.message)
  })

  socket.on("error", (error) => {
    console.error("🔴 Socket.IO error:", error)
  })

  // Handle executeVerification event from the frontend
  socket.on("executeVerification", (data) => {
    console.log("\n--- 📥 Verification Request from Frontend ---")
    console.log(`Target Session ID: ${data.targetSessionId}`)
    console.log(`Socket ID: ${socket.id}`)
    console.log(`Current Session ID: ${sessionId}`)
    console.log(`Verification in progress: ${verificationInProgress}`)
    console.log(`Full data:`, JSON.stringify(data))

    // Force acknowledge receipt of the message
    if (socket.connected) {
      socket.emit("verificationRequestReceived", {
        targetSessionId: data.targetSessionId,
        timestamp: Date.now(),
      })
    }

    // Force set verification in progress to false to allow new verifications from frontend
    verificationInProgress = false

    // Create a unique verification ID for this request
    const frontendVerificationId = `frontend-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

    // Call the requestVerification function directly with the target session ID
    if (data.targetSessionId) {
      console.log("Calling requestVerification with target:", data.targetSessionId)
      requestVerification(data.targetSessionId)

      // Notify the frontend via Socket.IO about the request being sent
      if (socket && socket.connected) {
        socket.emit("verificationRequestSent", {
          targetSessionId: data.targetSessionId,
          verifierSessionId: sessionId,
          verificationId: frontendVerificationId,
          timestamp: Date.now(),
        })
      }
    } else {
      console.error("Missing targetSessionId in executeVerification event")

      // Notify the frontend of the error
      if (socket && socket.connected) {
        socket.emit("verificationError", {
          error: "Missing target session ID",
          timestamp: Date.now(),
        })
      }
    }
  })

  // Handle relay events from the server
  socket.on("relay", (data) => {
    console.log("⭐ Received relay event:", data)

    // Handle verification requests from the frontend
    if (data.action === "requestVerification" && data.targetSessionId) {
      console.log(`Received verification request for target: ${data.targetSessionId}`)

      // Force set verification in progress to false to allow new verifications from relay
      verificationInProgress = false

      // Call the requestVerification function with the target session ID
      requestVerification(data.targetSessionId)
    }
  })

  // Handle other events from the Socket.IO server
  socket.on("functionResponse", (data) => {
    console.log("Received function response from server:", data)
  })

  // Add a heartbeat to keep the connection alive
  setInterval(() => {
    if (socket.connected && sessionId) {
      socket.emit("heartbeat", {
        sessionId: sessionId,
        timestamp: Date.now(),
      })
    }
  }, 15000)
}

// Register with the Socket.IO server
function registerWithSocketServer() {
  if (!socket || !sessionId) return

  console.log(`Registering with Socket.IO server, session ID: ${sessionId}`)

  socket.emit("registerClient", {
    sessionId,
    userId,
    location: locationInfo,
    timestamp: Date.now(),
  })

  socket.on("registrationConfirmed", (data) => {
    console.log(`🔌 Registration with Socket.IO server ${data.success ? "successful" : "failed"}: ${data.message}`)

    if (data.success) {
      // Send a test message to verify bidirectional communication
      socket.emit("testConnection", {
        sessionId,
        message: "Testing bidirectional communication",
        timestamp: Date.now(),
      })
    }
  })
}

// Function to get the correct public IP address
async function getPublicIpAddress() {
  try {
    // Use a reliable public IP detection service
    const response = await axios.get("https://api.ipify.org?format=json")
    return response.data.ip
  } catch (error) {
    console.error("Failed to fetch public IP:", error.message)
    return null
  }
}

// Initialize client
async function initialize() {
  try {
    console.log("🚀 Starting UDP Location Verification Client...")
    console.log(`Connecting to server at ${SERVER_HOST}:${SERVER_PORT}`)

    // Initialize Socket.IO connection
    initializeSocketIO()

    // Bind to a random port
    client.bind(() => {
      const address = client.address()
      console.log(`Client listening on ${address.address}:${address.port}`)

      // Fetch location or use mock location
      if (process.env.USE_MOCK_LOCATION === "true") {
        console.log("Using mock location data...")
        getMockLocation().then((location) => {
          locationInfo = location
          console.log("\nYour (mock) location info:")
          console.log(JSON.stringify(locationInfo, null, 2))
          register()
        })
      } else {
        console.log("Fetching your public IP and location...")
        fetchLocation()
          .then((location) => {
            locationInfo = location
            console.log("\nYour location info:")
            console.log(JSON.stringify(locationInfo, null, 2))
            register()
          })
          .catch((error) => {
            console.error("Failed to fetch location:", error.message)
            console.log("Using mock location as fallback...")
            getMockLocation().then((location) => {
              locationInfo = location
              console.log("\nYour (mock) location info:")
              console.log(JSON.stringify(locationInfo, null, 2))
              register()
            })
          })
      }
    })
  } catch (error) {
    console.error("Initialization failed:", error.message)
    process.exit(1)
  }
}

// Generate mock location data
async function getMockLocation() {
  // Generate random coordinates within reasonable bounds
  const latitude = 37.7749 + (Math.random() - 0.5) * 10
  const longitude = -122.4194 + (Math.random() - 0.5) * 10

  // Get public IP if possible
  try {
    const publicIp = await getPublicIpAddress()
    return {
      ip: publicIp || "192.168.1.1",
      city: "Mock City",
      region: "Mock Region",
      country: "US",
      loc: `${latitude},${longitude}`,
      coordinates: {
        latitude,
        longitude,
      },
    }
  } catch (error) {
    return {
      ip: "192.168.1.1",
      city: "Mock City",
      region: "Mock Region",
      country: "US",
      loc: `${latitude},${longitude}`,
      coordinates: {
        latitude,
        longitude,
      },
    }
  }
}

// Fetch location from IP API
async function fetchLocation() {
  try {
    // First get the public IP address
    const publicIp = await getPublicIpAddress()

    if (!publicIp) {
      throw new Error("Could not determine public IP address")
    }

    // Then use it with the IP info service
    const url = IP_API
    const response = await axios.get(url)

    // Parse location coordinates
    let coords = { latitude: null, longitude: null }
    if (response.data.loc) {
      const [lat, lon] = response.data.loc.split(",")
      coords = {
        latitude: Number.parseFloat(lat),
        longitude: Number.parseFloat(lon),
      }
    }

    return {
      ip: publicIp, // Use the public IP we detected
      city: response.data.city,
      region: response.data.region,
      country: response.data.country,
      loc: response.data.loc,
      coordinates: coords,
    }
  } catch (error) {
    console.error("Failed to fetch location:", error.message)
    throw new Error("Location service unavailable")
  }
}

// Register with UDP server
function register() {
  // Support both message formats
  const message = JSON.stringify({
    type: MESSAGE_TYPES.REGISTER,
    payload: {
      userId,
      location: locationInfo,
      publicIp: locationInfo.ip, // Explicitly include the public IP
      forcePublicIp: true, // Flag to tell server to use our provided IP
      localPort: client.address().port, // Include local port for NAT traversal
    },
  })

  // Log the message being sent for debugging
  console.log("Sending registration message:", message)

  client.send(message, SERVER_PORT, SERVER_HOST, (err) => {
    if (err) {
      console.error("Failed to register with server:", err)
      return
    }

    console.log(`Registration request sent to ${SERVER_HOST}:${SERVER_PORT}`)
  })

  // Start sending keep-alive messages to maintain NAT mapping
  startKeepAlive()

  // Show menu after a delay to allow for registration response
  setTimeout(showMenu, 2000)
}

// Send keep-alive messages to the server to maintain NAT mapping
function startKeepAlive() {
  // Send a keep-alive message every 30 seconds
  setInterval(() => {
    if (!sessionId) return // Skip if not registered

    const message = JSON.stringify({
      type: MESSAGE_TYPES.KEEP_ALIVE,
      sessionId,
      timestamp: Date.now(),
      payload: {
        localPort: client.address().port,
      },
    })

    client.send(message, SERVER_PORT, SERVER_HOST, (err) => {
      if (err) {
        console.error("Failed to send keep-alive message:", err)
      } else if (DEBUG) {
        console.log("Sent keep-alive message to server")
      }
    })
  }, 30000) // Every 30 seconds
}

// Handle keep-alive messages
function handleKeepAlive(data, rinfo) {
  // If this is from a peer, store their info for direct communication
  if (data.sessionId && data.sessionId !== sessionId) {
    peerInfo.set(data.sessionId, {
      address: rinfo.address,
      port: rinfo.port,
      lastSeen: Date.now(),
    })

    // Send acknowledgment
    const response = JSON.stringify({
      type: MESSAGE_TYPES.KEEP_ALIVE_ACK,
      sessionId,
      timestamp: Date.now(),
    })

    client.send(response, rinfo.port, rinfo.address, (err) => {
      if (err && DEBUG) {
        console.error("Failed to send keep-alive acknowledgment:", err)
      }
    })
  }
}

// Handle registration confirmation
function handleRegistrationConfirm(data) {
  sessionId = data.sessionId
  console.log(`\n✅ Registration successful!`)
  console.log(`Your session ID: ${sessionId}`)
  console.log(`Your user ID: ${userId}`)

  if (data.payload.detectedIp) {
    console.log(`Server detected your IP as: ${data.payload.detectedIp}`)

    // If server detected a different IP than our public IP, warn the user
    if (data.payload.detectedIp !== locationInfo.ip) {
      console.warn(
        `⚠️ Warning: Server detected IP (${data.payload.detectedIp}) differs from your public IP (${locationInfo.ip})`,
      )
      console.warn("This may cause connectivity issues when verifying with other users.")
    }
  }

  // Register with Socket.IO server now that we have a session ID
  registerWithSocketServer()
}

// Modify the requestVerification function to ensure it works properly when called with a targetSessionId
function requestVerification(targetSessionId = null) {
  if (!sessionId) {
    console.log("❌ You must be registered before requesting verification.")
    console.log("Please wait for registration confirmation or try again.")
    setTimeout(showMenu, 2000)
    return
  }

  // Important: Don't block verification if it's coming from the frontend
  if (verificationInProgress && !targetSessionId) {
    console.log("⚠️ Verification already in progress, please wait...")
    setTimeout(showMenu, 2000)
    return
  }

  const processVerificationRequest = (targetId) => {
    verificationInProgress = true
    console.log(`Sending verification request to session ${targetId}...`)

    const message = JSON.stringify({
      type: MESSAGE_TYPES.REQUEST_VERIFICATION,
      sessionId, // Include our session ID
      payload: {
        requesterId: sessionId,
        location: locationInfo,
        publicIp: locationInfo.ip, // Include public IP here too
        forcePublicIp: true,
        targetSessionId: targetId, // Add target session ID to payload
        localPort: client.address().port, // Include local port for NAT traversal
        fromTerminal: targetSessionId ? false : true,
        source: targetSessionId ? "frontend" : "terminal",
      },
    })

    // Log the message being sent for debugging
    console.log("Sending verification request:", message)

    client.send(message, SERVER_PORT, SERVER_HOST, (err) => {
      if (err) {
        console.error("Failed to send verification request:", err)
        verificationInProgress = false
        if (!targetSessionId) showMenu()
        return
      }

      console.log("Verification request sent...")

      // Start sending UDP hole punching packets to the target
      initiateUdpHolePunching(targetId)

      // Notify the frontend via Socket.IO
      if (socket && socket.connected) {
        socket.emit("verificationRequestSent", {
          targetSessionId: targetId,
          verifierSessionId: sessionId,
          timestamp: Date.now(),
        })
      }

      // Reset verification in progress flag after a timeout
      setTimeout(() => {
        verificationInProgress = false
        console.log("✅ Verification process completed, ready for new requests")
      }, 10000)

      if (!targetSessionId) setTimeout(showMenu, 2000)
    })
  }

  if (targetSessionId) {
    // If target session ID is provided (from frontend), use it directly
    processVerificationRequest(targetSessionId)
  } else {
    // Otherwise, ask the user for a target session ID
    rl.question("Enter the session ID of the user to verify with: ", (targetId) => {
      processVerificationRequest(targetId)
    })
  }
}

// Initiate UDP hole punching to establish direct communication
function initiateUdpHolePunching(targetSessionId) {
  console.log(`Initiating UDP hole punching with ${targetSessionId}...`)

  // Send hole punching messages through the server
  const message = JSON.stringify({
    type: MESSAGE_TYPES.KEEP_ALIVE,
    sessionId,
    timestamp: Date.now(),
    payload: {
      targetSessionId,
      localPort: client.address().port,
      isHolePunching: true,
    },
  })

  // Send multiple messages to increase chance of success
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      client.send(message, SERVER_PORT, SERVER_HOST, (err) => {
        if (err) {
          console.error(`Failed to send hole punching message ${i + 1}:`, err)
        } else {
          console.log(`Sent hole punching message ${i + 1}`)
        }
      })
    }, i * 500) // Send every 500ms
  }
}

// Handle verification request from another user
function handleVerificationRequest(data, rinfo) {
  const {
    verificationId,
    requesterId,
    requesterIp,
    requesterPort,
    requesterLocation,
    fromFrontend,
    fromTerminal,
    source,
  } = data.payload

  console.log("\n--- 📥 Incoming Verification Request ---")
  console.log(`From User/Session ID: ${requesterId || "Unknown"}`)
  console.log(`Verification ID: ${verificationId}`)
  console.log(`Source: ${source || (fromFrontend ? "frontend" : fromTerminal ? "terminal" : "unknown")}`)

  if (requesterIp) {
    console.log(`IP Address: ${requesterIp}`)
  }

  if (requesterLocation) {
    console.log("Reported Location:")
    console.log(JSON.stringify(requesterLocation, null, 2))
  }

  // Store verification details
  pendingVerifications.set(verificationId, {
    requesterId,
    requesterIp,
    requesterPort,
    requesterLocation,
    verificationId,
    targetSessionId: data.sessionId,
    serverRinfo: rinfo, // Store server info for relaying
    fromFrontend: fromFrontend === true,
    fromTerminal: fromTerminal === true,
    source: source || (fromFrontend ? "frontend" : fromTerminal ? "terminal" : "unknown"),
  })

  // Immediately start UDP hole punching with the requester
  if (requesterId) {
    initiateUdpHolePunching(requesterId)
  }

  // Notify the frontend via Socket.IO
  if (socket && socket.connected) {
    socket.emit("incomingVerificationRequest", {
      verificationId,
      requesterId,
      requesterLocation,
      timestamp: Date.now(),
      source: source || (fromFrontend ? "frontend" : fromTerminal ? "terminal" : "unknown"),
    })
  }

  // If this is an automated verification from the frontend, auto-accept it
  if (fromFrontend === true || source === "frontend") {
    console.log("Auto-accepting verification request from frontend...")
    startRttMeasurement(verificationId)
    return
  }

  rl.question("\nDo you want to verify this user? (y/n): ", (answer) => {
    if (answer.toLowerCase() === "y") {
      // Initialize RTT measurement
      startRttMeasurement(verificationId)
    } else {
      console.log("Verification request declined.")

      // Notify the frontend via Socket.IO
      if (socket && socket.connected) {
        socket.emit("verificationDeclined", {
          verificationId,
          timestamp: Date.now(),
        })
      }

      showMenu()
    }
  })
}

// Start RTT measurement sequence
function startRttMeasurement(verificationId) {
  const verification = pendingVerifications.get(verificationId)
  if (!verification) {
    console.error("Verification request not found")
    return
  }

  console.log("\n🔄 Starting location verification...")
  console.log("📡 Sending ping packets to measure RTT...")

  // Notify the frontend via Socket.IO
  if (socket && socket.connected) {
    socket.emit("verificationStarted", {
      verificationId,
      timestamp: Date.now(),
    })
  }

  // Send multiple pings for more accurate measurement
  const pingCount = 5
  let completedPings = 0
  const rttResults = []

  const pingInterval = setInterval(() => {
    if (completedPings >= pingCount) {
      clearInterval(pingInterval)
      return
    }

    // Try direct ping first, fall back to server relay
    sendDirectPing(verification, verificationId, completedPings + 1, (rtt) => {
      rttResults.push(rtt)
      completedPings++
      console.log(`Ping ${completedPings}/${pingCount}: ${rtt} ms`)

      // Notify the frontend via Socket.IO
      if (socket && socket.connected) {
        socket.emit("pingResult", {
          verificationId,
          sequence: completedPings,
          rtt,
          timestamp: Date.now(),
        })
      }

      if (completedPings >= pingCount) {
        clearInterval(pingInterval)

        // Calculate average RTT excluding outliers
        const sortedRtts = [...rttResults].sort((a, b) => a - b)
        const filteredRtts = sortedRtts.slice(1, -1) // Remove highest and lowest
        const avgRtt = filteredRtts.reduce((sum, val) => sum + val, 0) / filteredRtts.length || 0

        console.log(`\nRTT measurements (ms): ${rttResults.join(", ")}`)
        console.log(`Average RTT: ${avgRtt.toFixed(2)} ms`)

        // Analyze RTT and location
        analyzeVerification(verification, avgRtt, verificationId)
      }
    })
  }, 1000)
}

// Send direct ping to target (peer-to-peer)
function sendDirectPing(verification, verificationId, sequence, callback) {
  const pingId = randomBytes(8).toString("hex")
  const timestamp = Date.now()

  // Store ping details for tracking response
  pendingPings.set(pingId, {
    timestamp,
    verificationId,
    sequence,
    callback,
    direct: true,
  })

  // Check if we have direct connection info for this peer
  const peer = peerInfo.get(verification.requesterId)
  const targetSessionId = verification.targetSessionId || verification.requesterId

  console.log(`Attempting to send direct ping #${sequence} to ${targetSessionId}`)
  console.log(`Peer info available: ${peer ? "Yes" : "No"}`)

  if (peer && Date.now() - peer.lastSeen < 60000) {
    // If peer info is recent (< 60 seconds)
    // Send direct ping
    const directMessage = JSON.stringify({
      type: MESSAGE_TYPES.DIRECT_PING,
      sessionId: sessionId,
      timestamp: timestamp,
      payload: {
        pingId,
        sequence,
        verificationId,
        targetSessionId: targetSessionId,
      },
    })

    console.log(`Sending direct ping #${sequence} to ${peer.address}:${peer.port}`)

    client.send(directMessage, peer.port, peer.address, (err) => {
      if (err) {
        console.error(`Failed to send direct ping #${sequence}:`, err)
        // Fall back to server relay
        sendPing(verification, verificationId, sequence, callback)
      } else {
        console.log(`Direct ping #${sequence} sent successfully`)
      }
    })
  } else {
    console.log(`No peer info available for ${targetSessionId}, falling back to server relay`)
    // Fall back to server relay if no direct connection
    sendPing(verification, verificationId, sequence, callback)
  }
}

// Handle direct ping
function handleDirectPing(data, rinfo) {
  const { pingId, sequence, verificationId, targetSessionId } = data.payload
  const senderSessionId = data.sessionId

  console.log(`📡 Received direct ping #${sequence || 1} from ${senderSessionId} (${rinfo.address}:${rinfo.port})`)

  // Update peer info
  peerInfo.set(senderSessionId, {
    address: rinfo.address,
    port: rinfo.port,
    lastSeen: Date.now(),
  })

  // Respond with direct pong
  const pongMessage = JSON.stringify({
    type: MESSAGE_TYPES.DIRECT_PONG,
    sessionId: sessionId,
    timestamp: Date.now(),
    payload: {
      pingId,
      timestamp: data.timestamp,
      sequence: sequence || 1,
      verificationId,
      verifierSessionId: senderSessionId,
      targetSessionId: targetSessionId || sessionId,
      originalTimestamp: data.timestamp,
    },
  })

  client.send(pongMessage, rinfo.port, rinfo.address, (err) => {
    if (err) {
      console.error(`Failed to send direct pong response:`, err)
    } else {
      console.log(`📡 Sent direct pong response to ping #${sequence || 1}`)
    }
  })

  // Notify the frontend via Socket.IO
  if (socket && socket.connected) {
    socket.emit("pingReceived", {
      verificationId,
      sequence: sequence || 1,
      fromSessionId: senderSessionId,
      timestamp: Date.now(),
    })
  }
}

// Handle direct pong
function handleDirectPong(data, rinfo) {
  // Extract data from payload
  const { pingId, sequence, originalTimestamp } = data.payload
  const senderSessionId = data.sessionId

  // Update peer info
  peerInfo.set(senderSessionId, {
    address: rinfo.address,
    port: rinfo.port,
    lastSeen: Date.now(),
  })

  // Calculate RTT
  const measuredRtt = Date.now() - Number.parseInt(originalTimestamp)

  // Find the corresponding ping request
  const pendingPing = pendingPings.get(pingId)
  if (pendingPing && typeof pendingPing.callback === "function") {
    pendingPing.callback(measuredRtt)
    pendingPings.delete(pingId)

    console.log(`📡 Direct RTT measurement: ${measuredRtt} ms`)
  } else {
    console.warn(`Received direct pong for unknown ping: ${pingId}`)
  }

  // Notify the frontend via Socket.IO
  if (socket && socket.connected) {
    socket.emit("pongReceived", {
      verificationId: pendingPing?.verificationId,
      sequence: sequence || 1,
      fromSessionId: senderSessionId,
      rtt: measuredRtt,
      timestamp: Date.now(),
    })
  }
}

// Improved UDP ping mechanism with retry logic
function sendPing(verification, verificationId, sequence, callback) {
  const pingId = randomBytes(8).toString("hex")
  const timestamp = Date.now()
  const maxRetries = 2
  let retryCount = 0

  // Store ping details for tracking response
  pendingPings.set(pingId, {
    timestamp,
    verificationId,
    sequence,
    callback,
    direct: false,
    retries: 0,
  })

  const sendPingPacket = () => {
    // Send ping through server
    const message = JSON.stringify({
      type: MESSAGE_TYPES.PING,
      sessionId: sessionId,
      timestamp: timestamp,
      payload: {
        pingId,
        sequence,
        verificationId,
        targetSessionId: verification.requesterId,
        publicIp: locationInfo.ip, // Include public IP
        forcePublicIp: true,
        localPort: client.address().port, // Include local port for NAT traversal
      },
    })

    // Log the ping message for debugging
    console.log(`Sending server-relayed ping #${sequence} to ${verification.requesterId}:`, message)

    client.send(message, SERVER_PORT, SERVER_HOST, (err) => {
      if (err) {
        console.error(`Failed to send ping #${sequence}:`, err)

        // Retry logic
        if (retryCount < maxRetries) {
          retryCount++
          console.log(`Retrying ping #${sequence} (attempt ${retryCount}/${maxRetries})...`)
          setTimeout(sendPingPacket, 500) // Retry after 500ms

          // Update pending ping with retry count
          const pendingPing = pendingPings.get(pingId)
          if (pendingPing) {
            pendingPing.retries = retryCount
            pendingPings.set(pingId, pendingPing)
          }
        } else {
          // Call callback with a high value to indicate failure after all retries
          console.error(`All retry attempts failed for ping #${sequence}`)
          callback(10000)
          pendingPings.delete(pingId)
        }
      } else {
        console.log(`Server-relayed ping #${sequence} sent successfully`)

        // Set timeout for ping response
        setTimeout(() => {
          const pendingPing = pendingPings.get(pingId)
          if (pendingPing) {
            console.log(`Ping #${sequence} timed out after 5 seconds`)
            callback(8000) // Use a high but distinct value for timeouts
            pendingPings.delete(pingId)
          }
        }, 5000) // 5 second timeout
      }
    })
  }

  // Start sending the ping
  sendPingPacket()
}

// Handle ping from another user
function handlePing(data, rinfo) {
  const { timestamp, verificationId, pingId, sequence, targetSessionId } = data.payload
  const senderSessionId = data.sessionId

  console.log(`📡 Received ping #${sequence || 1} from ${senderSessionId}`)

  // Notify the frontend via Socket.IO
  if (socket && socket.connected) {
    socket.emit("pingReceived", {
      verificationId,
      sequence: sequence || 1,
      fromSessionId: senderSessionId,
      timestamp: Date.now(),
    })
  }

  // Try to respond directly first if we have peer info
  const peer = peerInfo.get(senderSessionId)
  if (peer && Date.now() - peer.lastSeen < 60000) {
    // Send direct pong
    const directPongMessage = JSON.stringify({
      type: MESSAGE_TYPES.DIRECT_PONG,
      sessionId: sessionId,
      timestamp: Date.now(),
      payload: {
        pingId,
        timestamp: data.timestamp,
        sequence: sequence || 1,
        verificationId,
        verifierSessionId: senderSessionId,
        targetSessionId: targetSessionId || sessionId,
        originalTimestamp: data.timestamp,
      },
    })

    client.send(directPongMessage, peer.port, peer.address, (err) => {
      if (!err) {
        console.log(`📡 Sent direct pong response to ping #${sequence || 1}`)
        return
      }
    })
  }

  // Fall back to server relay
  const pongMessage = JSON.stringify({
    type: MESSAGE_TYPES.PONG,
    sessionId: sessionId,
    timestamp: Date.now(),
    payload: {
      pingId,
      timestamp: data.timestamp,
      sequence: sequence || 1,
      verificationId,
      verifierSessionId: senderSessionId,
      targetSessionId: targetSessionId || sessionId,
      originalTimestamp: data.timestamp,
      publicIp: locationInfo.ip, // Include public IP
      forcePublicIp: true,
      localPort: client.address().port, // Include local port for NAT traversal
    },
  })

  // Log the pong message for debugging
  console.log(`Sending server-relayed pong response to ping #${sequence || 1}:`, pongMessage)

  client.send(pongMessage, SERVER_PORT, SERVER_HOST, (err) => {
    if (err) {
      console.error(`Failed to send pong response:`, err)
    } else {
      console.log(`📡 Sent server-relayed pong response to ping #${sequence || 1}`)
    }
  })
}

// Handle pong response
function handlePong(data) {
  // Extract data from payload
  const { pingId, rtt, originalTimestamp } = data.payload

  // Calculate RTT if not provided
  let measuredRtt = rtt
  if (!measuredRtt && originalTimestamp) {
    measuredRtt = Date.now() - Number.parseInt(originalTimestamp)
  }

  // Find the corresponding ping request
  const pendingPing = pendingPings.get(pingId)
  if (pendingPing && typeof pendingPing.callback === "function") {
    pendingPing.callback(measuredRtt)
    pendingPings.delete(pingId)

    console.log(`📡 RTT measurement: ${measuredRtt} ms`)

    // Notify the frontend via Socket.IO
    if (socket && socket.connected) {
      socket.emit("pongReceived", {
        verificationId: pendingPing.verificationId,
        sequence: pendingPing.sequence,
        rtt: measuredRtt,
        timestamp: Date.now(),
      })
    }
  } else {
    console.warn(`Received pong for unknown ping: ${pingId}`)
  }
}

// Calculate distance between two locations
function calculateDistance(location1, location2) {
  try {
    if (!location1?.coordinates?.latitude || !location2?.coordinates?.latitude) {
      console.warn("Missing coordinate data for distance calculation")
      return null
    }

    return getDistance(location1.coordinates, location2.coordinates) / 1000 // Convert to km
  } catch (error) {
    console.error("Error calculating distance:", error)
    return null
  }
}

// Calculate expected RTT based on distance and network conditions
function calculateExpectedRTT(distance) {
  if (distance === null) return null

  // Calculate expected RTT (round trip is distance * 2)
  // Formula: RTT = (2 * distance) / effective_speed * 1000 (to get ms)
  return ((2 * distance) / EFFECTIVE_SPEED) * 1000 // Convert to ms
}

// Calculate distance based on measured RTT
function calculateRTTDistance(rtt) {
  // Dynamic network overhead adjustment based on RTT value
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

// Analyze verification results
function analyzeVerification(verification, avgRtt, verificationId) {
  const { requesterLocation } = verification

  // Calculate IP-based distance if we have location data
  let distance = null
  if (locationInfo && requesterLocation) {
    distance = calculateDistance(locationInfo, requesterLocation)
  }

  // Calculate expected RTT based on distance
  const expectedRtt = distance ? calculateExpectedRTT(distance) : null

  // Calculate RTT-based distance with the improved function
  const rttDistance = calculateRTTDistance(avgRtt)

  console.log("\n--- ✅ Verification Analysis ---")
  console.log(`IP-based distance: ${distance ? distance.toFixed(2) : "Unknown"} km`)
  console.log(`RTT-based distance: ${rttDistance.toFixed(2)} km`)
  console.log(`Expected RTT: ${expectedRtt ? expectedRtt.toFixed(2) : "Unknown"} ms`)
  console.log(`Actual RTT: ${avgRtt.toFixed(2)} ms`)

  // Format the verification result
  const { resultMessage, details } = formatVerificationResult(verification, avgRtt, distance, rttDistance, expectedRtt)

  // Display the formatted result
  console.log(resultMessage)

  // Determine verification result
  let result, confidence, reason

  // If we have distance information, compare with RTT-based distance
  if (distance) {
    const discrepancyRatio = rttDistance / distance
    const rttDiscrepancy = Math.abs(expectedRtt - avgRtt)
    const rttDiscrepancyPercentage = expectedRtt ? (rttDiscrepancy / expectedRtt) * 100 : 0

    console.log(`RTT discrepancy: ${rttDiscrepancy.toFixed(2)} ms (${rttDiscrepancyPercentage.toFixed(2)}%)`)
    console.log(`Distance ratio (RTT/IP): ${discrepancyRatio.toFixed(2)}`)

    // Simplified verification rules
    if (discrepancyRatio > 0.5 && discrepancyRatio < 2.0) {
      result = "verified"
      reason = "RTT closely matches expected value for the reported location"
      confidence = 90
    } else {
      result = "suspicious"
      reason = "Significant discrepancy between RTT and expected value"
      confidence = 50
    }
  } else {
    // Fallback to RTT-only analysis
    result = "verified"
    reason = "Verification based on RTT measurement only"
    confidence = 70
  }

  console.log(`\nVerification result: ${result.toUpperCase()} (${confidence}% confidence)`)
  console.log(`Reason: ${reason}`)

  // Send verification result to server
  sendVerificationResult(verificationId, result, {
    distance: distance || 0,
    rttDistance,
    expectedRtt: expectedRtt || 0,
    actualRtt: avgRtt,
    discrepancyRatio: distance ? rttDistance / distance : 1.0,
    confidence,
    reason,
  })

  // Notify the frontend via Socket.IO
  if (socket && socket.connected) {
    socket.emit("verificationResult", {
      verificationId,
      result,
      details: {
        distance: distance || 0,
        rttDistance,
        expectedRtt: expectedRtt || 0,
        actualRtt: avgRtt,
        discrepancyRatio: distance ? rttDistance / distance : 1.0,
        confidence,
        reason,
      },
      timestamp: Date.now(),
    })
  }

  // Reset verification in progress flag
  verificationInProgress = false

  setTimeout(showMenu, 2000)
}

// Format verification result in a clean, structured way
function formatVerificationResult(verification, avgRtt, distance, rttDistance, expectedRtt) {
  // Calculate discrepancy
  const discrepancyRatio = distance ? rttDistance / distance : 1.0
  const rttDiscrepancy = expectedRtt ? Math.abs(expectedRtt - avgRtt) : 0
  const rttDiscrepancyPercentage = expectedRtt ? (rttDiscrepancy / expectedRtt) * 100 : 0

  // Determine verification result
  let result, confidence, reason

  if (distance) {
    if (discrepancyRatio > 0.5 && discrepancyRatio < 2.0) {
      result = "VERIFIED"
      reason = "RTT closely matches expected value for the reported location"
      confidence = 90
    } else {
      result = "SUSPICIOUS"
      reason = "Significant discrepancy between RTT and expected value"
      confidence = 50
    }
  } else {
    result = "VERIFIED"
    reason = "Verification based on RTT measurement only"
    confidence = 70
  }

  // Create a structured result message
  const resultMessage = `
╔════════════════════════════════════════════════════════════════╗
║                    LOCATION VERIFICATION RESULT                 ║
╠════════════════════════════════════════════════════════════════╣
║ Result: ${result.padEnd(50)} ║
║ Confidence: ${confidence}%${" ".repeat(46 - confidence.toString().length)}║
╠════════════════════════════════════════════════════════════════╣
║ DISTANCE ANALYSIS                                              ║
╠════════════════════════════════════════════════════════════════╣
║ IP-based distance:      ${(distance || 0).toFixed(2).padEnd(36)} km ║
║ RTT-based distance:     ${rttDistance.toFixed(2).padEnd(36)} km ║
║ Distance ratio (RTT/IP): ${discrepancyRatio.toFixed(2).padEnd(34)}   ║
╠════════════════════════════════════════════════════════════════╣
║ RTT ANALYSIS                                                   ║
╠════════════════════════════════════════════════════════════════╣
║ Expected RTT:           ${(expectedRtt || 0).toFixed(2).padEnd(36)} ms ║
║ Actual RTT:             ${avgRtt.toFixed(2).padEnd(36)} ms ║
║ RTT discrepancy:        ${rttDiscrepancy.toFixed(2).padEnd(36)} ms ║
║ RTT discrepancy:        ${rttDiscrepancyPercentage.toFixed(2).padEnd(36)} % ║
╠════════════════════════════════════════════════════════════════╣
║ Reason: ${reason.padEnd(50)} ║
╚════════════════════════════════════════════════════════════════╝
`

  return {
    resultMessage,
    details: {
      result,
      confidence,
      distance: distance || 0,
      rttDistance,
      expectedRtt: expectedRtt || 0,
      actualRtt: avgRtt,
      discrepancyRatio,
      rttDiscrepancy,
      rttDiscrepancyPercentage,
      reason,
    },
  }
}

// Send verification result
function sendVerificationResult(verificationId, result, details) {
  const message = JSON.stringify({
    type: MESSAGE_TYPES.VERIFICATION_RESPONSE,
    sessionId,
    payload: {
      verificationId,
      result,
      details,
      publicIp: locationInfo.ip, // Include public IP
      forcePublicIp: true,
      localPort: client.address().port, // Include local port for NAT traversal
    },
  })

  // Log the verification result for debugging
  console.log("Sending verification result:", message)

  client.send(message, SERVER_PORT, SERVER_HOST, (err) => {
    if (err) {
      console.error("Failed to send verification result:", err)
    } else {
      console.log("Verification result sent to server")
    }
  })
}

// Handle verification result
function handleVerificationResult(data) {
  const { verificationId, result, details } = data.payload

  console.log("\n--- ✅ VERIFICATION RESULT RECEIVED ---")
  console.log(`Verification ID: ${verificationId}`)
  console.log(`Result: ${result ? result.toUpperCase() : "UNKNOWN"}`)

  // Notify the frontend via Socket.IO
  if (socket && socket.connected) {
    socket.emit("verificationCompleted", {
      verificationId,
      result,
      details,
      timestamp: Date.now(),
    })
  }

  if (details) {
    // Format the received verification result
    try {
      // Parse numeric values if they're stored as strings
      const parsedDetails = {
        actualRtt: Number.parseFloat(details.actualRtt || 0),
        distance: Number.parseFloat(details.distance || 0),
        rttDistance: Number.parseFloat(details.rttDistance || 0),
        expectedRtt: Number.parseFloat(details.expectedRtt || 0),
        confidence: Number.parseInt(details.confidence || 0),
        reason: details.reason || "No reason provided",
      }

      const formattedResult = formatVerificationResult(
        {}, // We don't need verification object here
        parsedDetails.actualRtt,
        parsedDetails.distance,
        parsedDetails.rttDistance,
        parsedDetails.expectedRtt,
      )

      // Display the formatted result
      console.log(formattedResult.resultMessage)
    } catch (error) {
      console.error("Error formatting verification result:", error)
      console.log("Raw details:", details)
    }
  } else {
    // Fallback if no details are provided
    console.log(`Result: ${result ? result.toUpperCase() : "UNKNOWN"}`)
  }

  // Reset verification in progress flag
  verificationInProgress = false

  setTimeout(showMenu, 2000)
}

// Show main menu
function showMenu() {
  console.log("\n--- 📱 Location Verification Client ---")
  console.log("1. Request verification from another user")
  console.log("2. View my session information")
  console.log("3. Update my location information")
  console.log("4. Socket.IO status")
  console.log("5. Exit")

  rl.question("\nSelect an option: ", (answer) => {
    switch (answer) {
      case "1":
        requestVerification()
        break

      case "2":
        console.log("\n--- 📋 Your Session Information ---")
        console.log(`Session ID: ${sessionId || "Not registered yet"}`)
        console.log(`User ID: ${userId}`)
        console.log("Location:")
        console.log(JSON.stringify(locationInfo, null, 2))
        console.log("Connected Peers:")
        if (peerInfo.size > 0) {
          for (const [peerId, peer] of peerInfo.entries()) {
            console.log(
              `- ${peerId}: ${peer.address}:${peer.port} (last seen: ${new Date(peer.lastSeen).toLocaleTimeString()})`,
            )
          }
        } else {
          console.log("No direct peer connections established")
        }
        setTimeout(showMenu, 1000)
        break

      case "3":
        console.log("Updating location information...")
        if (process.env.USE_MOCK_LOCATION === "true") {
          getMockLocation().then((location) => {
            locationInfo = location
            console.log("\nYour (mock) location info:")
            console.log(JSON.stringify(locationInfo, null, 2))
            setTimeout(showMenu, 1000)
          })
        } else {
          fetchLocation()
            .then((location) => {
              locationInfo = location
              console.log("\nYour location info:")
              console.log(JSON.stringify(locationInfo, null, 2))
              setTimeout(showMenu, 1000)
            })
            .catch((error) => {
              console.error("Failed to fetch location:", error.message)
              console.log("Using mock location as fallback...")
              getMockLocation().then((location) => {
                locationInfo = location
                console.log("\nYour (mock) location info:")
                console.log(JSON.stringify(locationInfo, null, 2))
                setTimeout(showMenu, 1000)
              })
            })
        }
        break

      case "4":
        console.log("\n--- 🔌 Socket.IO Status ---")
        if (socket) {
          console.log(`Connected: ${socket.connected}`)
          console.log(`Socket ID: ${socket.id || "Not connected"}`)
          console.log(`Server URL: ${SOCKET_SERVER}`)
          console.log(`Verification in progress: ${verificationInProgress ? "Yes" : "No"}`)

          if (!socket.connected) {
            console.log("Attempting to reconnect...")
            initializeSocketIO()
          }
        } else {
          console.log("Socket.IO not initialized")
          console.log("Initializing Socket.IO connection...")
          initializeSocketIO()
        }
        setTimeout(showMenu, 2000)
        break

      case "5":
        console.log("Exiting...")
        if (socket) {
          socket.disconnect()
        }
        client.close()
        rl.close()
        process.exit(0)
        break

      default:
        console.log("Invalid option.")
        showMenu()
    }
  })
}

// Initialize on start
initialize()

// Test the connection to the server
console.log("Testing connection to server...")
const testMessage = JSON.stringify({
  type: "TEST",
  payload: { message: "Testing connection" },
})
client.send(testMessage, SERVER_PORT, SERVER_HOST, (err) => {
  if (err) {
    console.error("Failed to send test message:", err)
  } else {
    console.log("Test message sent successfully")
  }
})

// Add this to your client.js file to fix the socket communication issue

// Modify the executeVerification function to ensure it properly handles requests

// Add this to your client.js file to fix the socket communication issue

// Connect to the Socket.io server
socket.on("connect", () => {
  console.log("Connected to server as client script")
  socket.emit("register", "client")
})

// Listen for relay events from the server
socket.on("relay", (data) => {
  console.log("⭐ Received relay event:", data)

  // Handle verification requests from the frontend
  if (data.action === "requestVerification" && data.targetSessionId) {
    console.log(`Received verification request for target: ${data.targetSessionId}`)
    // Call the requestVerification function with the target session ID
    requestVerification(data.targetSessionId)
  }
})

