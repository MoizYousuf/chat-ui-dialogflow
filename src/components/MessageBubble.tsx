"use client";

import { motion } from "framer-motion";
import type { Message } from "../types";

interface Props {
  message: Message;
}

const BOT_VARIANTS = {
  initial: { opacity: 0, x: -28, y: 8 },
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 26 },
  },
  exit: { opacity: 0, x: -16, transition: { duration: 0.15 } },
};

const USER_VARIANTS = {
  initial: { opacity: 0, x: 28, y: 8 },
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 26 },
  },
  exit: { opacity: 0, x: 16, transition: { duration: 0.15 } },
};

// format timestamp to "hh:mm" format

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessageBubble({ message }: Props) {
  const isBot = message.sender === "bot";

  return (
    <motion.div
      layout
      variants={isBot ? BOT_VARIANTS : USER_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`flex items-end gap-2.5 mb-1 ${isBot ? "flex-row" : "flex-row-reverse"}`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm
          ${isBot ? "glass-panel" : "bg-linear-to-br from-purple-500 to-cyan-500"}`}
      >
        {isBot ? "🤖" : "👤"}
      </div>

      <div
        className={`flex flex-col gap-1 max-w-[72%] ${isBot ? "items-start" : "items-end"}`}
      >
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed text-white
            ${isBot ? "bubble-bot rounded-tl-sm" : "bubble-user rounded-tr-sm"}`}
        >
          {message.text}
        </div>

        <div className="flex items-center gap-2 px-1">
          <span className="text-xs text-white/30">
            {formatTime(message.timestamp)}
          </span>

          {/* intent name shows up under bot messages — handy for debugging */}
          {isBot && message.intent && (
            <span className="text-xs text-neon-purple/50 font-mono">
              {message.intent}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
