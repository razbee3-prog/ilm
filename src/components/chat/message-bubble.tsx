"use client";

import { User, Zap } from "lucide-react";
import { ToolCallCard } from "./tool-call-card";
import type { ChatMessage } from "@/hooks/use-chat";
import ReactMarkdown from "react-markdown";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} animate-fadeInUp`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Zap className="h-4 w-4 text-primary" />
        </div>
      )}

      <div
        className={`max-w-[80%] ${isUser ? "order-first" : ""}`}
      >
        {isUser ? (
          <div className="bg-primary hover:bg-primary/90 rounded-2xl rounded-tr-sm px-4 py-2.5 transition-colors-300 shadow-sm">
            <p className="text-sm whitespace-pre-wrap text-primary-foreground">{message.content}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Tool calls */}
            {message.toolCalls?.map((tc) => (
              <ToolCallCard key={tc.id} toolCall={tc} />
            ))}

            {/* Text content */}
            {message.content && (
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5 prose prose-sm max-w-none text-sm text-foreground shadow-sm hover:shadow-md transition-colors-300">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            )}

            {/* Streaming indicator */}
            {message.isStreaming && !message.content && !message.toolCalls?.length && (
              <div className="flex items-center gap-1.5 px-4 py-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <div
                  className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
          <User className="h-4 w-4 text-secondary-foreground" />
        </div>
      )}
    </div>
  );
}
