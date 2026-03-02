import { NextRequest, NextResponse } from "next/server";
import { toolRegistry } from "@/lib/mcp/tool-registry";
import { connectionManager } from "@/lib/mcp/connection-manager";
import { db } from "@/lib/db";
import { oauthState } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * GET /api/tools
 * List all registered MCP servers with their discovered tools.
 */
export async function GET() {
  const servers = await toolRegistry.listServers();

  const serversWithTools = await Promise.all(
    servers.map(async (server) => {
      const tools = await toolRegistry.getToolsByServer(server.id);

      // Check OAuth status for OAuth servers
      let oauthAuthenticated = false;
      if (server.authType === "oauth") {
        const oauthRows = await db
          .select()
          .from(oauthState)
          .where(eq(oauthState.id, server.id));
        if (oauthRows[0]?.tokens) {
          try {
            const tokens = JSON.parse(oauthRows[0].tokens);
            oauthAuthenticated = !!tokens.access_token;
          } catch {
            oauthAuthenticated = false;
          }
        }
      }

      return {
        ...server,
        tools: tools.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          enabled: t.enabled,
        })),
        connected: connectionManager.isConnected(server.id),
        toolCount: tools.length,
        oauthAuthenticated,
        needsOAuth: server.authType === "oauth" && !oauthAuthenticated,
      };
    })
  );

  return NextResponse.json(serversWithTools);
}

/**
 * POST /api/tools
 * Register a new MCP server.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, url, transport, authType, authConfig, icon } = body;

  if (!name || !url) {
    return NextResponse.json(
      { error: "name and url are required" },
      { status: 400 }
    );
  }

  const server = await toolRegistry.addServer({
    name,
    url,
    transport,
    authType,
    authConfig: authConfig ? JSON.stringify(authConfig) : undefined,
    icon,
  });

  return NextResponse.json(server, { status: 201 });
}
