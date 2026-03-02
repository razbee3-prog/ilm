"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Clock } from "lucide-react";

interface RateLimitStatus {
  isRateLimited: boolean;
  requestsInMinute: number;
  timeUntilResetSeconds: number;
  retryAfterSeconds: number;
  queuedRequests: number;
}

export function RateLimitIndicator() {
  const [status, setStatus] = useState<RateLimitStatus | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check rate limit status every 5 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/rate-limit-status");
        if (res.ok) {
          const data = await res.json();
          setStatus(data);

          // Show indicator if rate limited or if there are queued requests
          setIsVisible(data.isRateLimited || data.queuedRequests > 0);
        }
      } catch (error) {
        // Silently fail - don't disrupt user experience
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible || !status) {
    return null;
  }

  if (status.isRateLimited) {
    return (
      <div className="fixed bottom-24 right-6 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 shadow-sm">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-red-600">API Rate Limited</p>
          <p className="text-xs text-red-500">
            Requests paused for {status.retryAfterSeconds}s
          </p>
        </div>
      </div>
    );
  }

  if (status.queuedRequests > 0) {
    return (
      <div className="fixed bottom-24 right-6 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2 shadow-sm">
        <Clock className="h-4 w-4 text-yellow-600 animate-spin" />
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-yellow-600">Processing Queue</p>
          <p className="text-xs text-yellow-500">
            {status.queuedRequests} request{status.queuedRequests !== 1 ? "s" : ""} queued
          </p>
        </div>
      </div>
    );
  }

  return null;
}
