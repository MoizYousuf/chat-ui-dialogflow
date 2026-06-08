// ── Core domain models ──────────────────────────────────────────────

export interface Message {
  id: string;
  sessionId: string;
  text: string;
  sender: "user" | "bot";
  intent?: string | null;
  confidence?: number;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  // Set from the first user message so the sidebar shows something meaningful
  title: string;
  createdAt: number;
  messages: Message[];
}

// ── Socket event payloads ───────────────────────────────────────────

export interface MessageSendPayload {
  sessionId: string;
  text: string;
  timestamp: number;
}

export interface MessageReceivePayload {
  sessionId: string;
  text: string;
  intent: string | null;
  confidence: number;
  timestamp: number;
}

export interface BotTypingPayload {
  sessionId: string;
  isTyping: boolean;
}

export interface SessionNewPayload {
  sessionId: string;
}

// ── Dialogflow result shape returned by detectIntent ────────────────

export interface DialogflowResult {
  fulfillmentText: string;
  intent: string | null;
  confidence: number;
}
