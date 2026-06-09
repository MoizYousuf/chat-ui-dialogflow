"use client";

/**
 * Sidebar.tsx
 *
 * Left panel showing the list of chat sessions and the "New chat" button.
 * Each session row displays a truncated title (derived from the first user
 * message), a relative timestamp, and the message count. Clicking a row
 * switches the active session in the store. Session items animate in with
 * a staggered slide from the left using Framer Motion.
 */
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "../hooks/useChat";
import type { ChatSession } from "../types";

// ── Sidebar container variants ──────────────────────────────────────
const LIST_VARIANTS = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const ITEM_VARIANTS = {
  initial: { opacity: 0, x: -18 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 380, damping: 28 },
  },
  exit: { opacity: 0, x: -12, transition: { duration: 0.15 } },
};

// ── Individual session row ──────────────────────────────────────────
interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  onClick: () => void;
}

// Relative time label — "just now", "5m ago", etc.
function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function SessionItem({ session, isActive, onClick }: SessionItemProps) {
  return (
    <motion.button
      variants={ITEM_VARIANTS}
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors group
        ${
          isActive
            ? "bg-white/10 border border-neon-purple/30 shadow-[0_0_12px_rgba(168,85,247,0.12)]"
            : "border border-transparent hover:bg-white/5 hover:border-white/8"
        }`}
    >
      <div className="flex items-start gap-2.5">
        {/* Active accent bar */}
        <div
          className={`w-0.5 rounded-full mt-1 shrink-0 self-stretch min-h-[14px]
            ${isActive ? "bg-neon-purple" : "bg-transparent group-hover:bg-white/20"}`}
        />

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm truncate leading-snug
              ${isActive ? "text-white font-medium" : "text-white/60 group-hover:text-white/80"}`}
          >
            {session.title}
          </p>
          <div className="flex items-center justify-between mt-0.5 gap-2">
            <span className="text-xs text-white/30">
              {relativeTime(session.createdAt)}
            </span>
            {session.messages.length > 0 && (
              <span className="text-xs text-white/25">
                {session.messages.length} msg
                {session.messages.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// ── Sidebar ─────────────────────────────────────────────────────────
export default function Sidebar() {
  const { sessions, activeSessionId, startNewChat, setActiveSession } =
    useChat();

  return (
    <aside className="w-72 shrink-0 h-full glass-panel border-r border-white/8 flex flex-col">
      {/* App brand */}
      <div className="px-5 pt-5 pb-4 border-b border-white/8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-sm">
            💬
          </div>
          <span className="text-sm font-semibold text-white">
            Dialogflow Chat
          </span>
        </div>

        {/* New chat button — primary action in the sidebar */}
        <motion.button
          whileHover={{
            scale: 1.02,
            boxShadow: "0 0 18px rgba(168, 85, 247, 0.3)",
          }}
          whileTap={{ scale: 0.97 }}
          onClick={startNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5
                     rounded-xl border border-neon-purple/40 text-sm text-white/80
                     hover:text-white hover:bg-neon-purple/10 transition-colors font-medium"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          New chat
        </motion.button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {sessions.length === 0 ? (
          // Only shown before the user has started any conversation
          <p className="text-xs text-white/25 text-center mt-6 px-4">
            No conversations yet.
            <br />
            Click &quot;New chat&quot; to begin.
          </p>
        ) : (
          <motion.nav
            variants={LIST_VARIANTS}
            initial="animate"
            animate="animate"
            className="flex flex-col gap-1"
          >
            <AnimatePresence>
              {sessions.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={session.id === activeSessionId}
                  onClick={() => setActiveSession(session.id)}
                />
              ))}
            </AnimatePresence>
          </motion.nav>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/8">
        <p className="text-xs text-white/20 text-center">
          Sessions persist across reloads
        </p>
      </div>
    </aside>
  );
}
