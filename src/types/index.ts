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
  // first user message gets used as title
  title: string;
  createdAt: number;
  messages: Message[];
}

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

export interface DialogflowResult {
  fulfillmentText: string;
  intent: string | null;
  confidence: number;
}
