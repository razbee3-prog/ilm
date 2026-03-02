import { NextRequest, NextResponse } from "next/server";
import { toolRegistry, type McpJsonConfig } from "@/lib/mcp/tool-registry";

export const runtime = "nodejs";

/**
 * POST /api/tools/import
 * Import MCP servers from a .mcp.json config.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.mcpServers || typeof body.mcpServers !== "object") {
    return NextResponse.json(
      {
        error:
          'Invalid config format. Expected { mcpServers: { "name": { url: "..." } } }',
      },
      { status: 400 }
    );
  }

  try {
    const config: McpJsonConfig = { mcpServers: body.mcpServers };
    const servers = await toolRegistry.importFromMcpJson(config);

    return NextResponse.json({
      success: true,
      imported: servers.length,
      servers: servers.map((s) => ({ id: s.id, name: s.name, url: s.url })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: `Import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
