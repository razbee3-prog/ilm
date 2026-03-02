"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw } from "lucide-react";

interface MetricValue {
  current: number;
  yoy_change: number;
  unit?: string;
  currency?: string;
}

interface Metrics {
  revenue: MetricValue & { currency: "USD" };
  clients: MetricValue;
  retention_rate: MetricValue & { unit: "%" };
  growth: MetricValue & { period: string; unit: "%" };
  lastUpdated: string;
  source: string;
}

interface AnalyticsData {
  metrics: Metrics;
}

function formatNumber(value: number, currency?: string): string {
  if (currency === "USD") {
    // For USD in billions
    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(1)}B`;
    }
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`;
    }
    return `$${value.toFixed(0)}`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

function MetricCard({
  title,
  value,
  metric,
}: {
  title: string;
  value: string;
  metric: MetricValue;
}) {
  if (metric.yoy_change === undefined) {
    return (
      <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
          {title}
        </span>
        <span className="text-xl font-bold text-slate-900">{value}</span>
      </div>
    );
  }

  const isPositive = metric.yoy_change >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
        {title}
      </span>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-slate-900">{value}</span>
        <div className="flex items-center gap-1">
          <TrendIcon
            className={`h-3 w-3 ${isPositive ? "text-green-400" : "text-red-400"}`}
          />
          <span
            className={`text-xs font-medium ${
              isPositive ? "text-green-400" : "text-red-400"
            }`}
          >
            {isPositive ? "+" : ""}{metric.yoy_change.toFixed(1)}%
          </span>
        </div>
      </div>
      <span className="text-[9px] text-gray-500">YoY change</span>
    </div>
  );
}

export function AnalyticsWidget() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const res = await fetch("/api/widgets/analytics");
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed");
      }
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 600_000); // refresh every 10 min
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-gray-100">
              <TrendingUp className="h-5 w-5 text-gray-600" />
            </div>
            <span className="text-lg font-semibold text-slate-900">ADP Analytics</span>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-gray-100">
              <TrendingUp className="h-5 w-5 text-gray-600" />
            </div>
            <span className="text-lg font-semibold text-slate-900">ADP Analytics</span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center h-32 gap-2 text-gray-400">
          <AlertCircle className="h-5 w-5" />
          <span className="text-xs text-center px-4">
            {error || "Failed to load analytics"}
          </span>
        </div>
      </div>
    );
  }

  const { metrics } = data;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-gray-100">
            <TrendingUp className="h-5 w-5 text-gray-600" />
          </div>
          <span className="text-lg font-semibold text-slate-900">ADP Analytics</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <MetricCard
          title="Revenue"
          value={formatNumber(metrics.revenue.current, "USD")}
          metric={metrics.revenue}
        />
        <MetricCard
          title="Active Clients"
          value={formatNumber(metrics.clients.current)}
          metric={metrics.clients}
        />
        <MetricCard
          title="Retention Rate"
          value={`${metrics.retention_rate.current.toFixed(1)}%`}
          metric={metrics.retention_rate}
        />
        <MetricCard
          title={`Growth (${metrics.growth.period})`}
          value={`${metrics.growth.current.toFixed(1)}%`}
          metric={metrics.growth}
        />

        {/* Last Updated */}
        <div className="text-[9px] text-gray-500 px-1 mt-4 pt-2 border-t border-gray-200">
          <p>Last updated: {new Date(metrics.lastUpdated).toLocaleDateString()}</p>
          <p>Source: {metrics.source}</p>
        </div>
      </div>
    </div>
  );
}
