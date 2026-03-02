"use client";

import { useEffect, useState } from "react";
import { Share2, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";

interface SocialMention {
  platform: "reddit" | "x" | "threads" | "instagram";
  author: string;
  content: string;
  url: string;
  timestamp: string;
  engagement: { likes: number; replies: number };
  sentiment?: "positive" | "negative" | "neutral";
}

interface SocialData {
  mentions: SocialMention[];
}

const PLATFORM_COLORS: Record<string, { bg: string; text: string; emoji: string }> = {
  reddit: { bg: "bg-orange-500/20", text: "text-orange-400", emoji: "🔴" },
  x: { bg: "bg-zinc-500/20", text: "text-zinc-400", emoji: "𝕏" },
  threads: { bg: "bg-zinc-600/20", text: "text-zinc-300", emoji: "Ⓣ" },
  instagram: { bg: "bg-pink-500/20", text: "text-pink-400", emoji: "📷" },
};

const SENTIMENT_EMOJI = {
  positive: "👍",
  neutral: "😐",
  negative: "👎",
};

export function SocialMediaWidget() {
  const [data, setData] = useState<SocialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"reddit" | "x" | "threads" | "instagram">(
    "reddit"
  );

  const load = async () => {
    try {
      setError(null);
      const res = await fetch("/api/widgets/social");
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed");
      }
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load social media");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 120_000); // refresh every 2 min
    return () => clearInterval(id);
  }, []);

  const shown = (data?.mentions || []).filter((m) => m.platform === tab);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-gray-100">
            <Share2 className="h-5 w-5 text-gray-600" />
          </div>
          <span className="text-lg font-semibold text-slate-900">ADP Mentions</span>
        </div>
        <button onClick={load} className="text-gray-400 hover:text-gray-600 transition-colors">
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-4">
        {(["reddit", "x", "threads", "instagram"] as const).map((platform) => (
          <button
            key={platform}
            onClick={() => setTab(platform)}
            className={`text-xs py-2 mr-4 border-b-2 transition-colors ${
              tab === platform
                ? "border-blue-400 text-slate-900"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {PLATFORM_COLORS[platform].emoji} {platform}
          </button>
        ))}
      </div>

      {/* Mentions List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="space-y-3 p-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-2.5 bg-gray-200 rounded w-full" />
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
            No mentions found
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {shown.map((mention, i) => (
              <a
                key={i}
                href={mention.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-3 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
                      style={{
                        backgroundColor: `${PLATFORM_COLORS[mention.platform].text}20`,
                        color: PLATFORM_COLORS[mention.platform].text,
                      }}>
                      {mention.platform}
                    </span>
                    {mention.sentiment && (
                      <span className="text-xs">{SENTIMENT_EMOJI[mention.sentiment]}</span>
                    )}
                  </div>
                  <ExternalLink className="h-3 w-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                </div>
                <p className="text-[11px] font-semibold text-slate-900 truncate mb-1">
                  {mention.author}
                </p>
                <p className="text-xs text-slate-700 leading-snug line-clamp-2 mb-1">
                  {mention.content}
                </p>
                <div className="flex gap-3 text-[10px] text-gray-500">
                  <span>❤️ {mention.engagement.likes}</span>
                  <span>💬 {mention.engagement.replies}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
