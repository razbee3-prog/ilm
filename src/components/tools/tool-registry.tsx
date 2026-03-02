"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Upload, Wrench, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTools } from "@/hooks/use-tools";
import { ToolCard } from "./tool-card";
import { AddToolDialog } from "./add-tool-dialog";
import { ImportDialog } from "./import-dialog";

export function ToolRegistryDashboard() {
  const {
    servers,
    isLoading,
    error,
    addServer,
    removeServer,
    toggleServer,
    discoverTools,
    importConfig,
    startOAuth,
    refresh,
  } = useTools();
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [oauthMessage, setOauthMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Handle OAuth callback URL params (?connected=Name or ?error=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const oauthError = params.get("error");

    if (connected) {
      setOauthMessage({ type: "success", text: `Successfully connected to ${connected}!` });
      // Clean up URL params
      window.history.replaceState({}, "", "/tools");
      // Refresh to show updated status
      refresh();
    } else if (oauthError) {
      setOauthMessage({ type: "error", text: `OAuth error: ${oauthError}` });
      window.history.replaceState({}, "", "/tools");
    }
  }, [refresh]);

  // Auto-dismiss messages after 5 seconds
  useEffect(() => {
    if (oauthMessage) {
      const timer = setTimeout(() => setOauthMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [oauthMessage]);

  const handleStartOAuth = useCallback(
    async (serverId: string) => {
      try {
        const result = await startOAuth(serverId);
        if (result.status === "already_authorized") {
          setOauthMessage({ type: "success", text: "Already authorized! Try discovering tools." });
          refresh();
        }
      } catch (err) {
        setOauthMessage({
          type: "error",
          text: err instanceof Error ? err.message : "OAuth failed",
        });
      }
    },
    [startOAuth, refresh]
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wrench className="h-6 w-6 text-primary" />
              Tool Registry
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Connect MCP servers to give Sidekick access to your tools
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowImport(true)}
            >
              <Upload className="h-4 w-4 mr-1" />
              Import
            </Button>
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Server
            </Button>
          </div>
        </div>

        {/* OAuth Status Messages */}
        {oauthMessage && (
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-lg mb-4 text-sm ${
              oauthMessage.type === "success"
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {oauthMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            {oauthMessage.text}
            <button
              onClick={() => setOauthMessage(null)}
              className="ml-auto text-xs opacity-60 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-destructive">{error}</p>
          </div>
        ) : servers.length === 0 ? (
          <div className="text-center py-20">
            <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">No tools connected</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Add an MCP server or import a .mcp.json config to get started
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => setShowImport(true)}
              >
                <Upload className="h-4 w-4 mr-1" />
                Import Config
              </Button>
              <Button onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Server
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {servers.map((server) => (
              <ToolCard
                key={server.id}
                server={server}
                onToggle={toggleServer}
                onDiscover={discoverTools}
                onRemove={removeServer}
                onStartOAuth={handleStartOAuth}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AddToolDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={addServer}
      />
      <ImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        onImport={importConfig}
      />
    </div>
  );
}
