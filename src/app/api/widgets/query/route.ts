import { NextRequest, NextResponse } from "next/server";

/**
 * Get widget data by querying the individual widget endpoints
 * This allows Sidekick to access dashboard widget data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const widget = searchParams.get("widget");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 10;

    if (!widget) {
      return NextResponse.json(
        { error: "widget parameter is required" },
        { status: 400 }
      );
    }

    const validWidgets = ["news", "analytics", "stocks", "calendar", "gmail", "slack", "social"];
    if (!validWidgets.includes(widget)) {
      return NextResponse.json(
        { error: `Invalid widget. Must be one of: ${validWidgets.join(", ")}` },
        { status: 400 }
      );
    }

    // Get the base URL for internal API calls from request headers
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    // Fetch data from the specific widget endpoint
    const widgetUrl = new URL(`/api/widgets/${widget}`, baseUrl);

    // Add limit parameter for widgets that support it
    if (["news", "social"].includes(widget)) {
      widgetUrl.searchParams.append("limit", limit.toString());
    }

    const response = await fetch(widgetUrl.toString());

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Failed to fetch ${widget} data: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Format the response based on widget type
    return NextResponse.json({
      widget,
      data: formatWidgetData(widget, data, limit),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to query widget",
      },
      { status: 500 }
    );
  }
}

/**
 * Format widget data for better agent consumption
 */
function formatWidgetData(widget: string, data: any, limit: number): any {
  switch (widget) {
    case "news":
      // Format news articles
      if (data.articles) {
        return {
          type: "news_articles",
          count: Math.min(data.articles.length, limit),
          articles: data.articles.slice(0, limit).map((article: any) => ({
            title: article.title,
            source: article.source,
            description: article.description,
            url: article.link,
            publishedAt: article.pubDate,
          })),
        };
      }
      return data;

    case "analytics":
      // Format analytics metrics
      if (data.metrics) {
        return {
          type: "business_metrics",
          metrics: {
            revenue: {
              value: data.metrics.revenue?.current,
              currency: "USD",
              change_yoy: data.metrics.revenue?.yoy_change,
            },
            activeClients: {
              value: data.metrics.clients?.current,
              change_yoy: data.metrics.clients?.yoy_change,
            },
            retentionRate: {
              value: data.metrics.retention_rate?.current,
              unit: "%",
              change_yoy: data.metrics.retention_rate?.yoy_change,
            },
            growth: {
              value: data.metrics.growth?.current,
              period: data.metrics.growth?.period,
              unit: "%",
              change_yoy: data.metrics.growth?.yoy_change,
            },
          },
          lastUpdated: data.metrics.lastUpdated,
        };
      }
      return data;

    case "stocks":
      // Format stock data
      if (data.quotes) {
        return {
          type: "stock_quotes",
          count: Math.min(data.quotes.length, limit),
          quotes: data.quotes.slice(0, limit).map((quote: any) => ({
            symbol: quote.symbol,
            description: quote.description,
            price: quote.price,
            change: quote.change,
            changePct: quote.changePct,
            trend: quote.positive ? "up" : "down",
            currency: quote.currency,
          })),
          updatedAt: data.updatedAt,
        };
      }
      return data;

    case "gmail":
      // Format Gmail data
      if (data.unreadCount !== undefined) {
        return {
          type: "email_summary",
          unreadCount: data.unreadCount,
          recentEmails: (data.emails || []).slice(0, limit).map((email: any) => ({
            subject: email.subject,
            from: email.from,
            preview: email.snippet,
            date: email.date,
            isImportant: email.isImportant,
          })),
        };
      }
      return data;

    case "slack":
      // Format Slack data
      if (data.totalUnread !== undefined) {
        return {
          type: "slack_messages",
          totalUnread: data.totalUnread,
          mentions: (data.mentions || []).slice(0, limit / 2).map((msg: any) => ({
            text: msg.text,
            from: msg.from,
            channel: msg.channel,
            timestamp: msg.ts,
          })),
          directMessages: (data.dms || []).slice(0, limit / 2).map((msg: any) => ({
            text: msg.text,
            from: msg.from,
            timestamp: msg.ts,
          })),
        };
      }
      return data;

    case "calendar":
      // Format calendar data
      if (data.events) {
        return {
          type: "calendar_events",
          count: Math.min(data.events.length, limit),
          upcomingEvents: data.events.slice(0, limit).map((event: any) => ({
            title: event.title,
            startTime: event.startTime,
            endTime: event.endTime,
            location: event.location,
            attendees: event.attendees?.length || 0,
          })),
        };
      }
      return data;

    case "social":
      // Format social mentions
      if (data.mentions) {
        return {
          type: "social_mentions",
          count: Math.min(data.mentions.length, limit),
          mentions: data.mentions.slice(0, limit).map((mention: any) => ({
            platform: mention.platform,
            author: mention.author,
            content: mention.content,
            url: mention.url,
            timestamp: mention.timestamp,
            engagement: {
              likes: mention.engagement?.likes || 0,
              replies: mention.engagement?.replies || 0,
            },
            sentiment: mention.sentiment || "neutral",
          })),
        };
      }
      return data;

    default:
      return data;
  }
}
