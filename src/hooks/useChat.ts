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

// The single integration point between socket events and the Zustand store.
// Components import this and nothing else — they stay pure UI.
export function useChat() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

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

  // Load persisted sessions after mount so server HTML stays in sync.
  useEffect(() => {
    void useChatStore.persist?.rehydrate();
  }, []);

  // Set up the socket connection and register listeners in one effect.
  useEffect(() => {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    // When the bot replies, push the message into the store for the active session
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

    // Reflect the typing indicator state from the server into the store
    socket.on("bot:typing", ({ isTyping }: BotTypingPayload) => {
      setTyping(isTyping);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Send a message: add it to the store immediately for optimistic rendering,
  // then fire it over the socket so the server can query Dialogflow.
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

  // Create a new session, set it active, and tell the server about it
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
    sendMessage,
    startNewChat,
    setActiveSession,
    clearSession,
  };
}
