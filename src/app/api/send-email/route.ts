import { NextResponse } from "next/server";
import { google } from "googleapis";
import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

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

export async function POST(request: Request) {
  try {
    const body: SendEmailRequest = await request.json();

    // Validate required fields
    if (!body.to || !body.subject || !body.body) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, body" },
        { status: 400 }
      );
    }

    const gmail = await getGmailClient();

    // Create email message
    const email = [
      `To: ${body.to}`,
      body.cc ? `Cc: ${body.cc}` : "",
      body.bcc ? `Bcc: ${body.bcc}` : "",
      `Subject: ${body.subject}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      body.body,
    ]
      .filter(Boolean)
      .join("\n");

    // Encode email in base64
    const encodedEmail = Buffer.from(email).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

    // Send email
    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedEmail,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Email sent to ${body.to}`,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Failed to send email";

    console.error("Send Email Error:", errorMsg);

    // Handle SSL certificate errors
    if (errorMsg.includes("self-signed certificate") || errorMsg.includes("certificate")) {
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

    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
