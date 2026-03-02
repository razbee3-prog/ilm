import Anthropic from "@anthropic-ai/sdk";
import { anthropicBridge } from "@/lib/mcp/anthropic-bridge";
import { sidekickMemory } from "./memory";
import { buildSystemPrompt } from "./system-prompt";
import { filterToolsByRelevance } from "./tool-filter";
import { db } from "@/lib/db";
import { messages, conversations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { rateLimiter } from "@/lib/rate-limiter";

export type StreamEvent =
  | { type: "text"; text: string }
  | {
      type: "tool_call";
      id: string;
      name: string;
      displayName: string;
      serverName: string;
      input: Record<string, unknown>;
    }
  | { type: "tool_result"; id: string; name: string; result: unknown; isError?: boolean }
  | { type: "done"; messageId: string }
  | { type: "error"; error: string };

const MAX_TOOL_LOOPS = 10;

/**
 * The Sidekick agent: orchestrates Claude + MCP tools.
 */
export class SidekickAgent {
  private _anthropic: Anthropic | null = null;

  private get anthropic(): Anthropic {
    if (!this._anthropic) {
      this._anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
    return this._anthropic;
  }

  /**
   * Send a message and stream the response.
   */
  async chat(
    conversationId: string,
    userMessage: string,
    onEvent: (event: StreamEvent) => void
  ): Promise<void> {
    try {
      // 1. Load conversation history
      const history = await this.loadHistory(conversationId);

      // 2. Save user message
      const userMsgId = uuidv4();
      await db.insert(messages).values({
        id: userMsgId,
        conversationId,
        role: "user",
        content: JSON.stringify([{ type: "text", text: userMessage }]),
      });

      // 3. Build messages array for Claude
      const claudeMessages: Anthropic.MessageParam[] = [
        ...history,
        { role: "user" as const, content: userMessage },
      ];

      // 4. Get tools and memory
      const allTools = await anthropicBridge.getAnthropicTools();
      // Filter tools based on user message to reduce token usage
      const tools = filterToolsByRelevance(allTools, userMessage);
      const memoryContext = await sidekickMemory.buildContext();
      const systemPrompt = buildSystemPrompt(memoryContext, tools.length);

      // 5. Agent loop
      let loops = 0;
      let fullAssistantContent: Anthropic.ContentBlock[] = [];

      while (loops < MAX_TOOL_LOOPS) {
        loops++;

        // Check rate limit status and warn user if approaching limit
        const rateLimitStatus = rateLimiter.getStatus();
        if (rateLimitStatus.isRateLimited) {
          onEvent({
            type: "error",
            error: `Rate limited - wait ${rateLimitStatus.retryAfterSeconds}s before retrying`,
          });
        }

        // Execute API call with rate limiting
        // Estimate tokens: system prompt + messages + tools (~100 tokens per tool)
        const estimatedTokens =
          systemPrompt.length / 4 +
          JSON.stringify(claudeMessages).length / 4 +
          tools.length * 100;

        const response = await rateLimiter.executeWithRateLimit(
          () =>
            this.anthropic.messages.create({
              model: "claude-sonnet-4-20250514",
              max_tokens: 2048, // Reduced from 8192 for simple tasks
              system: systemPrompt,
              tools: tools.length > 0 ? tools : undefined,
              messages: claudeMessages,
            }),
          estimatedTokens
        );

        // Process content blocks
        for (const block of response.content) {
          if (block.type === "text") {
            onEvent({ type: "text", text: block.text });
            fullAssistantContent.push(block);
          } else if (block.type === "tool_use") {
            const toolInfo = anthropicBridge.getToolInfo(block.name);
            onEvent({
              type: "tool_call",
              id: block.id,
              name: block.name,
              displayName: toolInfo?.originalName || block.name,
              serverName: toolInfo?.serverName || "Unknown",
              input: block.input as Record<string, unknown>,
            });
            fullAssistantContent.push(block);
          }
        }

        // Check if we need to execute tools
        if (response.stop_reason === "tool_use") {
          // Add assistant response
          claudeMessages.push({
            role: "assistant" as const,
            content: response.content,
          });

          // Execute all tool calls and collect results
          const toolResults: Anthropic.ToolResultBlockParam[] = [];

          for (const block of response.content) {
            if (block.type === "tool_use") {
              const result = await anthropicBridge.executeTool(
                block.name,
                block.input as Record<string, unknown>
              );

              const resultContent =
                typeof result.content === "string"
                  ? result.content
                  : JSON.stringify(result.content);

              onEvent({
                type: "tool_result",
                id: block.id,
                name: block.name,
                result: result.content,
                isError: result.isError,
              });

              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: resultContent,
                is_error: result.isError,
              });
            }
          }

          // Add tool results as user message
          claudeMessages.push({
            role: "user" as const,
            content: toolResults,
          });

          // Reset for next loop iteration
          fullAssistantContent = [];
        } else {
          // end_turn — we're done
          break;
        }
      }

      // 6. Save assistant message
      const assistantMsgId = uuidv4();
      await db.insert(messages).values({
        id: assistantMsgId,
        conversationId,
        role: "assistant",
        content: JSON.stringify(fullAssistantContent),
      });

      // 7. Update conversation title if it's the first message
      const existingMsgs = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId));
      if (existingMsgs.length <= 2) {
        // First exchange — auto-title
        const title =
          userMessage.length > 50
            ? userMessage.substring(0, 50) + "..."
            : userMessage;
        await db
          .update(conversations)
          .set({ title, updatedAt: new Date().toISOString() })
          .where(eq(conversations.id, conversationId));
      }

      onEvent({ type: "done", messageId: assistantMsgId });
    } catch (error) {
      console.error("[Sidekick] Chat error:", error);
      onEvent({
        type: "error",
        error:
          error instanceof Error ? error.message : "An unexpected error occurred",
      });
    }
  }

  /**
   * Load conversation history from the database.
   */
  private async loadHistory(
    conversationId: string
  ): Promise<Anthropic.MessageParam[]> {
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .all();

    const claudeMessages: Anthropic.MessageParam[] = [];

    for (const msg of msgs) {
      const content = JSON.parse(msg.content);
      if (msg.role === "user") {
        // User messages are either plain text or tool results
        const textContent = content
          .filter((b: { type: string }) => b.type === "text")
          .map((b: { text: string }) => b.text)
          .join("");
        if (textContent) {
          claudeMessages.push({ role: "user", content: textContent });
        }
      } else if (msg.role === "assistant") {
        claudeMessages.push({ role: "assistant", content });
      }
    }

    return claudeMessages;
  }
}

// Singleton
export const sidekickAgent = new SidekickAgent();
