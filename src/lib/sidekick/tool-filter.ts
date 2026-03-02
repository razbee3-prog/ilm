import type Anthropic from "@anthropic-ai/sdk";

/**
 * Keyword-based tool filtering
 * Analyzes user message and returns only relevant tools
 */

interface ServiceKeywords {
  keywords: string[];
  always?: boolean; // Always include this service
}

const SERVICE_KEYWORDS: Record<string, ServiceKeywords> = {
  slack: {
    keywords: ["slack", "message", "send", "post", "channel", "dm", "direct"],
  },
  gmail: {
    keywords: [
      "email",
      "gmail",
      "send email",
      "message",
      "inbox",
      "compose",
      "draft",
    ],
  },
  calendar: {
    keywords: [
      "calendar",
      "meeting",
      "schedule",
      "event",
      "appointment",
      "book",
      "reserve",
      "time",
    ],
  },
  stocks: {
    keywords: ["stock", "price", "market", "share", "portfolio", "trade"],
  },
  news: {
    keywords: ["news", "article", "headline", "latest"],
  },
  social: {
    keywords: ["twitter", "social", "post", "tweet", "linkedin", "facebook"],
  },
  notion: {
    keywords: ["notion", "database", "page", "document", "note"],
  },
  linear: {
    keywords: ["linear", "issue", "ticket", "bug", "task", "project"],
  },
};

/**
 * Extract keywords from a message
 */
function extractKeywords(message: string): Set<string> {
  const lowerMessage = message.toLowerCase();
  const words = lowerMessage.split(/[\s\W]+/);
  return new Set(words.filter((word) => word.length > 2));
}

/**
 * Get relevant service names based on user message
 */
function getRelevantServices(userMessage: string): Set<string> {
  const messageKeywords = extractKeywords(userMessage);
  const relevantServices = new Set<string>();

  // Check each service's keywords
  for (const [service, config] of Object.entries(SERVICE_KEYWORDS)) {
    const serviceKeywords = new Set(
      config.keywords.map((k) => k.toLowerCase())
    );

    // Check if any message keywords match service keywords
    for (const keyword of messageKeywords) {
      if (serviceKeywords.has(keyword)) {
        relevantServices.add(service);
        break;
      }

      // Also check for partial matches (e.g., "slack" in "slacking")
      for (const serviceKeyword of serviceKeywords) {
        if (serviceKeyword.includes(keyword) || keyword.includes(serviceKeyword)) {
          relevantServices.add(service);
          break;
        }
      }
    }

    // Always include services marked as essential
    if (config.always) {
      relevantServices.add(service);
    }
  }

  return relevantServices;
}

/**
 * Filter tools based on user message
 * Returns only tools relevant to the user's request
 */
export function filterToolsByRelevance(
  tools: Anthropic.Tool[],
  userMessage: string
): Anthropic.Tool[] {
  // If message is too short or generic, return all tools (user might want flexibility)
  if (userMessage.length < 10) {
    return tools;
  }

  const relevantServices = getRelevantServices(userMessage);

  // If no services matched, return all tools (fallback)
  if (relevantServices.size === 0) {
    return tools;
  }

  // Filter tools by relevant services
  return tools.filter((tool) => {
    const toolName = tool.name.toLowerCase();
    const toolDescription = (tool.description || "").toLowerCase();

    // Check if tool name or description mentions a relevant service
    for (const service of relevantServices) {
      if (
        toolName.includes(service) ||
        toolDescription.includes(service) ||
        toolName.includes(`${service}__`)
      ) {
        return true;
      }
    }

    // Include built-in tools that might be useful
    if (
      toolName.includes("memory") ||
      toolName.includes("builtin")
    ) {
      return true;
    }

    return false;
  });
}

/**
 * Get a summary of which services are available
 */
export function getAvailableServices(tools: Anthropic.Tool[]): string[] {
  const services = new Set<string>();

  for (const tool of tools) {
    const description = tool.description || "";
    const match = description.match(/\[(.*?)\]/);
    if (match) {
      services.add(match[1]);
    }
  }

  return Array.from(services).sort();
}
