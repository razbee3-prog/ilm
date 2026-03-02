"use client";

import { useEffect, useState } from "react";
import { Mail, Star, RefreshCw, AlertCircle } from "lucide-react";

interface Email {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
  isImportant: boolean;
}

function fromName(from: string): string {
  // Extract display name from "Name <email@domain>" format
  const match = from.match(/^([^<]+)</);
  if (match) return match[1].trim();
  // If it's just an email, return the part before @
  return from.split("@")[0] || from;
}

function relativeDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = diffMs / 3_600_000;
    const diffD = diffMs / 86_400_000;
    if (diffH < 1) return "Just now";
    if (diffH < 24) return `${Math.floor(diffH)}h`;
    if (diffD < 7) return `${Math.floor(diffD)}d`;
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function GmailWidget() {
  const [data, setData] = useState<{ unreadCount: number; emails: Email[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "important">("all");

  const load = async () => {
    try {
      setError(null);
      const res = await fetch("/api/widgets/gmail");
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed");
      }
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Gmail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 120_000); // refresh every 2 min
    return () => clearInterval(id);
  }, []);

  const emails = data?.emails || [];
  const shown = filter === "important" ? emails.filter((e) => e.isImportant) : emails;
  const importantCount = emails.filter((e) => e.isImportant).length;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-red-500/20">
            <Mail className="h-5 w-5 text-red-400" />
          </div>
          <span className="text-lg font-semibold text-slate-900">Gmail</span>
          {data && (
            <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-medium">
              {data.unreadCount} unread
            </span>
          )}
        </div>
        <button onClick={load} className="text-gray-400 hover:text-gray-600 transition-colors">
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-gray-200 px-4">
        <button
          onClick={() => setFilter("all")}
          className={`text-xs py-2 mr-4 border-b-2 transition-colors ${
            filter === "all"
              ? "border-red-400 text-slate-900"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          All Unread
        </button>
        <button
          onClick={() => setFilter("important")}
          className={`text-xs py-2 flex items-center gap-1 border-b-2 transition-colors ${
            filter === "important"
              ? "border-amber-400 text-slate-900"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <Star className="h-2.5 w-2.5" />
          Important
          {importantCount > 0 && (
            <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1 rounded-full">
              {importantCount}
            </span>
          )}
        </button>
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="space-y-px p-2 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-3 rounded-lg">
                <div className="flex justify-between mb-1.5">
                  <div className="h-2.5 bg-gray-200 rounded w-24" />
                  <div className="h-2.5 bg-gray-200 rounded w-8" />
                </div>
                <div className="h-2.5 bg-gray-200 rounded w-full mb-1" />
                <div className="h-2 bg-gray-200 rounded w-3/4" />
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
            {filter === "important" ? "No important unread emails" : "No unread emails"}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {shown.map((email) => (
              <div
                key={email.id}
                className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-default ${
                  email.isImportant ? "border-l-2 border-amber-400/50" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {email.isImportant && (
                      <Star className="h-2.5 w-2.5 text-amber-400 flex-shrink-0 fill-amber-400" />
                    )}
                    <span className="text-[11px] font-semibold text-slate-900 truncate">
                      {fromName(email.from)}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 flex-shrink-0">
                    {relativeDate(email.date)}
                  </span>
                </div>
                <p className="text-xs text-slate-800 font-medium truncate mb-0.5">{email.subject}</p>
                <p className="text-[10px] text-gray-600 line-clamp-1">{email.snippet}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
