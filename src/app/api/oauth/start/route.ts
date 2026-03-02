import { NextRequest, NextResponse } from "next/server";
import { toolRegistry } from "@/lib/mcp/tool-registry";
import { getOAuthProvider } from "@/lib/mcp/oauth-provider";
import { extractOAuthConfig } from "@/lib/mcp/oauth-config";
import { startOAuthCallbackServer } from "@/lib/mcp/oauth-callback-server";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { UnauthorizedError } from "@modelcontextprotocol/sdk/client/auth.js";

export const runtime = "nodejs";

/**
 * POST /api/oauth/start
 * Start the OAuth flow for an MCP server.
 *
 * For servers with a callbackPort (e.g., Slack, Gmail):
 *   - Spins up a temporary HTTP server on the callbackPort
 *   - Returns the authorization URL to redirect the user
 *   - When the user approves, the temp server catches the callback,
 *     exchanges the code for tokens, and shuts down.
 *
 * For servers without callbackPort:
 *   - Uses our own /api/oauth/callback as the redirect URI.
 */
export async function POST(request: NextRequest) {
  const { serverId } = await request.json();

  if (!serverId) {
    return NextResponse.json(
      { error: "serverId is required" },
      { status: 400 }
    );
  }

  const server = await toolRegistry.getServer(serverId);
  if (!server) {
    return NextResponse.json(
      { error: "Server not found" },
      { status: 404 }
    );
  }

  const { clientId, callbackPort } = extractOAuthConfig(server.authConfig);
  const provider = getOAuthProvider(serverId, server.url, clientId, callbackPort);

  // Clear any previous pending auth URL
  provider.clearPendingAuthUrl();

  // Check if we already have valid tokens
  const existingTokens = await provider.tokens();
  if (existingTokens?.access_token) {
    return NextResponse.json({
      status: "already_authorized",
      message: "Already have tokens for this server",
    });
  }

  // Try to connect — this will trigger the OAuth discovery and redirect
  const client = new Client({ name: "jarvis", version: "0.1.0" });
  const transport = new StreamableHTTPClientTransport(new URL(server.url), {
    authProvider: provider,
  });

  try {
    await client.connect(transport);
    // If connect succeeds, we're already authorized
    await client.close();
    return NextResponse.json({
      status: "already_authorized",
      message: "Connection succeeded without OAuth",
    });
  } catch (error) {
    if (error instanceof UnauthorizedError || provider.pendingAuthUrl) {
      const authUrl = provider.pendingAuthUrl;
      if (!authUrl) {
        return NextResponse.json(
          { error: "OAuth required but no authorization URL was generated" },
          { status: 500 }
        );
      }

      // If there's a callbackPort, start a temp server to catch the callback
      if (callbackPort) {
        // Start the temp callback server (non-blocking — runs in background)
        startOAuthCallbackServer(callbackPort)
          .then(async ({ code, cleanup }) => {
            try {
              console.log(`[OAuth] Received code on port ${callbackPort}, exchanging for tokens...`);

              // Create a fresh transport to finish auth
              const finishTransport = new StreamableHTTPClientTransport(
                new URL(server.url),
                { authProvider: provider }
              );
              await finishTransport.finishAuth(code);

              // Verify we can connect
              const verifyClient = new Client({ name: "jarvis", version: "0.1.0" });
              const verifyTransport = new StreamableHTTPClientTransport(
                new URL(server.url),
                { authProvider: provider }
              );
              await verifyClient.connect(verifyTransport);

              // Mark as oauth-authenticated
              await toolRegistry.updateServer(serverId, { authType: "oauth" });

              // Discover tools
              try {
                const result = await verifyClient.listTools();
                console.log(
                  `[OAuth] Connected to ${server.name}, found ${result.tools.length} tools`
                );
              } catch {
                // Tool discovery can happen later
              }

              await verifyClient.close();
              console.log(`[OAuth] Successfully authenticated ${server.name}`);
            } catch (err) {
              console.error("[OAuth] Token exchange failed:", err);
            } finally {
              cleanup();
            }
          })
          .catch((err) => {
            console.error("[OAuth] Callback server error:", err);
          });
      }

      // Return the auth URL — frontend will open it in a popup
      const response = NextResponse.json({
        status: "redirect",
        authorizationUrl: authUrl.toString(),
        callbackPort: callbackPort || null,
      });

      // For non-callbackPort servers, set the cookie for our /api/oauth/callback
      if (!callbackPort) {
        response.cookies.set("jarvis_oauth_server_id", serverId, {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: 600,
        });
      }

      return response;
    }

    // Some other error
    console.error("[OAuth] Start failed:", error);
    return NextResponse.json(
      {
        error: `Failed to start OAuth: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
