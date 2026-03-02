#!/usr/bin/env node
/**
 * Google Workspace MCP Server - HTTP Transport Wrapper
 *
 * Runs the google-workspace-mcp server with Streamable HTTP transport
 * so Jarvis can connect to it over HTTP instead of stdio.
 *
 * Usage:
 *   node scripts/google-workspace-mcp.mjs [--port 3340] [--read-only]
 *
 * Setup:
 *   1. Create Google Cloud project: https://console.cloud.google.com/
 *   2. Enable Gmail API and Google Calendar API
 *   3. Create OAuth 2.0 credentials (Desktop application)
 *   4. Download credentials.json to ~/.google-mcp/credentials.json
 *   5. Run: npx google-workspace-mcp accounts add default
 *   6. Start this server: node scripts/google-workspace-mcp.mjs
 */

import { spawn } from "child_process";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

// Parse CLI args
const args = process.argv.slice(2);
const portIndex = args.indexOf("--port");
const PORT = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) : 3340;
const READ_ONLY = args.includes("--read-only");

// Dynamically patch and start the server
async function start() {
  // Set env vars that google-workspace-mcp reads
  if (READ_ONLY) {
    process.env.GOOGLE_MCP_READ_ONLY = "true";
  }

  // Import FastMCP from the package's own dependency
  const fastmcpPath = resolve(
    projectRoot,
    "node_modules/google-workspace-mcp/node_modules/fastmcp/dist/FastMCP.js"
  );
  const { FastMCP } = await import(fastmcpPath);

  // Monkey-patch FastMCP.prototype.start to use httpStream
  const originalStart = FastMCP.prototype.start;
  FastMCP.prototype.start = async function (options) {
    console.error(`[wrapper] Overriding transport: stdio → httpStream (port ${PORT})`);
    return originalStart.call(this, {
      transportType: "httpStream",
      httpStream: {
        port: PORT,
        endpoint: "/mcp",
      },
    });
  };

  // Now import the server which will create and start the FastMCP instance
  const serverPath = resolve(
    projectRoot,
    "node_modules/google-workspace-mcp/dist/server.js"
  );

  console.error(`[wrapper] Starting Google Workspace MCP Server on http://localhost:${PORT}/mcp`);
  console.error(`[wrapper] Read-only: ${READ_ONLY}`);

  await import(serverPath);

  console.error(`[wrapper] Server started successfully`);
}

start().catch((err) => {
  console.error("[wrapper] Fatal error:", err);
  process.exit(1);
});
