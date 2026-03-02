"use client";

import { useEffect, useState } from "react";
import { Bell, MessageSquare, RefreshCw, AlertCircle } from "lucide-react";

interface SlackMessage {
  text?: string;
  from?: string;
  channel?: string;
  ts?: string;
}

function truncate(str: string, max = 120): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

function formatSlackText(text: string): string {
  // Strip Slack markup
  return text
    .replace(/<@[A-Z0-9]+(?:\|[^>]+)?>/g, "@user")
    .replace(/<#[A-Z0-9]+(?:\|([^>]+))?>/g, "#$1")
    .replace(/<([^>|]+)(?:\|([^>]+))?>/g, "$2")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .trim();
}

export function SlackWidget() {
  const [data, setData] = useState<{ mentions: SlackMessage[]; dms: SlackMessage[]; totalUnread: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"mentions" | "dms">("mentions");

  const load = async () => {
    try {
      setError(null);
      const res = await fetch("/api/widgets/slack");
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed");
      }
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Slack");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  const shown = tab === "mentions" ? data?.mentions || [] : data?.dms || [];

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-purple-500/20">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-purple-400">
              <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.163 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.163 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.163 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.27a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.315A2.528 2.528 0 0 1 24 15.163a2.528 2.528 0 0 1-2.522 2.523h-6.315z"/>
            </svg>
          </div>
          <span className="text-lg font-semibold text-slate-900">Slack</span>
          {data && data.totalUnread > 0 && (
            <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full font-medium">
              {data.totalUnread}
            </span>
          )}
        </div>
        <button onClick={load} className="text-gray-400 hover:text-gray-600 transition-colors">
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-4">
        <button
          onClick={() => setTab("mentions")}
          className={`text-xs py-2 mr-4 flex items-center gap-1 border-b-2 transition-colors ${
            tab === "mentions"
              ? "border-purple-400 text-slate-900"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <Bell className="h-2.5 w-2.5" />
          Mentions
        </button>
        <button
          onClick={() => setTab("dms")}
          className={`text-xs py-2 flex items-center gap-1 border-b-2 transition-colors ${
            tab === "dms"
              ? "border-purple-400 text-slate-900"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <MessageSquare className="h-2.5 w-2.5" />
          DMs
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="space-y-px p-2 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-3 rounded-lg">
                <div className="flex gap-2 mb-1.5">
                  <div className="w-5 h-5 bg-gray-200 rounded-full flex-shrink-0" />
                  <div className="h-2.5 bg-gray-200 rounded w-20" />
                </div>
                <div className="h-2.5 bg-gray-200 rounded w-full ml-7" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-gray-400">
            <AlertCircle className="h-5 w-5" />
            <span className="text-xs text-center px-4">{error}</span>
          </div>
        ) : shown.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-gray-400 text-xs">
            {tab === "mentions" ? "No unread mentions" : "No unread DMs"}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {shown.map((msg, i) => {
              const from = msg.from || "Unknown";
              const initials = from.slice(0, 2).toUpperCase();
              const text = msg.text ? formatSlackText(msg.text) : "";
              return (
                <div key={i} className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-default">
                  <div className="flex items-start gap-2.5">
                    {/* Avatar */}
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[9px] font-bold text-purple-300">{initials}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5 mb-0.5">
                        <span className="text-[11px] font-semibold text-slate-900">{from}</span>
                        {msg.channel && (
                          <span className="text-[10px] text-gray-500">#{msg.channel}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-600 leading-snug">
                        {truncate(text || "(no text)", 100)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
