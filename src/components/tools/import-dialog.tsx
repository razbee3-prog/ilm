"use client";

import { useState } from "react";
import { X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (config: Record<string, unknown>) => Promise<{ imported: number }>;
}

export function ImportDialog({ open, onClose, onImport }: ImportDialogProps) {
  const [jsonInput, setJsonInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string[]>([]);

  if (!open) return null;

  const handleParse = (value: string) => {
    setJsonInput(value);
    setError(null);
    setPreview([]);

    if (!value.trim()) return;

    try {
      const parsed = JSON.parse(value);
      if (parsed.mcpServers) {
        setPreview(Object.keys(parsed.mcpServers));
      } else {
        setError("Missing 'mcpServers' key in JSON");
      }
    } catch {
      setError("Invalid JSON");
    }
  };

  const handleImport = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const parsed = JSON.parse(jsonInput);
      const result = await onImport(parsed);
      alert(`Successfully imported ${result.imported} servers!`);
      setJsonInput("");
      setPreview([]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import MCP Servers
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">
              Paste your .mcp.json contents
            </label>
            <textarea
              value={jsonInput}
              onChange={(e) => handleParse(e.target.value)}
              placeholder={`{
  "mcpServers": {
    "slack": {
      "type": "http",
      "url": "https://mcp.slack.com/mcp"
    }
  }
}`}
              className="w-full h-48 bg-muted border border-border rounded-lg px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {preview.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Found {preview.length} server(s):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {preview.map((name) => (
                  <span
                    key={name}
                    className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-xs font-medium"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={isSubmitting || preview.length === 0}
            >
              {isSubmitting
                ? "Importing..."
                : `Import ${preview.length} Server${preview.length !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
