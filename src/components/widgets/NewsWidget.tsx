"use client";

import { useEffect, useState } from "react";
import { Newspaper, ExternalLink, RefreshCw } from "lucide-react";

interface Article {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  description: string;
}

function timeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor(diff / 60_000);
    if (h >= 24) return `${Math.floor(h / 24)}d ago`;
    if (h >= 1) return `${h}h ago`;
    if (m >= 1) return `${m}m ago`;
    return "Just now";
  } catch {
    return "";
  }
}

const SOURCE_COLORS: Record<string, string> = {
  TechCrunch: "#0a8f47",
  "The Verge": "#e2403b",
  VentureBeat: "#ff6600",
};

export function NewsWidget() {
  const [data, setData] = useState<{ articles: Article[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const res = await fetch("/api/widgets/news");
      if (!res.ok) throw new Error("Failed");
      setData(await res.json());
    } catch {
      setError("Could not load news");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 300_000); // refresh every 5 min
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-gray-100">
            <Newspaper className="h-5 w-5 text-gray-600" />
          </div>
          <span className="text-lg font-semibold text-slate-900">AI News</span>
        </div>
        <button onClick={load} className="text-gray-400 hover:text-gray-600 transition-colors">
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      {/* Articles */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="space-y-3 p-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-2.5 bg-gray-200 rounded w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-xs">{error}</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {(data?.articles || []).map((a, i) => (
              <a
                key={i}
                href={a.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-3 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
                      style={{
                        backgroundColor: `${SOURCE_COLORS[a.source] || "#6366f1"}20`,
                        color: SOURCE_COLORS[a.source] || "#818cf8",
                      }}
                    >
                      {a.source}
                    </span>
                    {a.pubDate && (
                      <span className="text-[10px] text-gray-500">{timeAgo(a.pubDate)}</span>
                    )}
                  </div>
                  <ExternalLink className="h-3 w-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                </div>
                <p className="text-xs text-slate-900 leading-snug font-medium line-clamp-2 mb-0.5">
                  {a.title}
                </p>
                {a.description && (
                  <p className="text-[10px] text-gray-600 line-clamp-1">{a.description}</p>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
