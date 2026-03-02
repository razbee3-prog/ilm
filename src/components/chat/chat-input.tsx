"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Square, AlertCircle, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  estimateSendTokens,
  getTokenWarningLevel,
  formatTokens,
} from "@/lib/token-utils";

interface ChatMessage {
  role: string;
  content: string;
}

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isLoading: boolean;
  disabled?: boolean;
  previousMessages?: ChatMessage[];
}

export function ChatInput({
  onSend,
  onStop,
  isLoading,
  disabled,
  previousMessages = [],
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Calculate token estimates with aggressive rate-limiting awareness
  const tokenEstimate = estimateSendTokens(input, previousMessages);
  const warningLevel = getTokenWarningLevel(tokenEstimate.totalTokens, 20000); // Use 20k budget instead of 100k

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
    }
  }, [input]);

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!input.trim() || isLoading || disabled) return;
    onSend(input.trim());
    setInput("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-border bg-card px-4 py-4 animate-fadeInUp">
      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? "Waiting for Sidekick..." : "Message Sidekick..."}
          className={`flex-1 bg-input border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 transition-all-300 min-h-[44px] max-h-[200px] placeholder-muted-foreground ${
            isLoading
              ? "border-primary/30 focus:ring-primary/30 opacity-75 cursor-not-allowed"
              : "border-border focus:ring-primary/50 focus:border-primary"
          }`}
          rows={1}
          disabled={disabled || isLoading}
        />
        {isLoading ? (
          <Button
            onClick={onStop}
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-xl shrink-0 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors-300"
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || disabled}
            size="icon"
            className="h-11 w-11 rounded-xl shrink-0 hover:shadow-md transition-all-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="space-y-2 mt-2">
        {isLoading && (
          <div className="text-xs bg-primary/10 text-primary px-3 py-2 rounded-lg flex items-center gap-2 animate-fadeInUp border border-primary/20">
            <Loader className="h-3 w-3 shrink-0 animate-spin" />
            <span>Sidekick is processing your request...</span>
          </div>
        )}
        {warningLevel === "critical" && (
          <div className="text-xs bg-red-500/10 text-red-600 px-3 py-2 rounded-lg flex items-center gap-2 animate-slideInLeft border border-red-500/20">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>
              Rate limit warning: High token usage. If errors occur, wait a moment before retrying.
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors-300 ${
              warningLevel === "critical"
                ? "bg-red-500/10 text-red-600 border border-red-500/20"
                : warningLevel === "warning"
                  ? "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20"
                  : "text-muted-foreground"
            }`}
          >
            {warningLevel === "critical" && (
              <AlertCircle className="h-3 w-3" />
            )}
            <span>
              {input.trim() ? `${tokenEstimate.messageTokens}` : "0"} /{" "}
              {tokenEstimate.totalTokens}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
