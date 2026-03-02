import type Anthropic from "@anthropic-ai/sdk";
import { toolRegistry } from "./tool-registry";
import { connectionManager } from "./connection-manager";
import { builtInToolsProvider } from "@/lib/built-in-tools";
import { db } from "@/lib/db";
import { mcpServers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface ToolMapping {
  originalName: string;
  serverId?: string;
  serverName: string;
  isBuiltIn?: boolean;
}

/**
 * Bridges MCP tools to Anthropic tool_use format.
 * Handles schema conversion and tool call routing.
 */
export class AnthropicBridge {
  private toolMap: Map<string, ToolMapping> = new Map();

  /**
   * Get all enabled tools converted to Anthropic format.
   * Includes both MCP tools and built-in API-based tools.
   */
  async getAnthropicTools(): Promise<Anthropic.Tool[]> {
    this.toolMap.clear();
    const anthropicTools: Anthropic.Tool[] = [];

    // Add built-in tools first (Gmail, Calendar)
    const builtInTools = builtInToolsProvider.getAnthropicTools();
    for (const tool of builtInTools) {
      // Store mapping for routing
      this.toolMap.set(tool.name, {
        originalName: tool.name.replace("builtin__", ""),
        serverName: tool.description?.match(/\[(.*?)\]/)?.[1] || "Built-in",
        isBuiltIn: true,
      });
    }
    anthropicTools.push(...builtInTools);

    // Add MCP tools
    const allTools = await toolRegistry.listAllTools();
    for (const tool of allTools) {
      if (!tool.enabled) continue;

      // Create prefixed name: "slack__send_message"
      const prefix = tool.serverName.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const prefixedName = `${prefix}__${tool.name}`;

      // Store mapping for routing
      this.toolMap.set(prefixedName, {
        originalName: tool.name,
        serverId: tool.serverId,
        serverName: tool.serverName,
        isBuiltIn: false,
      });

      // Convert MCP schema to Anthropic format
      const inputSchema = JSON.parse(tool.inputSchema);
      anthropicTools.push({
        name: prefixedName,
        description: `[${tool.serverName}] ${tool.description || tool.name}`,
        input_schema: inputSchema as Anthropic.Tool.InputSchema,
      });
    }

    return anthropicTools;
  }

  /**
   * Execute a tool call by routing to either built-in or MCP tools.
   */
  async executeTool(
    toolName: string,
    toolInput: Record<string, unknown>
  ): Promise<{ content: unknown; isError?: boolean }> {
    const mapping = this.toolMap.get(toolName);
    if (!mapping) {
      return {
        content: `Tool "${toolName}" not found in registry.`,
        isError: true,
      };
    }

    // Route to built-in tools
    if (mapping.isBuiltIn) {
      return builtInToolsProvider.executeTool(toolName, toolInput);
    }

    // Route to MCP tools
    if (!mapping.serverId) {
      return {
        content: `No server ID for tool "${toolName}".`,
        isError: true,
      };
    }

    const servers = await db
      .select()
      .from(mcpServers)
      .where(eq(mcpServers.id, mapping.serverId));
    const server = servers[0];

    if (!server) {
      return {
        content: `MCP server for tool "${toolName}" not found.`,
        isError: true,
      };
    }

    try {
      // Ensure we're connected
      const client = await connectionManager.connect(server);

      // Call the tool with its original (unprefixed) name
      const result = await client.callTool({
        name: mapping.originalName,
        arguments: toolInput,
      });

      return {
        content: result.content,
        isError: result.isError as boolean | undefined,
      };
    } catch (error) {
      console.error(`[Bridge] Tool execution error:`, error);
      return {
        content: `Error executing tool "${mapping.originalName}" on ${mapping.serverName}: ${error instanceof Error ? error.message : "Unknown error"}`,
        isError: true,
      };
    }
  }

  /**
   * Get display info for a tool name (for UI).
   */
  getToolInfo(toolName: string): ToolMapping | undefined {
    return this.toolMap.get(toolName);
  }
}

// Singleton instance
export const anthropicBridge = new AnthropicBridge();
