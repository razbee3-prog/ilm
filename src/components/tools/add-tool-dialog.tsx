"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddToolDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (config: {
    name: string;
    url: string;
    transport?: string;
    authType?: string;
    authConfig?: Record<string, unknown>;
  }) => Promise<void>;
}

export function AddToolDialog({ open, onClose, onAdd }: AddToolDialogProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [authType, setAuthType] = useState("none");
  const [token, setToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onAdd({
        name,
        url,
        transport: "http",
        authType,
        authConfig:
          authType === "bearer" ? { token } : undefined,
      });
      // Reset form
      setName("");
      setUrl("");
      setAuthType("none");
      setToken("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add server");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div className="relative bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add MCP Server</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Slack"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">
              URL
            </label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://mcp.slack.com/mcp"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">
              Authentication
            </label>
            <select
              value={authType}
              onChange={(e) => setAuthType(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="none">None</option>
              <option value="bearer">Bearer Token</option>
              <option value="oauth">OAuth</option>
            </select>
          </div>

          {authType === "bearer" && (
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1.5">
                Token
              </label>
              <Input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Bearer token..."
                required
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add & Connect"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
