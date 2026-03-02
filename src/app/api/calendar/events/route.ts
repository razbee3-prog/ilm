import { NextResponse } from "next/server";
import { google } from "googleapis";
import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const timeMin = url.searchParams.get("timeMin");
    const timeMax = url.searchParams.get("timeMax");
    const maxResults = parseInt(url.searchParams.get("maxResults") || "10");

    const calendar = await getCalendarClient();

    // If no time range specified, default to next 8 hours
    const now = new Date();
    const eightHoursLater = new Date(now.getTime() + 8 * 60 * 60 * 1000);

    const result = await calendar.events.list({
      calendarId: "primary",
      timeMin: timeMin || now.toISOString(),
      timeMax: timeMax || eightHoursLater.toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = (result.data.items || []).map((event) => ({
      id: event.id,
      title: event.summary || "Untitled",
      description: event.description || "",
      startTime: event.start?.dateTime || event.start?.date || "",
      endTime: event.end?.dateTime || event.end?.date || "",
      location: event.location || "",
      attendees: event.attendees?.map((a) => ({
        email: a.email,
        name: a.displayName || a.email,
        responseStatus: a.responseStatus || "needsAction",
      })) || [],
      conferenceData: event.conferenceData
        ? {
            conferenceSolution:
              event.conferenceData.conferenceSolution?.key?.type || "",
            entryPoints: event.conferenceData.entryPoints?.map((ep) => ({
              entryPointType: ep.entryPointType,
              uri: ep.uri,
              label: ep.label,
            })) || [],
          }
        : undefined,
    }));

    return NextResponse.json({ events });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Failed to fetch calendar events";

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
