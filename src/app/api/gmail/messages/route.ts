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

  oauth2Client.setCredentials({
    refresh_token: tokens.refresh_token,
    access_token: tokens.access_token,
    expiry_date: tokens.expiry_date,
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("query") || "is:unread";
    const maxResults = parseInt(url.searchParams.get("maxResults") || "10");

    const gmail = await getGmailClient();

    // Search for messages
    const result = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: Math.min(maxResults, 100),
    });

    const messageIds = result.data.messages?.map((m) => m.id) || [];

    // Get full details for each message
    const messages = await Promise.all(
      messageIds.map((id) =>
        gmail.users.messages
          .get({
            userId: "me",
            id: id!,
            format: "metadata",
            metadataHeaders: ["Subject", "From", "Date", "To"],
          })
          .then((res) => res.data)
          .catch(() => null)
      )
    );

    const formattedMessages = messages
      .filter((msg) => msg !== null)
      .map((msg) => {
        const headers = msg.payload?.headers || [];
        const getHeader = (name: string) =>
          headers.find((h) => h.name === name)?.value || "";

        return {
          id: msg.id,
          subject: getHeader("Subject") || "(no subject)",
          from: getHeader("From") || "Unknown",
          to: getHeader("To") || "",
          snippet: msg.snippet || "",
          date: getHeader("Date") || "",
          internalDate: msg.internalDate || "",
        };
      });

    return NextResponse.json({
      count: messageIds.length,
      messages: formattedMessages,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Failed to fetch Gmail messages";

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
