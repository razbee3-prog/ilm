import { NextRequest, NextResponse } from "next/server";
import { toolRegistry } from "@/lib/mcp/tool-registry";
import { getOAuthProvider } from "@/lib/mcp/oauth-provider";
import { extractOAuthConfig } from "@/lib/mcp/oauth-config";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export const runtime = "nodejs";

/**
 * GET /api/oauth/callback
 * OAuth callback handler for servers WITHOUT a callbackPort.
 * (Servers with a callbackPort use the temporary callback server instead.)
 *
 * The serverId is passed via a cookie (set in /api/oauth/start).
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3333";

  if (error) {
    return NextResponse.redirect(
      `${appUrl}/tools?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  // Read serverId from cookie (set during /api/oauth/start)
  const serverId = request.cookies.get("jarvis_oauth_server_id")?.value;

  if (!serverId || !code) {
    return NextResponse.redirect(
      `${appUrl}/tools?error=${encodeURIComponent("Missing serverId cookie or authorization code. Please try authenticating again.")}`
    );
  }

  const server = await toolRegistry.getServer(serverId);
  if (!server) {
    return NextResponse.redirect(
      `${appUrl}/tools?error=${encodeURIComponent("Server not found")}`
    );
  }

  const { clientId, callbackPort } = extractOAuthConfig(server.authConfig);
  const provider = getOAuthProvider(serverId, server.url, clientId, callbackPort);

  // Exchange the authorization code for tokens
  const client = new Client({ name: "jarvis", version: "0.1.0" });
  const transport = new StreamableHTTPClientTransport(new URL(server.url), {
    authProvider: provider,
  });

  try {
    await transport.finishAuth(code);
    await client.connect(transport);

    await toolRegistry.updateServer(serverId, { authType: "oauth" });

    try {
      const result = await client.listTools();
      console.log(
        `[OAuth] Connected to ${server.name}, found ${result.tools.length} tools`
      );
    } catch {
      // Tool discovery can happen later
    }

    await client.close();
  } catch (err) {
    console.error("[OAuth] Token exchange failed:", err);
    const errMsg =
      err instanceof Error ? err.message : "Token exchange failed";
    return NextResponse.redirect(
      `${appUrl}/tools?error=${encodeURIComponent(errMsg)}`
    );
  }

  // Success — redirect back to tools page & clear the cookie
  const response = NextResponse.redirect(
    `${appUrl}/tools?connected=${encodeURIComponent(server.name)}`
  );
  response.cookies.delete("jarvis_oauth_server_id");
  return response;
}
