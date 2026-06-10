import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { detectIntent } from "./dialogflow";
import type {
  MessageSendPayload,
  SessionNewPayload,
} from "../types";

// single instance — prevents "address already in use" on hot reload
let io: Server | null = null;

export function initSocketServer(httpServer: HttpServer): void {
  if (io) return;

  io = new Server(httpServer, {
    cors: {
      origin:
        process.env.NODE_ENV === "production"
          ? process.env.NEXT_PUBLIC_APP_URL
          : "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`[socket] client connected: ${socket.id}`);

    socket.on("session:new", ({ sessionId }: SessionNewPayload) => {
      console.log(`[socket] new session: ${sessionId}`);
    });

    socket.on(
      "message:send",
      async ({ sessionId, text }: MessageSendPayload) => {
        socket.emit("bot:typing", { sessionId, isTyping: true });

        try {
          const result = await detectIntent(sessionId, text);

          socket.emit("message:receive", {
            sessionId,
            text: result.fulfillmentText,
            intent: result.intent,
            confidence: result.confidence,
            timestamp: Date.now(),
          });
        } catch (err) {
          console.error("[socket] Dialogflow error:", err);

          socket.emit("message:receive", {
            sessionId,
            text: "Sorry, I ran into a problem. Please try again.",
            intent: null,
            confidence: 0,
            timestamp: Date.now(),
          });
        } finally {
          socket.emit("bot:typing", { sessionId, isTyping: false });
        }
      }
    );

    socket.on("disconnect", () => {
      console.log(`[socket] client disconnected: ${socket.id}`);
    });
  });
}

export function getSocketServer(): Server | null {
  return io;
}
