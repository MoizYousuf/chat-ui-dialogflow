"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type { ChatSession, Message } from "../types";

interface ChatStore {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isTyping: boolean;

  createSession: () => string;
  setActiveSession: (id: string) => void;
  addMessage: (sessionId: string, message: Message) => void;
  setTyping: (isTyping: boolean) => void;
  clearSession: (sessionId: string) => void;
  getActiveSession: () => ChatSession | undefined;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      isTyping: false,

      createSession() {
        const id = uuidv4();
        const newSession: ChatSession = {
          id,
          title: "New conversation",
          createdAt: Date.now(),
          messages: [],
        };
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          activeSessionId: id,
        }));
        return id;
      },

      setActiveSession(id) {
        set({ activeSessionId: id });
      },

      addMessage(sessionId, message) {
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s;
            const isFirstUserMsg =
              s.messages.length === 0 && message.sender === "user";
            return {
              ...s,
              title: isFirstUserMsg
                ? message.text.slice(0, 35) +
                  (message.text.length > 35 ? "…" : "")
                : s.title,
              messages: [...s.messages, message],
            };
          }),
        }));
      },

      setTyping(isTyping) {
        set({ isTyping });
      },

      clearSession(sessionId) {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, messages: [], title: "New conversation" }
              : s
          ),
        }));
      },

      getActiveSession() {
        const { sessions, activeSessionId } = get();
        return sessions.find((s) => s.id === activeSessionId);
      },
    }),
    {
      name: "dialogflow-chat-sessions",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => undefined,
              removeItem: () => undefined,
            }
      ),
      // skip hydration to avoid SSR mismatch
      skipHydration: true,
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
      }),
    }
  )
);
