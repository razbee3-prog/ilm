"use client";

import { useEffect, useRef } from "react";
import { useChat } from "@/hooks/use-chat";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { Zap } from "lucide-react";

interface ChatInterfaceProps {
  conversationId?: string;
  clearKey?: number;
}

export function ChatInterface({ conversationId, clearKey }: ChatInterfaceProps) {
  const {
    messages,
    isLoading,
    sendMessage,
    loadConversation,
    stopStreaming,
    clearMessages,
  } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Clear messages when clearKey changes
  useEffect(() => {
    if (clearKey && clearKey > 0) {
      clearMessages();
    }
  }, [clearKey, clearMessages]);

  // Load existing conversation
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId, loadConversation]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 animate-scaleIn">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2 text-foreground animate-fadeInUp">
              Hello! I&apos;m Sidekick
            </h2>
            <p className="text-muted-foreground max-w-md text-sm animate-fadeInUp mb-8" style={{ animationDelay: "0.1s" }}>
              Your personal AI assistant. I can help you with your connected
              tools — search Slack, check your calendar, manage tasks, and
              more. What can I help you with?
            </p>

            {/* Template Prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md w-full animate-fadeInUp" style={{ animationDelay: "0.2s" }}>
              <button
                onClick={() => sendMessage("Get my daily summary")}
                className="p-3 text-left text-sm border border-border rounded-lg hover:bg-secondary/50 hover:border-primary/50 transition-all hover:shadow-sm group"
              >
                <div className="font-medium text-foreground group-hover:text-primary">Daily Summary</div>
                <div className="text-xs text-muted-foreground">Get an overview of your day</div>
              </button>

              <button
                onClick={() => sendMessage("Create a podcast recap of everything from yesterday")}
                className="p-3 text-left text-sm border border-border rounded-lg hover:bg-secondary/50 hover:border-primary/50 transition-all hover:shadow-sm group"
              >
                <div className="font-medium text-foreground group-hover:text-primary">Podcast Recap</div>
                <div className="text-xs text-muted-foreground">Summarize yesterday's highlights</div>
              </button>

              <button
                onClick={() => sendMessage("What are the top trending topics today?")}
                className="p-3 text-left text-sm border border-border rounded-lg hover:bg-secondary/50 hover:border-primary/50 transition-all hover:shadow-sm group"
              >
                <div className="font-medium text-foreground group-hover:text-primary">Trending Topics</div>
                <div className="text-xs text-muted-foreground">Show me what's trending</div>
              </button>

              <button
                onClick={() => sendMessage("Summarize my unread messages and important emails")}
                className="p-3 text-left text-sm border border-border rounded-lg hover:bg-secondary/50 hover:border-primary/50 transition-all hover:shadow-sm group"
              >
                <div className="font-medium text-foreground group-hover:text-primary">Catch Me Up</div>
                <div className="text-xs text-muted-foreground">Review what I've missed</div>
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex items-end gap-3 animate-fadeInUp">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-secondary/80 rounded-2xl px-4 py-3 max-w-xs shadow-sm">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-foreground/60 animate-pulse" style={{ animationDelay: "0s" }}></div>
                    <div className="w-2 h-2 rounded-full bg-foreground/60 animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-2 h-2 rounded-full bg-foreground/60 animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        onStop={stopStreaming}
        isLoading={isLoading}
        previousMessages={messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))}
      />
    </div>
  );
}
