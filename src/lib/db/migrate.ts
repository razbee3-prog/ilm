import type Database from "better-sqlite3";

/**
 * Run database migrations inline (no drizzle-kit needed at runtime).
 * Creates tables if they don't exist.
 */
export function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS mcp_servers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      transport TEXT NOT NULL DEFAULT 'http',
      auth_type TEXT NOT NULL DEFAULT 'none',
      auth_config TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,
      icon TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS discovered_tools (
      id TEXT PRIMARY KEY,
      server_id TEXT NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      input_schema TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      discovered_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS memory (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS oauth_state (
      id TEXT PRIMARY KEY,
      tokens TEXT,
      client_info TEXT,
      code_verifier TEXT,
      discovery_state TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_discovered_tools_server ON discovered_tools(server_id);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_memory_key ON memory(key);
    CREATE INDEX IF NOT EXISTS idx_memory_category ON memory(category);
  `);
}
