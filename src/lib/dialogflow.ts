import { SessionsClient } from "@google-cloud/dialogflow";
import * as path from "path";
import * as fs from "fs";
import type { DialogflowResult } from "../types";

// One client for the whole server lifetime — creating a new one per request
// would spin up fresh gRPC connections each time, which is slow and wasteful.
let client: SessionsClient | null = null;

// Resolve Google credentials to an explicit object so the SDK never has to
// chase a relative file path (which breaks when cwd isn't the project root).
function resolveCredentials(): object | undefined {
  // Option 1: base64-encoded JSON — ideal for production / CI environments
  if (process.env.GOOGLE_CREDENTIALS_BASE64) {
    const json = Buffer.from(
      process.env.GOOGLE_CREDENTIALS_BASE64,
      "base64"
    ).toString("utf-8");
    return JSON.parse(json);
  }

  // Option 2: file path — convert relative paths to absolute so the SDK
  // always finds the file regardless of where Node was invoked from.
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const rawPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const absPath = path.isAbsolute(rawPath)
      ? rawPath
      : path.resolve(process.cwd(), rawPath);

    if (!fs.existsSync(absPath)) {
      throw new Error(
        `Credentials file not found at resolved path: ${absPath}\n` +
          `(GOOGLE_APPLICATION_CREDENTIALS=${rawPath})`
      );
    }

    // Read and parse the file ourselves so the SDK receives an object,
    // not a path — this sidesteps the relative-path resolution bug entirely.
    return JSON.parse(fs.readFileSync(absPath, "utf-8"));
  }

  throw new Error(
    "No Google credentials configured. Set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CREDENTIALS_BASE64."
  );
}

// Lazily initialize the client on first use rather than at module load time,
// so the server can start up even if credentials aren't configured yet.
function getClient(): SessionsClient {
  if (!client) {
    const credentials = resolveCredentials();
    client = new SessionsClient({ credentials });
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
