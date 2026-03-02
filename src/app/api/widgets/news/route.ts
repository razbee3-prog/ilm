import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  description: string;
}

const AI_NEWS_FEEDS = [
  { url: "https://techcrunch.com/category/artificial-intelligence/feed/", source: "TechCrunch" },
  { url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", source: "The Verge" },
  { url: "https://venturebeat.com/category/ai/feed/", source: "VentureBeat" },
  { url: "https://arxiv.org/rss/cs.AI", source: "arXiv" },
  { url: "https://news.ycombinator.com/rss", source: "Hacker News" },
];

async function fetchFeed(feedUrl: string, source: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(feedUrl, {
      headers: { "User-Agent": "Jarvis/1.0 RSS Reader" },
      next: { revalidate: 300 }, // cache 5 min
    });
    if (!res.ok) return [];
    const xml = await res.text();

    // Simple XML parsing — extract <item> blocks
    const items: NewsItem[] = [];
    const itemMatches = xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/g);

    for (const match of itemMatches) {
      const item = match[1];
      const title = item.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>|<title[^>]*>(.*?)<\/title>/)?.[1] ||
                    item.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>|<title[^>]*>(.*?)<\/title>/)?.[2] || "";
      const link = item.match(/<link[^>]*>(.*?)<\/link>|<link[^>]*\/>/)?.[1] || "";
      const pubDate = item.match(/<pubDate[^>]*>(.*?)<\/pubDate>/)?.[1] || "";
      const desc = item.match(/<description[^>]*><!\[CDATA\[(.*?)\]\]><\/description>|<description[^>]*>(.*?)<\/description>/)?.[1] ||
                   item.match(/<description[^>]*><!\[CDATA\[(.*?)\]\]><\/description>|<description[^>]*>(.*?)<\/description>/)?.[2] || "";

      if (title) {
        items.push({
          title: title.replace(/<[^>]+>/g, "").trim(),
          link: link.trim(),
          source,
          pubDate,
          description: desc.replace(/<[^>]+>/g, "").substring(0, 180).trim(),
        });
      }
      if (items.length >= 6) break;
    }
    return items;
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const results = await Promise.allSettled(
      AI_NEWS_FEEDS.map((f) => fetchFeed(f.url, f.source))
    );

    const allItems: NewsItem[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        allItems.push(...result.value);
      }
    }

    // Sort by date, most recent first
    allItems.sort((a, b) => {
      const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({ articles: allItems.slice(0, 5) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch news" },
      { status: 500 }
    );
  }
}
