import { NextResponse } from "next/server";
import { google } from "googleapis";
import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CreateEventRequest {
  summary: string;
  description?: string;
  startTime: string;
  endTime: string;
  attendees?: string[];
  location?: string;
}

async function getCalendarClient() {
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

  return google.calendar({ version: "v3", auth: oauth2Client });
}

export async function POST(request: Request) {
  try {
    const body: CreateEventRequest = await request.json();

    // Validate required fields
    if (!body.summary || !body.startTime || !body.endTime) {
      return NextResponse.json(
        { error: "Missing required fields: summary, startTime, endTime" },
        { status: 400 }
      );
    }

    const calendar = await getCalendarClient();

    const event = {
      summary: body.summary,
      description: body.description,
      location: body.location,
      start: {
        dateTime: body.startTime,
      },
      end: {
        dateTime: body.endTime,
      },
      attendees: body.attendees?.map((email) => ({ email })) || [],
    };

    const result = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event as any,
    });

    return NextResponse.json({
      success: true,
      event: {
        id: result.data.id,
        title: result.data.summary,
        startTime: result.data.start?.dateTime,
        endTime: result.data.end?.dateTime,
        htmlLink: result.data.htmlLink,
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Failed to create event";

    if (errorMsg.includes("self-signed certificate") || errorMsg.includes("certificate")) {
      console.error("Calendar SSL Certificate Error:", errorMsg);
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
