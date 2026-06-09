"use client";

/**
 * chatStore.ts — Global chat state (Zustand)
 *
 * Manages the full list of chat sessions and the active one. Uses Zustand's
 * `persist` middleware to save sessions to localStorage so they survive page
 * reloads. `skipHydration: true` defers the localStorage read until after the
 * first client render, which keeps server-rendered and client HTML in sync and
 * avoids React hydration warnings.
 */
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

      // Switch the active session — the chat window re-renders with that session's messages.
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

      // Toggled by the socket's bot:typing event — drives the TypingIndicator component.
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

      // Convenience getter used by useChat — avoids re-deriving in every component.
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
