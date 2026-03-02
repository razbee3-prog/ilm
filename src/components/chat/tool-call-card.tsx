"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Wrench, Check, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ToolCallInfo } from "@/hooks/use-chat";

export function ToolCallCard({ toolCall }: { toolCall: ToolCallInfo }) {
  const [expanded, setExpanded] = useState(false);

  const statusIcon = {
    pending: <Loader2 className="h-3 w-3 animate-spin text-primary" />,
    complete: <Check className="h-3 w-3 text-success" />,
    error: <X className="h-3 w-3 text-destructive" />,
  }[toolCall.status];

  const statusBadge = {
    pending: <Badge variant="secondary">Running</Badge>,
    complete: <Badge variant="success">Done</Badge>,
    error: <Badge variant="destructive">Error</Badge>,
  }[toolCall.status];

  return (
    <div className="my-2 rounded-lg border border-border bg-muted/50 overflow-hidden hover:bg-muted/70 transition-colors-300 shadow-sm hover:shadow-md animate-slideInLeft">
      <button
        className="flex items-center gap-2 w-full px-3 py-2.5 text-left text-sm hover:bg-muted/80 transition-colors-300 cursor-pointer group"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-shrink-0">{statusIcon}</div>
        <Wrench className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors-300" />
        <span className="font-medium text-foreground group-hover:font-semibold transition-all-300">
          {toolCall.displayName}
        </span>
        <span className="text-muted-foreground text-xs group-hover:text-muted-foreground/80 transition-colors-300">
          ({toolCall.serverName})
        </span>
        <div className="ml-auto flex items-center gap-2">
          {statusBadge}
          <div className="transition-transform-300">
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors-300" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors-300" />
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-border pt-3 bg-background/50 animate-fadeInUp">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
              Input
            </p>
            <pre className="text-xs bg-card rounded-md p-3 overflow-x-auto max-h-40 border border-border/50 font-mono text-foreground/70">
              {JSON.stringify(toolCall.input, null, 2)}
            </pre>
          </div>
          {toolCall.result !== undefined && (
            <div className="animate-fadeInUp">
              <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                Result
              </p>
              <pre className="text-xs bg-card rounded-md p-3 overflow-x-auto max-h-60 border border-border/50 font-mono text-foreground/70">
                {typeof toolCall.result === "string"
                  ? toolCall.result
                  : JSON.stringify(toolCall.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
