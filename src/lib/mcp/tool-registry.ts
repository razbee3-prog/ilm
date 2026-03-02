import { db } from "@/lib/db";
import {
  mcpServers,
  discoveredTools,
  type McpServer,
  type DiscoveredTool,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { connectionManager } from "./connection-manager";

export interface McpJsonConfig {
  mcpServers: Record<
    string,
    {
      type?: string;
      url: string;
      oauth?: {
        clientId?: string;
        callbackPort?: number;
      };
    }
  >;
}

/**
 * CRUD operations for MCP servers and tool discovery.
 */
export const toolRegistry = {
  // ─── MCP Server CRUD ─────────────────────────────────────────

  async addServer(config: {
    name: string;
    url: string;
    transport?: string;
    authType?: string;
    authConfig?: string;
    icon?: string;
  }): Promise<McpServer> {
    const id = uuidv4();
    const server = {
      id,
      name: config.name,
      url: config.url,
      transport: config.transport || "http",
      authType: config.authType || "none",
      authConfig: config.authConfig || null,
      enabled: 1,
      icon: config.icon || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.insert(mcpServers).values(server);
    return server;
  },

  async removeServer(id: string): Promise<void> {
    await connectionManager.disconnect(id);
    // Cascade delete will remove discovered_tools
    await db.delete(mcpServers).where(eq(mcpServers.id, id));
  },

  async updateServer(
    id: string,
    updates: Partial<{
      name: string;
      url: string;
      transport: string;
      authType: string;
      authConfig: string;
      enabled: number;
      icon: string;
    }>
  ): Promise<void> {
    await db
      .update(mcpServers)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(mcpServers.id, id));
  },

  async listServers(): Promise<McpServer[]> {
    return db.select().from(mcpServers).all();
  },

  async getServer(id: string): Promise<McpServer | undefined> {
    const results = await db
      .select()
      .from(mcpServers)
      .where(eq(mcpServers.id, id));
    return results[0];
  },

  // ─── Tool Discovery ──────────────────────────────────────────

  async discoverTools(serverId: string): Promise<DiscoveredTool[]> {
    const server = await this.getServer(serverId);
    if (!server) throw new Error(`Server ${serverId} not found`);

    // Connect to MCP server
    const client = await connectionManager.connect(server);

    // List available tools
    const result = await client.listTools();

    // Clear existing cached tools for this server
    await db
      .delete(discoveredTools)
      .where(eq(discoveredTools.serverId, serverId));

    // Cache discovered tools
    const tools: DiscoveredTool[] = result.tools.map((tool) => ({
      id: uuidv4(),
      serverId,
      name: tool.name,
      description: tool.description || null,
      inputSchema: JSON.stringify(tool.inputSchema),
      enabled: 1,
      discoveredAt: new Date().toISOString(),
    }));

    if (tools.length > 0) {
      await db.insert(discoveredTools).values(tools);
    }

    console.log(
      `[Registry] Discovered ${tools.length} tools from ${server.name}`
    );
    return tools;
  },

  async refreshTools(serverId: string): Promise<DiscoveredTool[]> {
    return this.discoverTools(serverId);
  },

  async listAllTools(): Promise<
    (DiscoveredTool & { serverName: string; serverUrl: string })[]
  > {
    const results = await db
      .select({
        id: discoveredTools.id,
        serverId: discoveredTools.serverId,
        name: discoveredTools.name,
        description: discoveredTools.description,
        inputSchema: discoveredTools.inputSchema,
        enabled: discoveredTools.enabled,
        discoveredAt: discoveredTools.discoveredAt,
        serverName: mcpServers.name,
        serverUrl: mcpServers.url,
      })
      .from(discoveredTools)
      .innerJoin(mcpServers, eq(discoveredTools.serverId, mcpServers.id))
      .where(eq(mcpServers.enabled, 1))
      .all();
    return results;
  },

  async getToolsByServer(serverId: string): Promise<DiscoveredTool[]> {
    return db
      .select()
      .from(discoveredTools)
      .where(eq(discoveredTools.serverId, serverId))
      .all();
  },

  // ─── Import ───────────────────────────────────────────────────

  async importFromMcpJson(json: McpJsonConfig): Promise<McpServer[]> {
    const servers: McpServer[] = [];
    for (const [name, config] of Object.entries(json.mcpServers)) {
      if (!config.url) continue;

      let authType = "none";
      let authConfig: string | undefined;

      if (config.oauth) {
        authType = "oauth";
        authConfig = JSON.stringify(config.oauth);
      }

      const server = await this.addServer({
        name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize
        url: config.url,
        transport: config.type || "http",
        authType,
        authConfig,
      });
      servers.push(server);
    }
    return servers;
  },
};
