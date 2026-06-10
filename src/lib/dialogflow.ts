import { SessionsClient } from "@google-cloud/dialogflow";
import * as path from "path";
import * as fs from "fs";
import type { DialogflowResult } from "../types";

// reuse one gRPC client for the whole server lifetime
let client: SessionsClient | null = null;

function resolveCredentials(): object | undefined {
  // base64 JSON — good for prod/CI
  if (process.env.GOOGLE_CREDENTIALS_BASE64) {
    const json = Buffer.from(
      process.env.GOOGLE_CREDENTIALS_BASE64,
      "base64"
    ).toString("utf-8");
    return JSON.parse(json);
  }

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

    return JSON.parse(fs.readFileSync(absPath, "utf-8"));
  }

  throw new Error(
    "No Google credentials configured. Set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CREDENTIALS_BASE64."
  );
}

// lazy init so the server can boot without credentials configured yet
function getClient(): SessionsClient {
  if (!client) {
    const credentials = resolveCredentials();
    client = new SessionsClient({ credentials });
  }
  return client;
}

function buildSessionPath(sessionId: string): string {
  const projectId = process.env.DIALOGFLOW_PROJECT_ID!;
  return getClient().projectAgentSessionPath(projectId, sessionId);
}

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
