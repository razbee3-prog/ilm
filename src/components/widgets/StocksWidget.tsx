"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

interface Quote {
  symbol: string;
  description: string;
  price: number | null;
  change: number | null;
  changePct: number | null;
  positive: boolean;
  sparkline: number[];
  currency: string;
}

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 64;
  const h = 24;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  const color = positive ? "#22c55e" : "#ef4444";
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-70">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StocksWidget() {
  const [data, setData] = useState<{ quotes: Quote[]; updatedAt: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    try {
      setError(null);
      const res = await window.fetch("/api/widgets/stocks");
      if (!res.ok) throw new Error("Failed to fetch");
      setData(await res.json());
    } catch {
      setError("Could not load market data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    const id = setInterval(fetch, 60_000); // refresh every minute
    return () => clearInterval(id);
  }, []);

  const updatedTime = data?.updatedAt
    ? new Date(data.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-emerald-500/20">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <span className="text-lg font-semibold text-slate-900">Markets</span>
        </div>
        <div className="flex items-center gap-2">
          {updatedTime && <span className="text-xs text-gray-500">{updatedTime}</span>}
          <button
            onClick={fetch}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="flex-1 px-3 py-2">
        {loading ? (
          <div className="space-y-3 animate-pulse pt-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-gray-200" />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-xs">{error}</div>
        ) : (
          <div className="space-y-1">
            {data?.quotes.map((q) => (
              <div
                key={q.symbol}
                className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {/* Left: symbol + name */}
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-bold text-slate-900 leading-tight">{q.symbol}</span>
                  <span className="text-[10px] text-gray-500 truncate">{q.description}</span>
                </div>

                {/* Sparkline */}
                <div className="mx-3 flex-shrink-0">
                  <Sparkline data={q.sparkline} positive={q.positive} />
                </div>

                {/* Right: price + change */}
                <div className="flex flex-col items-end flex-shrink-0">
                  <span className="text-xs font-semibold text-slate-900 leading-tight">
                    {q.price != null ? `$${q.price.toFixed(2)}` : "—"}
                  </span>
                  {q.changePct != null && (
                    <div className={`flex items-center gap-0.5 ${q.positive ? "text-emerald-400" : "text-red-400"}`}>
                      {q.positive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                      <span className="text-[10px] font-medium">
                        {q.positive ? "+" : ""}{q.changePct.toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
