#!/usr/bin/env node
/**
 * Jarvis — Unified Startup Script
 *
 * Launches all services in parallel:
 *   1. Next.js dev server (port 3333)
 *   2. Google Workspace MCP server (port 3340)
 *
 * All output is prefixed with the service name and color-coded.
 * Ctrl+C stops everything.
 */

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

// ANSI colors
const COLORS = {
  next: "\x1b[36m",    // cyan
  google: "\x1b[33m",  // yellow
  system: "\x1b[90m",  // gray
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function prefix(name, color) {
  return `${color}[${name}]${COLORS.reset}`;
}

function log(name, color, msg) {
  const lines = msg.toString().split("\n").filter(Boolean);
  for (const line of lines) {
    console.log(`${prefix(name, color)} ${line}`);
  }
}

console.log(`\n${COLORS.bold}🤖 Jarvis — Starting all services...${COLORS.reset}\n`);

const children = [];

// 1. Next.js dev server
const next = spawn("npx", ["next", "dev", "--turbopack", "--port", "3333"], {
  cwd: projectRoot,
  env: { ...process.env, PORT: "3333" },
  stdio: ["ignore", "pipe", "pipe"],
});
next.stdout.on("data", (d) => log("next", COLORS.next, d));
next.stderr.on("data", (d) => log("next", COLORS.next, d));
next.on("exit", (code) => {
  log("system", COLORS.system, `Next.js exited (code ${code})`);
  cleanup();
});
children.push(next);

// 2. Google Workspace MCP server
const google = spawn("node", ["scripts/google-workspace-mcp.mjs"], {
  cwd: projectRoot,
  stdio: ["ignore", "pipe", "pipe"],
});
google.stdout.on("data", (d) => log("google", COLORS.google, d));
google.stderr.on("data", (d) => log("google", COLORS.google, d));
google.on("exit", (code) => {
  log("system", COLORS.system, `Google Workspace MCP exited (code ${code})`);
});
children.push(google);

// Cleanup on exit
function cleanup() {
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
}

process.on("SIGINT", () => {
  console.log(`\n${COLORS.system}Shutting down all services...${COLORS.reset}`);
  cleanup();
  setTimeout(() => process.exit(0), 1000);
});

process.on("SIGTERM", () => {
  cleanup();
  setTimeout(() => process.exit(0), 1000);
});

// Keep alive
setInterval(() => {}, 60000);
