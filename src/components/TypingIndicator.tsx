"use client";

import { motion } from "framer-motion";

// Three dots that bounce in sequence — the delay on each dot gives the
// wave effect that makes it feel alive rather than mechanical.
const DOT_VARIANTS = {
  animate: (i: number) => ({
    y: [0, -8, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: "easeInOut" as const,
      delay: i * 0.15,
    },
  }),
};

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-3 mb-1"
    >
      {/* Bot avatar — matches the avatar in MessageBubble */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 glass-panel text-sm">
        🤖
      </div>

      <div className="bubble-bot rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            custom={i}
            variants={DOT_VARIANTS}
            animate="animate"
            className="w-2 h-2 rounded-full bg-neon-purple block"
          />
        ))}
      </div>
    </motion.div>
  );
}
