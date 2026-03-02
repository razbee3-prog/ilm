import { NextResponse } from "next/server";
import { google } from "googleapis";
import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getGmailClient() {
  const configDir = join(homedir(), ".google-mcp");
  const credentialsPath = join(configDir, "credentials.json");
  const tokensPath = join(configDir, "tokens/default.json");

  const credentials = JSON.parse(readFileSync(credentialsPath, "utf8"));
  const tokens = JSON.parse(readFileSync(tokensPath, "utf8"));

  const oauth2Client = new google.auth.OAuth2(
    credentials.installed.client_id,
    credentials.installed.client_secret,
    credentials.installed.redirect_uris[0]
  );

  const credentialsToSet: any = {
    refresh_token: tokens.refresh_token,
  };

  if (tokens.access_token) {
    credentialsToSet.access_token = tokens.access_token;
  }

  if (tokens.expiry_date) {
    credentialsToSet.expiry_date = tokens.expiry_date;
  }

  oauth2Client.setCredentials(credentialsToSet);

  return google.gmail({ version: "v1", auth: oauth2Client });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const messageId = url.searchParams.get("messageId");

    if (!messageId) {
      return NextResponse.json(
        { error: "Missing required parameter: messageId" },
        { status: 400 }
      );
    }

    const gmail = await getGmailClient();

    const message = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });

    const headers = message.data.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name === name)?.value || "";

    // Get email body
    let body = "";
    if (message.data.payload?.parts) {
      const textPart = message.data.payload.parts.find(
        (p) => p.mimeType === "text/plain"
      );
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
      }
    } else if (message.data.payload?.body?.data) {
      body = Buffer.from(message.data.payload.body.data, "base64").toString(
        "utf-8"
      );
    }

    return NextResponse.json({
      id: message.data.id,
      threadId: message.data.threadId,
      subject: getHeader("Subject") || "(no subject)",
      from: getHeader("From") || "Unknown",
      to: getHeader("To") || "",
      cc: getHeader("Cc") || "",
      date: getHeader("Date") || "",
      body: body,
      snippet: message.data.snippet || "",
      labels: message.data.labelIds || [],
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Failed to fetch email";

    if (errorMsg.includes("self-signed certificate") || errorMsg.includes("certificate")) {
      console.error("Gmail SSL Certificate Error:", errorMsg);
      return NextResponse.json(
        {
          error: "SSL Certificate Error",
          message: "Cannot authenticate with Google. This is a network/proxy issue.",
          hint: "Try: NODE_OPTIONS='--use-system-ca' npm run dev",
          details: errorMsg,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
