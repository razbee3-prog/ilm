/**
 * Utility functions for estimating and managing token usage
 * Uses a simple approximation: ~4 characters per token (OpenAI's empirical ratio)
 */

/**
 * Estimate token count for a single string
 * @param text The text to estimate tokens for
 * @returns Approximate token count
 */
export function estimateTokens(text: string): number {
  // Simple approximation: 4 characters = 1 token
  return Math.ceil(text.length / 4);
}

/**
 * Estimate total tokens for a message (including role and formatting)
 * @param role The message role (user/assistant)
 * @param content The message content
 * @returns Approximate token count
 */
export function estimateMessageTokens(role: string, content: string): number {
  // Add ~4 tokens for role/formatting
  return estimateTokens(content) + 4;
}

/**
 * Estimate total tokens for an array of messages
 * @param messages Array of messages with role and content
 * @returns Approximate total token count
 */
export function estimateTotalTokens(
  messages: Array<{ role: string; content: string }>
): number {
  return messages.reduce((total, msg) => {
    return total + estimateMessageTokens(msg.role, msg.content);
  }, 0);
}

/**
 * Format token count for display (e.g., 1,234 tokens)
 * @param tokens Token count
 * @returns Formatted string
 */
export function formatTokens(tokens: number): string {
  return `${tokens.toLocaleString()} token${tokens !== 1 ? "s" : ""}`;
}

/**
 * Get a warning level based on token count
 * @param tokens Current token count
 * @param limit Maximum token limit (default: 100,000)
 * @returns Warning level: 'safe' | 'warning' | 'critical'
 */
export function getTokenWarningLevel(
  tokens: number,
  limit: number = 100000
): "safe" | "warning" | "critical" {
  const percentage = (tokens / limit) * 100;
  if (percentage >= 90) return "critical";
  if (percentage >= 70) return "warning";
  return "safe";
}

/**
 * Estimate tokens for a message before sending
 * Includes the new user message + system context
 * @param newMessage The user's new message
 * @param previousMessages Previous messages in the conversation
 * @returns Object with token estimates
 */
export function estimateSendTokens(
  newMessage: string,
  previousMessages: Array<{ role: string; content: string }> = []
): {
  messageTokens: number;
  totalTokens: number;
  previousTokens: number;
} {
  const messageTokens = estimateMessageTokens("user", newMessage);
  const previousTokens = estimateTotalTokens(previousMessages);
  // Add ~50 tokens for system prompt and overhead (reduced for rate limit awareness)
  const systemOverhead = 50;
  const totalTokens = messageTokens + previousTokens + systemOverhead;

  return {
    messageTokens,
    totalTokens,
    previousTokens,
  };
}

/**
 * Get recommended context size based on token budget
 * For rate-limited scenarios
 * @param availableTokens Tokens available for this request (default: 20,000)
 * @returns Recommended message count and truncation strategy
 */
export function getContextRecommendation(
  availableTokens: number = 20000
): {
  maxMessages: number;
  truncateAfterChars: number;
  strategy: "aggressive" | "balanced" | "generous";
} {
  if (availableTokens < 10000) {
    return {
      maxMessages: 4,
      truncateAfterChars: 200,
      strategy: "aggressive",
    };
  } else if (availableTokens < 20000) {
    return {
      maxMessages: 6,
      truncateAfterChars: 400,
      strategy: "balanced",
    };
  } else {
    return {
      maxMessages: 10,
      truncateAfterChars: 600,
      strategy: "generous",
    };
  }
}
