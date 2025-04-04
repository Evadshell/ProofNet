import { io, type Socket } from "socket.io-client"

let socket: Socket | null = null

export function getSocket(url: string): Socket {
  if (!socket) {
    socket = io(url, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    })
  }
  return socket
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function isSocketConnected(): boolean {
  return socket?.connected || false
}

