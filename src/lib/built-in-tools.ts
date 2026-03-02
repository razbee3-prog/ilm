import type Anthropic from "@anthropic-ai/sdk";

/**
 * Built-in tools that are implemented as local API routes
 * rather than relying on external MCP servers.
 * These tools are always available and don't require discovery.
 */

interface BuiltInTool {
  name: string;
  displayName: string;
  serverName: string;
  description: string;
  inputSchema: Anthropic.Tool.InputSchema;
  apiEndpoint: string;
  apiMethod: "GET" | "POST";
}

const GMAIL_TOOLS: BuiltInTool[] = [
  {
    name: "listMessages",
    displayName: "List Gmail Messages",
    serverName: "Gmail API",
    description: "Search and list emails from your Gmail account with filters",
    apiEndpoint: "/api/gmail/messages",
    apiMethod: "GET",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Gmail search query (e.g., 'from:user@example.com is:unread')",
        },
        maxResults: {
          type: "number",
          description: "Maximum number of messages to return (default: 10, max: 100)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "sendEmail",
    displayName: "Send Email",
    serverName: "Gmail API",
    description: "Send an email via Gmail",
    apiEndpoint: "/api/send-email",
    apiMethod: "POST",
    inputSchema: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "Email recipient address",
        },
        subject: {
          type: "string",
          description: "Email subject line",
        },
        body: {
          type: "string",
          description: "Email body content",
        },
        cc: {
          type: "string",
          description: "Carbon copy recipients (optional, comma-separated)",
        },
        bcc: {
          type: "string",
          description: "Blind carbon copy recipients (optional, comma-separated)",
        },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    name: "getMessageDetails",
    displayName: "Get Email Details",
    serverName: "Gmail API",
    description: "Get full details of a specific email message",
    apiEndpoint: "/api/gmail/message",
    apiMethod: "GET",
    inputSchema: {
      type: "object",
      properties: {
        messageId: {
          type: "string",
          description: "The Gmail message ID",
        },
      },
      required: ["messageId"],
    },
  },
];

const CALENDAR_TOOLS: BuiltInTool[] = [
  {
    name: "listEvents",
    displayName: "List Calendar Events",
    serverName: "Google Calendar API",
    description: "List upcoming events from your Google Calendar",
    apiEndpoint: "/api/calendar/events",
    apiMethod: "GET",
    inputSchema: {
      type: "object",
      properties: {
        timeMin: {
          type: "string",
          description: "Lower bound for event start time (RFC3339 format, e.g., 2024-01-01T00:00:00Z)",
        },
        timeMax: {
          type: "string",
          description: "Upper bound for event end time (RFC3339 format)",
        },
        maxResults: {
          type: "number",
          description: "Maximum number of events to return (default: 10, max: 250)",
        },
      },
    },
  },
  {
    name: "createEvent",
    displayName: "Create Calendar Event",
    serverName: "Google Calendar API",
    description: "Create a new event on your Google Calendar",
    apiEndpoint: "/api/calendar/create-event",
    apiMethod: "POST",
    inputSchema: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "Event title",
        },
        description: {
          type: "string",
          description: "Event description (optional)",
        },
        startTime: {
          type: "string",
          description: "Event start time (RFC3339 format)",
        },
        endTime: {
          type: "string",
          description: "Event end time (RFC3339 format)",
        },
        attendees: {
          type: "array",
          items: { type: "string" },
          description: "Email addresses of attendees (optional)",
        },
        location: {
          type: "string",
          description: "Event location (optional)",
        },
      },
      required: ["summary", "startTime", "endTime"],
    },
  },
];

const WIDGET_TOOLS: BuiltInTool[] = [
  {
    name: "getWidgetData",
    displayName: "Get Widget Data",
    serverName: "Dashboard Widgets",
    description: "Retrieve data from dashboard widgets (news, analytics, stocks, etc.)",
    apiEndpoint: "/api/widgets/query",
    apiMethod: "GET",
    inputSchema: {
      type: "object",
      properties: {
        widget: {
          type: "string",
          enum: ["news", "analytics", "stocks", "calendar", "gmail", "slack", "social"],
          description: "The widget to retrieve data from (news, analytics, stocks, calendar, gmail, slack, social)",
        },
        limit: {
          type: "number",
          description: "Maximum number of items to return (default: 10)",
        },
      },
      required: ["widget"],
    },
  },
];

export class BuiltInToolsProvider {
  private toolMap: Map<string, BuiltInTool> = new Map();

  constructor() {
    const allTools = [...GMAIL_TOOLS, ...CALENDAR_TOOLS, ...WIDGET_TOOLS];
    for (const tool of allTools) {
      const key = `builtin__${tool.name}`;
      this.toolMap.set(key, tool);
    }
  }

  /**
   * Get all built-in tools as Anthropic tools
   */
  getAnthropicTools(): Anthropic.Tool[] {
    return Array.from(this.toolMap.values()).map((tool) => ({
      name: `builtin__${tool.name}`,
      description: `[${tool.serverName}] ${tool.description}`,
      input_schema: tool.inputSchema as Anthropic.Tool.InputSchema,
    }));
  }

  /**
   * Execute a built-in tool by calling its API endpoint
   */
  async executeTool(
    toolName: string,
    toolInput: Record<string, unknown>
  ): Promise<{ content: unknown; isError?: boolean }> {
    const tool = this.toolMap.get(toolName);
    if (!tool) {
      return {
        content: `Built-in tool "${toolName}" not found`,
        isError: true,
      };
    }

    try {
      // Get base URL from environment or use default for local development
      let baseUrl: string;
      if (process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`;
      } else if (process.env.NEXT_PUBLIC_API_URL) {
        baseUrl = process.env.NEXT_PUBLIC_API_URL;
      } else {
        // Local development - try to connect to common ports
        const port = process.env.PORT || "3333";
        baseUrl = `http://localhost:${port}`;
      }

      const url = new URL(tool.apiEndpoint, baseUrl);

      // Add query parameters for GET requests
      if (tool.apiMethod === "GET") {
        for (const [key, value] of Object.entries(toolInput)) {
          if (value !== undefined) {
            url.searchParams.append(key, String(value));
          }
        }
      }

      const response = await fetch(url.toString(), {
        method: tool.apiMethod,
        headers: { "Content-Type": "application/json" },
        body: tool.apiMethod === "POST" ? JSON.stringify(toolInput) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          content: `API error: ${response.status} - ${errorText}`,
          isError: true,
        };
      }

      const result = await response.json();
      return { content: result };
    } catch (error) {
      return {
        content: `Error executing built-in tool "${tool.name}": ${error instanceof Error ? error.message : "Unknown error"}`,
        isError: true,
      };
    }
  }

  /**
   * Get tool info by name
   */
  getToolInfo(toolName: string) {
    const tool = this.toolMap.get(toolName);
    if (!tool) return undefined;
    return {
      originalName: tool.name,
      serverName: tool.serverName,
      displayName: tool.displayName,
    };
  }
}

export const builtInToolsProvider = new BuiltInToolsProvider();
