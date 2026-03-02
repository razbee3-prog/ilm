import { NextResponse } from "next/server";
import { rateLimiter } from "@/lib/rate-limiter";

export async function GET() {
  try {
    const status = rateLimiter.getStatus();

    return NextResponse.json({
      isRateLimited: status.isRateLimited,
      requestsInMinute: status.requestsInMinute,
      timeUntilResetSeconds: Math.ceil(status.timeUntilResetMs / 1000),
      retryAfterSeconds: status.retryAfterSeconds,
      queuedRequests: status.queuedRequests,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to get rate limit status",
      },
      { status: 500 }
    );
  }
}
