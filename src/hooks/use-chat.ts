"use client";

import { useState, useCallback, useRef } from "react";
import { estimateTotalTokens } from "@/lib/token-utils";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCallInfo[];
  isStreaming?: boolean;
}

export interface ToolCallInfo {
  id: string;
  name: string;
  displayName: string;
  serverName: string;
  input: Record<string, unknown>;
  result?: unknown;
  isError?: boolean;
  status: "pending" | "complete" | "error";
}

/**
 * Prune old messages to reduce token count while keeping recent context
 * Aggressively reduces token usage to stay within rate limits
 * @param msgs Messages to prune
 * @param maxMessages Maximum messages to keep (default: 8 - very aggressive)
 * @param maxTokens Maximum token budget (default: 20,000 - conservative limit)
 * @returns Pruned messages array with truncated content
 */
function pruneMessages(
  msgs: ChatMessage[],
  maxMessages: number = 8,
  maxTokens: number = 20000
): ChatMessage[] {
  // If we have fewer messages than max, still prune if too many tokens
  if (msgs.length <= maxMessages) {
    // Even recent messages might be too long, truncate them
    return truncateLongMessages(msgs, maxTokens);
  }

  // Keep only the last maxMessages messages
  // This preserves recent context while dropping old conversations
  const pruned = msgs.slice(-maxMessages);

  // Truncate individual message content if still too long
  return truncateLongMessages(pruned, maxTokens);
}

/**
 * Truncate individual message content to reduce tokens
 * Keeps the most recent messages intact, truncates older ones
 */
function truncateLongMessages(
  msgs: ChatMessage[],
  maxTokens: number
): ChatMessage[] {
  const maxCharsPerMessage = 500; // ~125 tokens per message max

  return msgs.map((msg, idx) => {
    // Keep the most recent messages intact
    if (idx >= msgs.length - 2) {
      return msg;
    }

    // Truncate older messages
    if (msg.content.length > maxCharsPerMessage) {
      return {
        ...msg,
        content: msg.content.substring(0, maxCharsPerMessage) + "...[truncated]",
      };
    }
    return msg;
  });
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  // Prevent concurrent requests to avoid token spike
  const requestQueueRef = useRef<boolean>(false);

  const createConversation = useCallback(async (): Promise<string> => {
    const response = await fetch("/api/conversations", { method: "POST" });
    const data = await response.json();
    setConversationId(data.id);
    return data.id;
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    const response = await fetch(`/api/conversations/${id}`);
    const data = await response.json();
    setConversationId(id);

    const loadedMessages: ChatMessage[] = data.messages.map(
      (msg: { id: string; role: string; content: Array<{ type: string; text?: string }> }) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content
          .filter((b: { type: string }) => b.type === "text")
          .map((b: { text?: string }) => b.text || "")
          .join(""),
        toolCalls: [],
      })
    );
    setMessages(loadedMessages);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      // Prevent concurrent requests to avoid token burst
      if (requestQueueRef.current) {
        console.warn("Request already in progress. Please wait for it to complete.");
        return;
      }
      requestQueueRef.current = true;

      let activeConversationId = conversationId;
      if (!activeConversationId) {
        activeConversationId = await createConversation();
      }

      // Add user message
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      // Create assistant message placeholder
      const assistantId = `assistant-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        toolCalls: [],
        isStreaming: true,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      try {
        abortControllerRef.current = new AbortController();

        // Prune old messages to manage token count
        // This keeps the UI showing all messages but only sends recent ones to the API
        const prunedMessages = pruneMessages(messages);

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: activeConversationId,
            message: text,
            // Send pruned message history to API for context
            // Full message history is still displayed in UI
            messages: prunedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events from buffer
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          let eventType = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              const data = line.slice(6);
              try {
                const parsed = JSON.parse(data);
                handleStreamEvent(assistantId, eventType, parsed);
              } catch {
                // Ignore parse errors for partial data
              }
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content:
                    msg.content ||
                    `Error: ${error instanceof Error ? error.message : "Something went wrong"}`,
                  isStreaming: false,
                }
              : msg
          )
        );
      } finally {
        requestQueueRef.current = false; // Allow next request
        setIsLoading(false);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId ? { ...msg, isStreaming: false } : msg
          )
        );
      }
    },
    [conversationId, isLoading, createConversation]
  );

  const handleStreamEvent = useCallback(
    (assistantId: string, eventType: string, data: Record<string, unknown>) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== assistantId) return msg;

          switch (eventType) {
            case "text":
              return { ...msg, content: msg.content + (data.text as string) };

            case "tool_call":
              return {
                ...msg,
                toolCalls: [
                  ...(msg.toolCalls || []),
                  {
                    id: data.id as string,
                    name: data.name as string,
                    displayName: data.displayName as string,
                    serverName: data.serverName as string,
                    input: data.input as Record<string, unknown>,
                    status: "pending" as const,
                  },
                ],
              };

            case "tool_result":
              return {
                ...msg,
                toolCalls: (msg.toolCalls || []).map((tc) =>
                  tc.id === data.id
                    ? {
                        ...tc,
                        result: data.result,
                        isError: data.isError as boolean | undefined,
                        status: (data.isError ? "error" : "complete") as
                          | "complete"
                          | "error",
                      }
                    : tc
                ),
              };

            case "done":
              return { ...msg, isStreaming: false };

            case "error":
              return {
                ...msg,
                content:
                  msg.content || `Error: ${data.error as string}`,
                isStreaming: false,
              };

            default:
              return msg;
          }
        })
      );
    },
    []
  );

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

  return {
    messages,
    isLoading,
    conversationId,
    sendMessage,
    loadConversation,
    createConversation,
    stopStreaming,
    clearMessages,
  };
}
