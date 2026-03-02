import { NextRequest } from "next/server";
import { sidekickAgent, type StreamEvent } from "@/lib/sidekick/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/chat
 * Send a message to Sidekick, receive SSE stream of events.
 */
export async function POST(request: NextRequest) {
  const { conversationId, message } = await request.json();

  if (!conversationId || !message) {
    return new Response(
      JSON.stringify({ error: "conversationId and message are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: StreamEvent) => {
        const data = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      try {
        await sidekickAgent.chat(conversationId, message, sendEvent);
      } catch (error) {
        sendEvent({
          type: "error",
          error:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
