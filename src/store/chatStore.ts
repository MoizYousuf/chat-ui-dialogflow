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

      // Create a new blank session and immediately make it active.
      // Returns the ID so callers can emit the socket event right away.
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

      // Push a message into the right session. If it's the very first user
      // message, use its text as the session title so the sidebar is readable.
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

      // Clear messages but keep the session in the sidebar — the user might
      // want to start fresh without losing the entry in their history list.
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
      // Defer localStorage reads until the client mounts so SSR HTML matches
      // the first client render (avoids React hydration mismatches).
      skipHydration: true,
      // Only persist the sessions list — isTyping is transient and should
      // always start as false when the page reloads.
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
      }),
    }
  )
);
