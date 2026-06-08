import { SessionsClient } from "@google-cloud/dialogflow";
import type { DialogflowResult } from "../types";

// One client for the whole server lifetime — creating a new one per request
// would spin up fresh gRPC connections each time, which is slow and wasteful.
let client: SessionsClient | null = null;

// Resolve Google credentials from either a file path (local dev) or a
// base64-encoded JSON string (production deployments like Railway/Render).
function resolveCredentials(): object | undefined {
  if (process.env.GOOGLE_CREDENTIALS_BASE64) {
    const json = Buffer.from(
      process.env.GOOGLE_CREDENTIALS_BASE64,
      "base64"
    ).toString("utf-8");
    return JSON.parse(json);
  }
  // If GOOGLE_APPLICATION_CREDENTIALS is set to a file path, the SDK
  // picks it up automatically — return undefined to let it do that.
  return undefined;
}

// Lazily initialize the client on first use rather than at module load time,
// so the server can start up even if credentials aren't configured yet.
function getClient(): SessionsClient {
  if (!client) {
    const credentials = resolveCredentials();
    client = credentials
      ? new SessionsClient({ credentials })
      : new SessionsClient();
  }
  return client;
}

// Build the Dialogflow session path — this ties each conversation thread to
// a unique session ID so Dialogflow tracks context across messages.
function buildSessionPath(sessionId: string): string {
  const projectId = process.env.DIALOGFLOW_PROJECT_ID!;
  return getClient().projectAgentSessionPath(projectId, sessionId);
}

// Send a user message to Dialogflow ES and return the bot's reply.
// Returns a safe fallback if anything goes wrong so callers don't need to
// handle errors themselves.
export async function detectIntent(
  sessionId: string,
  text: string,
  languageCode = "en"
): Promise<DialogflowResult> {
  const sessionPath = buildSessionPath(sessionId);

  const [response] = await getClient().detectIntent({
    session: sessionPath,
    queryInput: {
      text: {
        text,
        languageCode,
      },
    },
  });

  const result = response.queryResult;

  return {
    fulfillmentText:
      result?.fulfillmentText ||
      "I didn't quite catch that. Could you try again?",
    intent: result?.intent?.displayName || null,
    confidence: result?.intentDetectionConfidence || 0,
  };
}
