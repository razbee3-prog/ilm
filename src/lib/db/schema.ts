import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const mcpServers = sqliteTable("mcp_servers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  transport: text("transport").default("http").notNull(), // 'http' | 'stdio'
  authType: text("auth_type").default("none").notNull(), // 'none' | 'oauth' | 'bearer' | 'header'
  authConfig: text("auth_config"), // JSON string
  enabled: integer("enabled").default(1).notNull(),
  icon: text("icon"),
  createdAt: text("created_at")
    .default(sql`(datetime('now'))`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(datetime('now'))`)
    .notNull(),
});

export const discoveredTools = sqliteTable("discovered_tools", {
  id: text("id").primaryKey(),
  serverId: text("server_id")
    .notNull()
    .references(() => mcpServers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  inputSchema: text("input_schema").notNull(), // JSON string
  enabled: integer("enabled").default(1).notNull(),
  discoveredAt: text("discovered_at")
    .default(sql`(datetime('now'))`)
    .notNull(),
});

export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  title: text("title"),
  createdAt: text("created_at")
    .default(sql`(datetime('now'))`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(datetime('now'))`)
    .notNull(),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(), // JSON: Anthropic content blocks
  createdAt: text("created_at")
    .default(sql`(datetime('now'))`)
    .notNull(),
});

export const memory = sqliteTable("memory", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  category: text("category").default("general").notNull(),
  createdAt: text("created_at")
    .default(sql`(datetime('now'))`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(datetime('now'))`)
    .notNull(),
});

export const oauthState = sqliteTable("oauth_state", {
  id: text("id").primaryKey(), // server ID
  tokens: text("tokens"), // JSON: OAuthTokens { access_token, refresh_token, token_type, expires_in }
  clientInfo: text("client_info"), // JSON: OAuthClientInformation from dynamic registration
  codeVerifier: text("code_verifier"), // PKCE code verifier
  discoveryState: text("discovery_state"), // JSON: cached discovery state
  updatedAt: text("updated_at")
    .default(sql`(datetime('now'))`)
    .notNull(),
});

// Type exports
export type McpServer = typeof mcpServers.$inferSelect;
export type NewMcpServer = typeof mcpServers.$inferInsert;
export type DiscoveredTool = typeof discoveredTools.$inferSelect;
export type NewDiscoveredTool = typeof discoveredTools.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Memory = typeof memory.$inferSelect;
