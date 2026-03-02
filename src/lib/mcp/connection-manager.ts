import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { McpServer } from "@/lib/db/schema";
import { getOAuthProvider } from "./oauth-provider";
import { extractOAuthConfig } from "./oauth-config";

interface ConnectionEntry {
  client: Client;
  transport: StreamableHTTPClientTransport;
  connectedAt: Date;
}

/**
 * Manages a pool of MCP client connections, one per registered server.
 * Lazy connects on first use, auto-reconnects on failure.
 */
class MCPConnectionManager {
  private connections: Map<string, ConnectionEntry> = new Map();

  /**
   * Connect to an MCP server and return the client.
   */
  async connect(server: McpServer): Promise<Client> {
    // Return existing connection if available
    const existing = this.connections.get(server.id);
    if (existing) {
      return existing.client;
    }

    const client = new Client({
      name: "jarvis",
      version: "0.1.0",
    });

    let transport: StreamableHTTPClientTransport;

    if (server.authType === "oauth") {
      const { clientId, callbackPort } = extractOAuthConfig(server.authConfig);
      // Use OAuth provider for MCP OAuth 2.1 flow
      const provider = getOAuthProvider(server.id, server.url, clientId, callbackPort);
      transport = new StreamableHTTPClientTransport(new URL(server.url), {
        authProvider: provider,
      });
    } else {
      // Build request headers based on auth config
      const headers: Record<string, string> = {};
      if (server.authType === "bearer" && server.authConfig) {
        const config = JSON.parse(server.authConfig);
        headers["Authorization"] = `Bearer ${config.token}`;
      } else if (server.authType === "header" && server.authConfig) {
        const config = JSON.parse(server.authConfig);
        Object.assign(headers, config.headers || config);
      }

      transport = new StreamableHTTPClientTransport(new URL(server.url), {
        requestInit: {
          headers: Object.keys(headers).length > 0 ? headers : undefined,
        },
      });
    }

    try {
      await client.connect(transport);
      this.connections.set(server.id, {
        client,
        transport,
        connectedAt: new Date(),
      });
      console.log(`[MCP] Connected to ${server.name} (${server.url})`);
      return client;
    } catch (error) {
      console.error(
        `[MCP] Failed to connect to ${server.name}:`,
        error instanceof Error ? error.message : error
      );
      throw new Error(
        `Failed to connect to MCP server "${server.name}": ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Disconnect from an MCP server.
   */
  async disconnect(serverId: string): Promise<void> {
    const entry = this.connections.get(serverId);
    if (entry) {
      try {
        await entry.client.close();
      } catch {
        // Ignore close errors
      }
      this.connections.delete(serverId);
    }
  }

  /**
   * Get an existing client connection, or null if not connected.
   */
  getClient(serverId: string): Client | null {
    const entry = this.connections.get(serverId);
    return entry?.client ?? null;
  }

  /**
   * Check if a server is connected.
   */
  isConnected(serverId: string): boolean {
    return this.connections.has(serverId);
  }

  /**
   * Reconnect to a server (disconnect then connect).
   */
  async reconnect(server: McpServer): Promise<Client> {
    await this.disconnect(server.id);
    return this.connect(server);
  }

  /**
   * Disconnect all servers.
   */
  async disconnectAll(): Promise<void> {
    const ids = Array.from(this.connections.keys());
    await Promise.allSettled(ids.map((id) => this.disconnect(id)));
  }

  /**
   * Get connection status for all servers.
   */
  getStatus(): Map<string, { connected: boolean; connectedAt?: Date }> {
    const status = new Map<
      string,
      { connected: boolean; connectedAt?: Date }
    >();
    for (const [id, entry] of this.connections) {
      status.set(id, { connected: true, connectedAt: entry.connectedAt });
    }
    return status;
  }
}

// Singleton instance
export const connectionManager = new MCPConnectionManager();
