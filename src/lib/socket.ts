import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { detectIntent } from "./dialogflow";
import type {
  MessageSendPayload,
  SessionNewPayload,
} from "../types";

// Keep one Socket.io instance for the whole process — re-creating it on
// every hot reload in dev would cause "address already in use" errors.
let io: Server | null = null;

// Attach Socket.io to the existing HTTP server and register all event handlers.
// Calling this more than once is safe — the guard below prevents double-init.
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

    // The client tells us when a new chat session starts so we can log it.
    // Dialogflow doesn't need to be notified — each session ID is just a string.
    socket.on("session:new", ({ sessionId }: SessionNewPayload) => {
      console.log(`[socket] new session: ${sessionId}`);
    });

    // Main message handler: relay user text to Dialogflow and push the reply back.
    socket.on(
      "message:send",
      async ({ sessionId, text, timestamp }: MessageSendPayload) => {
        // Tell the frontend the bot is thinking right away, before we even
        // touch Dialogflow — this makes the typing indicator feel instant.
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

          // Send a graceful fallback so the UI never shows an empty response
          socket.emit("message:receive", {
            sessionId,
            text: "Sorry, I ran into a problem. Please try again.",
            intent: null,
            confidence: 0,
            timestamp: Date.now(),
          });
        } finally {
          // Always clear the typing indicator — even when Dialogflow throws,
          // we don't want a spinner stuck on screen forever.
          socket.emit("bot:typing", { sessionId, isTyping: false });
        }
      }
    );

    socket.on("disconnect", () => {
      console.log(`[socket] client disconnected: ${socket.id}`);
    });
  });
}

// Expose the io instance for any server-side code that needs to broadcast
// outside of a socket event handler (e.g., a webhook triggering a push).
export function getSocketServer(): Server | null {
  return io;
}
