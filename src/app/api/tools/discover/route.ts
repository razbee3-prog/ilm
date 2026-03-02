import { NextRequest, NextResponse } from "next/server";
import { toolRegistry } from "@/lib/mcp/tool-registry";

export const runtime = "nodejs";

/**
 * POST /api/tools/discover
 * Connect to an MCP server and discover its tools.
 */
export async function POST(request: NextRequest) {
  const { serverId } = await request.json();

  if (!serverId) {
    return NextResponse.json(
      { error: "serverId is required" },
      { status: 400 }
    );
  }

  try {
    const tools = await toolRegistry.discoverTools(serverId);
    return NextResponse.json({
      success: true,
      toolCount: tools.length,
      tools: tools.map((t) => ({
        name: t.name,
        description: t.description,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: `Failed to discover tools: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
