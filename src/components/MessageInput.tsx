"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useChat } from "../hooks/useChat";

export default function MessageInput() {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, isTyping, activeSessionId } = useChat();

  // auto-grow the textarea as the user types, max 8 lines
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  // handle Enter key to send message, Shift+Enter for newline

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // send message if user clicks the send button or presses Enter, but only if there's text, not currently typing, and a session is active

  function handleSend() {
    if (!text.trim() || isTyping || !activeSessionId) return;
    sendMessage(text);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  const canSend = text.trim().length > 0 && !isTyping && !!activeSessionId;

  return (
    <div className="px-4 py-4 shrink-0 border-t border-white/8">
      <div className="glass-panel rounded-2xl flex items-end gap-2 px-4 py-3">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={
            activeSessionId
              ? "Type a message… (Enter to send, Shift+Enter for newline)"
              : "Start a new chat from the sidebar"
          }
          disabled={!activeSessionId}
          className="flex-1 bg-transparent resize-none outline-none text-sm text-white
                     placeholder:text-white/25 leading-relaxed disabled:cursor-not-allowed
                     max-h-40 overflow-y-auto"
        />

        <motion.button
          whileHover={
            canSend
              ? {
                  scale: 1.08,
                  boxShadow: "0 0 20px rgba(168, 85, 247, 0.55)",
                }
              : {}
          }
          whileTap={canSend ? { scale: 0.93 } : {}}
          onClick={handleSend}
          disabled={!canSend}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                     bg-gradient-to-br from-purple-600 to-cyan-600
                     disabled:opacity-35 disabled:cursor-not-allowed
                     transition-opacity"
          aria-label="Send message"
        >
          <svg
            className="w-4 h-4 text-white translate-x-px"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
            />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}
