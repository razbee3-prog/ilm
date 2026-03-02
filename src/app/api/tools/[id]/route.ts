import { NextRequest, NextResponse } from "next/server";
import { toolRegistry } from "@/lib/mcp/tool-registry";

export const runtime = "nodejs";

/**
 * PUT /api/tools/[id]
 * Update an MCP server config.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const server = await toolRegistry.getServer(id);
  if (!server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  await toolRegistry.updateServer(id, body);
  const updated = await toolRegistry.getServer(id);

  return NextResponse.json(updated);
}

/**
 * DELETE /api/tools/[id]
 * Remove an MCP server and its cached tools.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const server = await toolRegistry.getServer(id);
  if (!server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  await toolRegistry.removeServer(id);
  return NextResponse.json({ success: true });
}
