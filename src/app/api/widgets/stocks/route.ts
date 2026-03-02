import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYMBOLS = [
  { symbol: "ADP", label: "ADP", description: "Automatic Data Processing" },
  { symbol: "NVDA", label: "NVDA", description: "NVIDIA Corporation" },
  { symbol: "GOOGL", label: "GOOGL", description: "Alphabet Inc" },
  { symbol: "AMZN", label: "AMZN", description: "Amazon.com Inc" },
];

async function fetchQuote(symbol: string, label: string, description: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Jarvis/1.0)" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const meta = data.chart?.result?.[0]?.meta;
    if (!meta) throw new Error("No meta data");

    const price = meta.regularMarketPrice as number;
    const prevClose = meta.chartPreviousClose as number;
    const change = price - prevClose;
    const changePct = (change / prevClose) * 100;

    // Pull closing prices for sparkline
    const closes: number[] = data.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
    const sparkline = closes.filter(Boolean).slice(-5);

    return {
      symbol: label,
      description,
      price,
      change,
      changePct,
      positive: change >= 0,
      sparkline,
      currency: meta.currency || "USD",
    };
  } catch {
    return {
      symbol: label,
      description,
      price: null,
      change: null,
      changePct: null,
      positive: true,
      sparkline: [],
      currency: "USD",
    };
  }
}

export async function GET() {
  const quotes = await Promise.all(
    SYMBOLS.map((s) => fetchQuote(s.symbol, s.label, s.description))
  );
  return NextResponse.json({ quotes, updatedAt: new Date().toISOString() });
}
