"use client";

import { useState, useCallback, useEffect } from "react";

export interface McpServerWithTools {
  id: string;
  name: string;
  url: string;
  transport: string;
  authType: string;
  authConfig: string | null;
  enabled: number;
  icon: string | null;
  connected: boolean;
  toolCount: number;
  oauthAuthenticated: boolean;
  needsOAuth: boolean;
  tools: {
    id: string;
    name: string;
    description: string | null;
    enabled: number;
  }[];
}

export function useTools() {
  const [servers, setServers] = useState<McpServerWithTools[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/tools");
      const data = await response.json();
      setServers(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load tools"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  const addServer = useCallback(
    async (config: {
      name: string;
      url: string;
      transport?: string;
      authType?: string;
      authConfig?: Record<string, unknown>;
      icon?: string;
    }) => {
      const response = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add server");
      }

      await fetchServers();
    },
    [fetchServers]
  );

  const removeServer = useCallback(
    async (id: string) => {
      await fetch(`/api/tools/${id}`, { method: "DELETE" });
      await fetchServers();
    },
    [fetchServers]
  );

  const toggleServer = useCallback(
    async (id: string, enabled: boolean) => {
      await fetch(`/api/tools/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: enabled ? 1 : 0 }),
      });
      await fetchServers();
    },
    [fetchServers]
  );

  const discoverTools = useCallback(
    async (serverId: string) => {
      const response = await fetch("/api/tools/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Discovery failed");
      }

      await fetchServers();
      return data;
    },
    [fetchServers]
  );

  const importConfig = useCallback(
    async (config: Record<string, unknown>) => {
      const response = await fetch("/api/tools/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Import failed");
      }

      await fetchServers();
      return data;
    },
    [fetchServers]
  );

  const startOAuth = useCallback(
    async (serverId: string): Promise<{ status: string; authorizationUrl?: string }> => {
      const response = await fetch("/api/oauth/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to start OAuth");
      }

      if (data.status === "redirect" && data.authorizationUrl) {
        // Open the authorization URL in a new window/tab
        window.open(data.authorizationUrl, "_blank", "width=600,height=700");

        // If using callbackPort (temp server), poll for token completion
        if (data.callbackPort) {
          const pollInterval = setInterval(async () => {
            try {
              const statusResp = await fetch("/api/tools");
              const servers = await statusResp.json();
              const server = servers.find((s: { id: string }) => s.id === serverId);
              if (server?.oauthAuthenticated) {
                clearInterval(pollInterval);
                await fetchServers();
              }
            } catch {
              // ignore polling errors
            }
          }, 2000);

          // Stop polling after 5 minutes
          setTimeout(() => clearInterval(pollInterval), 300_000);
        }
      }

      return data;
    },
    [fetchServers]
  );

  return {
    servers,
    isLoading,
    error,
    addServer,
    removeServer,
    toggleServer,
    discoverTools,
    importConfig,
    startOAuth,
    refresh: fetchServers,
  };
}
