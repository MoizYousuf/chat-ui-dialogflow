"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useChat } from "../hooks/useChat";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

export default function ChatWindow() {
  const { activeSession, isTyping } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom whenever a new message or the typing indicator appears.
  // We use scrollHeight rather than scrollIntoView to avoid the janky jump that
  // happens when the typing indicator and a new bubble overlap in the viewport.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [activeSession?.messages.length, isTyping]);

  const messages = activeSession?.messages ?? [];
  const isEmpty = messages.length === 0 && !isTyping;

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-6 space-y-0.5"
    >
      {isEmpty ? (
        // Empty state shown for fresh sessions — fades in gently
        <motion.div
          key="empty"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="h-full flex flex-col items-center justify-center gap-4 text-center select-none"
        >
          <div className="w-16 h-16 rounded-2xl glass-panel flex items-center justify-center text-3xl">
            🤖
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white/70 mb-1">
              Start a conversation
            </h2>
            <p className="text-sm text-white/35">
              Type a message below to chat with Dialogflow
            </p>
          </div>

          {/* Hint chips so the user has something to tap right away */}
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {["Say hello", "What can you do?", "Help me"].map((hint) => (
              <span
                key={hint}
                className="text-xs px-3 py-1.5 rounded-full glass-panel text-white/50 cursor-default"
              >
                {hint}
              </span>
            ))}
          </div>
        </motion.div>
      ) : (
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isTyping && <TypingIndicator key="typing-indicator" />}
        </AnimatePresence>
      )}
    </div>
  );
}
