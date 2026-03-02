import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * GET /api/conversations/[id]
 * Get a conversation with all its messages.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const conversation = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id));

  if (conversation.length === 0) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt))
    .all();

  // Parse content JSON for each message
  const parsedMessages = msgs.map((msg) => ({
    ...msg,
    content: JSON.parse(msg.content),
  }));

  return NextResponse.json({
    ...conversation[0],
    messages: parsedMessages,
  });
}

/**
 * DELETE /api/conversations/[id]
 * Delete a conversation and all its messages.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(conversations).where(eq(conversations.id, id));
  return NextResponse.json({ success: true });
}
