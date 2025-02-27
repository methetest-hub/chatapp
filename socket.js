import { Server } from "socket.io";
import jwt from "jsonwebtoken"

const globalForSocket = globalThis; // ✅ Allows persistence in Next.js

if (!globalForSocket.io) {
  globalForSocket.io = null; // Initialize global io variable
}

export async function setupSocket(server) {
  if (globalForSocket.io) {
    console.log("⚠️ [Socket.IO] Already running.");
    return globalForSocket.io;
  }

  globalForSocket.io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  globalForSocket.io.of("/channel").on("connection", (socket) => {
    const { channelId,token } = socket.handshake.query;
    if(!token){
      return socket.disconnect(true);
    }

    const tokenData=jwt.verify(token, process.env.JWT_SECRET)
    if(!tokenData && tokenData.id==channelId && tokenData.permissions.viewChannel && tokenData.timestamp){
      return socket.disconnect(true);
    }

    if (!channelId) {
      console.log("❌ [Socket.IO] Missing channelId. Disconnecting...");
      socket.disconnect();
      return;
    }

    console.log(`✅ [Socket.IO] User joined /channel/${channelId}`);
    socket.join(channelId);

    socket.on("disconnect", () => {
      console.log(`❌ [Socket.IO] User left /channel/${channelId}`);
    });
  });

  console.log("✅ [Socket.IO] Initialized successfully.");
  return globalForSocket.io;
}

export function getIo() {
  if (!globalForSocket.io) {
    console.error("❌ [Socket.IO] Not initialized. Returning null.");
    throw new Error("Socket.IO is not running. Call setupSocket first.");
  }
  return globalForSocket.io;
}
