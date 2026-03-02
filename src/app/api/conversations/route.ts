import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { conversations } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";

/**
 * GET /api/conversations
 * List all conversations, most recent first.
 */
export async function GET() {
  const results = await db
    .select()
    .from(conversations)
    .orderBy(desc(conversations.updatedAt))
    .all();

  return NextResponse.json(results);
}

/**
 * POST /api/conversations
 * Create a new conversation.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const id = uuidv4();
  const now = new Date().toISOString();

  const conversation = {
    id,
    title: body.title || null,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(conversations).values(conversation);
  return NextResponse.json(conversation, { status: 201 });
}
