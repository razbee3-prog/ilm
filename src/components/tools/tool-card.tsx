"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  RefreshCw,
  Wrench,
  Loader2,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { McpServerWithTools } from "@/hooks/use-tools";
import { getServerMetadata } from "./server-metadata";

interface ToolCardProps {
  server: McpServerWithTools;
  onToggle: (id: string, enabled: boolean) => void;
  onDiscover: (id: string) => Promise<void>;
  onRemove: (id: string) => void;
  onStartOAuth?: (id: string) => Promise<void>;
}

function StatusDot({
  status,
}: {
  status: "authorized" | "needs-auth" | "connected" | "disconnected";
}) {
  const colors = {
    authorized: "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]",
    connected: "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]",
    "needs-auth": "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]",
    disconnected: "bg-zinc-500",
  };
  const labels = {
    authorized: "Authorized",
    connected: "Connected",
    "needs-auth": "Needs auth",
    disconnected: "Disconnected",
  };
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${colors[status]}`} />
      <span className="text-[10px] text-muted-foreground">{labels[status]}</span>
    </div>
  );
}

function getStatus(
  server: McpServerWithTools
): "authorized" | "needs-auth" | "connected" | "disconnected" {
  if (server.needsOAuth) return "needs-auth";
  if (server.oauthAuthenticated && server.authType === "oauth") return "authorized";
  if (server.connected) return "connected";
  return "disconnected";
}

export function ToolCard({
  server,
  onToggle,
  onDiscover,
  onRemove,
  onStartOAuth,
}: ToolCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);

  const meta = getServerMetadata(server.url);
  const status = getStatus(server);

  const handleDiscover = async () => {
    setDiscovering(true);
    setDiscoverError(null);
    try {
      await onDiscover(server.id);
    } catch (err) {
      setDiscoverError(
        err instanceof Error ? err.message : "Discovery failed"
      );
    } finally {
      setDiscovering(false);
    }
  };

  const handleOAuth = async () => {
    if (!onStartOAuth) return;
    setConnecting(true);
    setDiscoverError(null);
    try {
      await onStartOAuth(server.id);
    } catch (err) {
      setDiscoverError(
        err instanceof Error ? err.message : "OAuth failed"
      );
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Card className="overflow-hidden border-border/50 hover:border-border transition-colors">
      {/* Branded accent bar */}
      <div
        className="h-[3px]"
        style={{ backgroundColor: meta.accentColor }}
      />

      <div className="p-4">
        {/* Top row: logo + name + status + toggle */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Logo */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${meta.accentColor}15` }}
            >
              <div
                className="w-5 h-5"
                style={{ color: meta.accentColor }}
                dangerouslySetInnerHTML={{ __html: meta.logo }}
              />
            </div>

            {/* Name + description */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm truncate">
                  {server.name}
                </h3>
                <StatusDot status={status} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {meta.description}
              </p>
            </div>
          </div>

          {/* Toggle */}
          <button
            onClick={() => onToggle(server.id, !server.enabled)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${
              server.enabled ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                server.enabled ? "translate-x-4.5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* Capability pills */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {meta.capabilities.map((cap) => (
            <span
              key={cap}
              className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
            >
              {cap}
            </span>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-3">
          {server.needsOAuth && (
            <Button
              variant="default"
              size="sm"
              onClick={handleOAuth}
              disabled={connecting}
              className="text-white text-xs h-7"
              style={{
                backgroundColor: meta.accentColor,
                borderColor: meta.accentColor,
              }}
            >
              {connecting ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <KeyRound className="h-3 w-3 mr-1" />
              )}
              {connecting ? "Connecting..." : "Authenticate"}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleDiscover}
            disabled={discovering || server.needsOAuth}
            className="text-xs h-7"
          >
            {discovering ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            {discovering
              ? "Discovering..."
              : server.toolCount > 0
                ? `Refresh (${server.toolCount})`
                : "Discover Tools"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive h-7 w-7 p-0"
            onClick={() => onRemove(server.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>

          {server.tools.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="ml-auto text-xs h-7"
            >
              {expanded ? (
                <ChevronDown className="h-3 w-3 mr-1" />
              ) : (
                <ChevronRight className="h-3 w-3 mr-1" />
              )}
              {server.tools.length} tools
            </Button>
          )}
        </div>

        {discoverError && (
          <p className="text-xs text-destructive mt-2">{discoverError}</p>
        )}
      </div>

      {/* Expandable tool list */}
      {expanded && server.tools.length > 0 && (
        <div className="border-t border-border/50 px-4 py-3 bg-muted/20 max-h-[200px] overflow-y-auto">
          <div className="space-y-2">
            {server.tools.map((tool) => (
              <div
                key={tool.id}
                className="flex items-start gap-2 text-xs"
              >
                <Wrench className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <span className="font-medium text-foreground">
                    {tool.name}
                  </span>
                  {tool.description && (
                    <p className="text-muted-foreground line-clamp-1">
                      {tool.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
