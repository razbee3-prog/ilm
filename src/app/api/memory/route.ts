import { NextRequest, NextResponse } from "next/server";
import { sidekickMemory } from "@/lib/sidekick/memory";

export const runtime = "nodejs";

/**
 * GET /api/memory
 * List all memory entries.
 */
export async function GET() {
  const entries = await sidekickMemory.listAll();
  return NextResponse.json(entries);
}

/**
 * POST /api/memory
 * Set a memory entry.
 */
export async function POST(request: NextRequest) {
  const { key, value, category } = await request.json();

  if (!key || !value) {
    return NextResponse.json(
      { error: "key and value are required" },
      { status: 400 }
    );
  }

  await sidekickMemory.set(key, value, category);
  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/memory
 * Delete a memory entry by key.
 */
export async function DELETE(request: NextRequest) {
  const { key } = await request.json();

  if (!key) {
    return NextResponse.json(
      { error: "key is required" },
      { status: 400 }
    );
  }

  await sidekickMemory.delete(key);
  return NextResponse.json({ success: true });
}
