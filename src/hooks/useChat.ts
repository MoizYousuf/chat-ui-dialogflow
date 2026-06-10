"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { io, Socket } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import { useChatStore } from "../store/chatStore";
import type {
  Message,
  MessageReceivePayload,
  BotTypingPayload,
} from "../types";

function subscribeToStoreHydration(onStoreChange: () => void) {
  const { persist } = useChatStore;
  if (!persist) return () => {};
  return persist.onFinishHydration(onStoreChange);
}

function getStoreHydrationSnapshot() {
  if (typeof window === "undefined") return false;
  return useChatStore.persist?.hasHydrated() ?? true;
}

export function useChat() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const hasHydrated = useSyncExternalStore(
    subscribeToStoreHydration,
    getStoreHydrationSnapshot,
    () => false
  );

  const {
    sessions,
    activeSessionId,
    isTyping,
    createSession,
    setActiveSession,
    addMessage,
    setTyping,
    clearSession,
    getActiveSession,
  } = useChatStore();

  useEffect(() => {
    void useChatStore.persist?.rehydrate();
  }, []);

  useEffect(() => {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setConnectionError(null);
    });

    socket.on("disconnect", (reason) => {
      setConnected(false);
      if (reason === "io server disconnect") {
        console.warn("[socket] server closed the connection");
      }
    });

    socket.on("connect_error", (err) => {
      setConnected(false);
      setConnectionError(err.message || "Unable to reach the server");
      console.error("[socket] connection error:", err.message);
    });

    socket.on("message:receive", (payload: MessageReceivePayload) => {
      const message: Message = {
        id: uuidv4(),
        sessionId: payload.sessionId,
        text: payload.text,
        sender: "bot",
        intent: payload.intent,
        confidence: payload.confidence,
        timestamp: payload.timestamp,
      };
      addMessage(payload.sessionId, message);
    });

    socket.on("bot:typing", ({ isTyping }: BotTypingPayload) => {
      setTyping(isTyping);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // optimistic send — message shows immediately before the bot replies
  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || !activeSessionId || !socketRef.current) return;

    const message: Message = {
      id: uuidv4(),
      sessionId: activeSessionId,
      text: trimmed,
      sender: "user",
      timestamp: Date.now(),
    };

    addMessage(activeSessionId, message);

    socketRef.current.emit("message:send", {
      sessionId: activeSessionId,
      text: trimmed,
      timestamp: message.timestamp,
    });
  }

  function startNewChat() {
    const sessionId = createSession();
    socketRef.current?.emit("session:new", { sessionId });
    return sessionId;
  }

  const hydratedActiveSession = hasHydrated ? getActiveSession() : undefined;

  return {
    hasHydrated,
    sessions: hasHydrated ? sessions : [],
    activeSession: hydratedActiveSession,
    activeSessionId: hasHydrated ? activeSessionId : null,
    isTyping,
    connected,
    connectionError,
    sendMessage,
    startNewChat,
    setActiveSession,
    clearSession,
  };
}
