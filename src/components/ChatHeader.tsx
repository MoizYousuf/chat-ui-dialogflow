"use client";

/**
 * ChatHeader.tsx
 *
 * Top bar of the chat panel showing the bot identity and live connection state.
 * The coloured dot reflects the real Socket.io status:
 *   green (pulsing) = connected, grey = connecting, red = connection error.
 * The "Clear chat" button erases messages for the active session without
 * removing it from the sidebar history.
 */
import { motion } from "framer-motion";
import { useChat } from "../hooks/useChat";

export default function ChatHeader() {
  const { activeSessionId, connected, connectionError, clearSession } = useChat();

  // Clear the current session's messages without removing it from the sidebar
  function handleClear() {
    if (activeSessionId) clearSession(activeSessionId);
  }

  // Derive the status label so the user always knows what's happening
  function statusLabel(): string {
    if (connected) return "Online";
    if (connectionError) return "Connection error";
    return "Connecting…";
  }

  return (
    <header className="glass-panel border-b border-white/8 px-5 py-3.5 flex items-center justify-between shrink-0">
      {/* Bot identity */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl glass-panel flex items-center justify-center text-lg">
          🤖
        </div>

        <div>
          <h1 className="text-sm font-semibold text-white leading-tight">
            Dialogflow Assistant
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            {/* Dot colour: green = connected, red = error, grey = connecting */}
            <motion.span
              animate={{
                opacity: connected ? [1, 0.4, 1] : 1,
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className={`w-1.5 h-1.5 rounded-full ${
                connected
                  ? "bg-emerald-400"
                  : connectionError
                    ? "bg-red-400"
                    : "bg-white/30"
              }`}
            />
            <span
              className={`text-xs ${connectionError ? "text-red-400/70" : "text-white/40"}`}
              title={connectionError ?? undefined}
            >
              {statusLabel()}
            </span>
          </div>
        </div>
      </div>

      {/* Clear chat button — only visible when there's an active session */}
      {activeSessionId && (
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleClear}
          className="text-xs text-white/40 hover:text-white/70 transition-colors px-3 py-1.5
                     rounded-lg hover:bg-white/5 border border-transparent hover:border-white/8"
        >
          Clear chat
        </motion.button>
      )}
    </header>
  );
}
