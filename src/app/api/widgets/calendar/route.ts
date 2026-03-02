import { NextResponse } from "next/server";
import { google } from "googleapis";
import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import https from "https";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees?: string[];
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

  return google.calendar({ version: "v3", auth: oauth2Client });
}

export async function GET() {
  try {
    const calendar = await getCalendarClient();

    // Get next 8 hours of meetings
    const now = new Date();
    const eightHoursLater = new Date(now.getTime() + 8 * 60 * 60 * 1000);

    const result = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: eightHoursLater.toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events: CalendarEvent[] = (result.data.items || []).map((event) => ({
      id: event.id || "",
      title: event.summary || "Untitled",
      startTime: event.start?.dateTime || event.start?.date || "",
      endTime: event.end?.dateTime || event.end?.date || "",
      location: event.location || "",
      attendees: event.attendees?.map((a) => a.displayName || a.email || "") || [],
    }));

    return NextResponse.json({ events });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Failed to fetch calendar data";

    // Handle SSL certificate errors
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

    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
