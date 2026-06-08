"use client";

import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";
import ChatHeader from "../components/ChatHeader";
import ChatWindow from "../components/ChatWindow";
import MessageInput from "../components/MessageInput";

// Root page — just lays out the shell. Each child manages its own state
// through useChat() so there's no prop drilling here.
export default function ChatPage() {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex h-screen w-screen overflow-hidden"
    >
      <Sidebar />

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        <ChatHeader />
        <ChatWindow />
        <MessageInput />
      </div>
    </motion.main>
  );
}
