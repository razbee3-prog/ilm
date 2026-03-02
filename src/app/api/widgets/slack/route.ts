import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mcpServers } from "@/lib/db/schema";
import { connectionManager } from "@/lib/mcp/connection-manager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SlackMessage {
  text?: string;
  from?: string;
  channel?: string;
  ts?: string;
}

/**
 * Parse the formatted text output from Slack search MCP tools into
 * a simple array of message objects.
 */
function parseSlackSearchText(text: string): SlackMessage[] {
  if (!text || text.length < 5) return [];
  const messages: SlackMessage[] = [];

  // Handle both the structured search response and plain text
  // Split by "From:" to get individual message blocks
  const fromBlocks = text.split(/From:\s+/);

  for (const block of fromBlocks.slice(1)) {
    // Extract user name - get everything up to first "(" or newline
    const nameMatch = block.match(/^([^(\n]+)/);
    let from = nameMatch ? nameMatch[1]?.trim() : "Unknown";

    // Extract the first meaningful text content
    // Look for "Text:" or just take the next substantive content
    let msgText = "";

    // Try to find "Text:" section
    const textMatch = block.match(/Text:\s*\n?([\s\S]*?)(?:\nContext|---|\n\n|$)/i);
    if (textMatch) {
      msgText = textMatch[1]?.trim() || "";
    } else {
      // Fallback: just get content after ID line
      const contentMatch = block.match(/\(ID:[^\)]*\)\s*\n?([\s\S]{0,200})/);
      if (contentMatch) {
        msgText = contentMatch[1]?.trim() || "";
      }
    }

    // Clean up the message text
    // Remove markdown-like separators and context sections
    msgText = msgText
      .split(/^---$/m)[0] // Stop at --- separator
      .split(/^### Result/m)[0] // Stop at next result
      .split(/^Context (before|after)/im)[0] // Stop at context sections
      .split(/^Participants:/im)[0] // Remove participants line
      .trim();

    // Replace escape sequences with spaces
    msgText = msgText
      .replace(/\\n/g, " ")
      .replace(/\\t/g, " ")
      .replace(/\\\//g, "/") // Fix escaped slashes
      .replace(/\\\\/g, "\\")
      .replace(/\s+/g, " ") // Collapse multiple spaces
      .trim();

    // Remove metadata patterns like "Message_ts: 1234567890"
    msgText = msgText
      .replace(/\d{10,}\.\d+/g, "") // Remove message timestamps
      .replace(/Message_ts:.*?(?=\s|$)/gi, "")
      .replace(/Time:.*?(?=\s(?:EST|UTC|CST)|$)/gi, "")
      .replace(/Permalink:.*?(?=\s|$)/gi, "")
      .replace(/Reply count:.*?(?=\s|$)/gi, "")
      .trim();

    // Remove leading dashes and metadata markers
    msgText = msgText
      .replace(/^[\s\-•⊡*]+/, "") // Remove leading bullets/dashes
      .replace(/- From:.*$/m, "") // Remove inline "From:" references
      .replace(/\s+/g, " ") // Final space cleanup
      .trim();

    // Limit to ~20 words / 120 chars
    const words = msgText.split(" ").slice(0, 20);
    msgText = words.join(" ").slice(0, 120).trim();

    // Only add if we have valid data
    if (from && from.length > 1 && msgText && msgText.length > 3 && !msgText.includes("Result")) {
      messages.push({ from, channel: "", text: msgText });
    }
  }

  return messages.slice(0, 10);
}

function parseResult(result: unknown): SlackMessage[] {
  const r = result as { isError?: boolean; content?: { type: string; text: string }[] };
  const rawText = r.content?.find((c) => c.type === "text")?.text || "";
  if (r.isError || !rawText) return [];
  try {
    const parsed = JSON.parse(rawText);
    if (Array.isArray(parsed)) return parsed;
    if (parsed.messages) return parsed.messages;
  } catch { /* not JSON */ }
  return parseSlackSearchText(rawText);
}

export async function GET() {
  try {
    const servers = await db.select().from(mcpServers).all();
    const server = servers.find((s) => s.url.includes("slack.com"));

    if (!server) {
      return NextResponse.json({ error: "Slack server not found" }, { status: 404 });
    }

    let client;
    try {
      client = await connectionManager.connect(server);
    } catch (connErr) {
      return NextResponse.json(
        { error: `Slack connection failed: ${connErr instanceof Error ? connErr.message : "unknown"}` },
        { status: 503 }
      );
    }

    // Run searches in parallel — each independently guarded
    const [mentionsResult, dmsResult] = await Promise.allSettled([
      client.callTool({ name: "slack_search_public_and_private", arguments: { query: "to:me is:unread", limit: 10 } }),
      client.callTool({ name: "slack_search_public_and_private", arguments: { query: "is:dm is:unread has:text", limit: 8 } }),
    ]);

    const mentions = mentionsResult.status === "fulfilled" ? parseResult(mentionsResult.value) : [];
    const dms = dmsResult.status === "fulfilled" ? parseResult(dmsResult.value) : [];

    return NextResponse.json({
      mentions: mentions.slice(0, 8),
      dms: dms.slice(0, 5),
      totalUnread: mentions.length + dms.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch Slack data" },
      { status: 500 }
    );
  }
}
