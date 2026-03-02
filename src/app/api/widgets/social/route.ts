import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SocialMention {
  platform: "reddit" | "x" | "threads" | "instagram";
  author: string;
  content: string;
  url: string;
  timestamp: string;
  engagement: { likes: number; replies: number };
  sentiment?: "positive" | "negative" | "neutral";
}

// Mock data - in production, this would fetch from real APIs
const MOCK_MENTIONS: SocialMention[] = [
  {
    platform: "reddit",
    author: "u/TechFan2024",
    content: "ADP just announced new features for payroll automation. Pretty impressive stuff, definitely worth checking out!",
    url: "https://reddit.com/r/business",
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    engagement: { likes: 245, replies: 18 },
    sentiment: "positive",
  },
  {
    platform: "reddit",
    author: "u/HRGirl",
    content: "Anyone using ADP for their company? Looking for reviews before we switch.",
    url: "https://reddit.com/r/HR",
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    engagement: { likes: 89, replies: 12 },
    sentiment: "neutral",
  },
  {
    platform: "reddit",
    author: "u/BusinessOwner",
    content: "ADP pricing is getting ridiculous. Looking at alternatives.",
    url: "https://reddit.com/r/business",
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    engagement: { likes: 156, replies: 34 },
    sentiment: "negative",
  },
  {
    platform: "x",
    author: "@EnterpriseTech",
    content: "ADP's new AI-powered payroll insights are a game-changer for enterprise HR teams 🚀",
    url: "https://twitter.com/EnterpriseTech",
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    engagement: { likes: 1200, replies: 89 },
    sentiment: "positive",
  },
  {
    platform: "x",
    author: "@CFODaily",
    content: "ADP reports strong Q4 results. Revenue growth exceeds expectations.",
    url: "https://twitter.com/CFODaily",
    timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
    engagement: { likes: 890, replies: 45 },
    sentiment: "positive",
  },
  {
    platform: "x",
    author: "@SMBInsights",
    content: "Small businesses struggling with ADP's complexity. Better alternatives needed.",
    url: "https://twitter.com/SMBInsights",
    timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
    engagement: { likes: 234, replies: 78 },
    sentiment: "negative",
  },
  {
    platform: "threads",
    author: "@business_news",
    content: "ADP announces partnership with leading cloud providers to expand global reach 🌍",
    url: "https://threads.net/business_news",
    timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
    engagement: { likes: 567, replies: 23 },
    sentiment: "positive",
  },
  {
    platform: "threads",
    author: "@hrcommunity",
    content: "Discussion: How is everyone finding ADP's new HCM features?",
    url: "https://threads.net/hrcommunity",
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
    engagement: { likes: 234, replies: 45 },
    sentiment: "neutral",
  },
  {
    platform: "instagram",
    author: "adp_official",
    content: "Empowering businesses with modern HR solutions 💼 #AdaptivePayroll #HRTech",
    url: "https://instagram.com/adp_official",
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    engagement: { likes: 3400, replies: 127 },
    sentiment: "positive",
  },
  {
    platform: "instagram",
    author: "hr_leaders_network",
    content: "Check out how ADP is transforming enterprise payroll management 🚀 Partnership post",
    url: "https://instagram.com/hr_leaders_network",
    timestamp: new Date(Date.now() - 40 * 60000).toISOString(),
    engagement: { likes: 892, replies: 56 },
    sentiment: "positive",
  },
];

async function fetchSocialMentions(): Promise<SocialMention[]> {
  try {
    // In production, you would fetch from APIs like:
    // - Reddit API: https://www.reddit.com/dev/api
    // - Twitter API v2: https://developer.twitter.com/
    // - Meta Threads API: https://developers.facebook.com/docs/threads
    // - Instagram Graph API: https://developers.facebook.com/docs/instagram-api
    //
    // For now, return mock data with proper error handling

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Return shuffled mock mentions for variety
    return MOCK_MENTIONS.sort(() => Math.random() - 0.5);
  } catch (error) {
    console.error("Error fetching social mentions:", error);
    // Return cached/mock data on error
    return MOCK_MENTIONS;
  }
}

export async function GET() {
  try {
    const mentions = await fetchSocialMentions();

    return NextResponse.json({
      mentions,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch social media data" },
      { status: 500 }
    );
  }
}
