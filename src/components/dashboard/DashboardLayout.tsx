"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { GmailWidget } from "@/components/widgets/GmailWidget";
import { SlackWidget } from "@/components/widgets/SlackWidget";
import { NewsWidget } from "@/components/widgets/NewsWidget";
import { StocksWidget } from "@/components/widgets/StocksWidget";
import { CalendarWidget } from "@/components/widgets/CalendarWidget";
import { SocialMediaWidget } from "@/components/widgets/SocialMediaWidget";
import { AnalyticsWidget } from "@/components/widgets/AnalyticsWidget";
import { ChatInterface } from "@/components/chat/chat-interface";
import { RateLimitIndicator } from "@/components/chat/rate-limit-indicator";
import { Zap, Plus, ChevronRight, ChevronDown, Trash2 } from "lucide-react";

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: string;
}

function useGreeting() {
  return useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);
}

export function DashboardLayout() {
  const greeting = useGreeting();
  const [activeTab, setActiveTab] = useState<"dashboard" | "tools">("dashboard");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showConversations, setShowConversations] = useState(true);
  const [clearKey, setClearKey] = useState(0);

  useEffect(() => {
    fetch("/api/conversations")
      .then((res) => res.json())
      .then(setConversations)
      .catch(console.error);
  }, []);

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all conversations and Sidekick context? This cannot be undone.")) {
      return;
    }

    try {
      // Delete all conversations
      await Promise.all(
        conversations.map((conv) =>
          fetch(`/api/conversations/${conv.id}`, { method: "DELETE" })
        )
      );
      setConversations([]);
      // Force ChatInterface to reset by changing key
      setClearKey((k) => k + 1);
    } catch (error) {
      console.error("Failed to clear conversations:", error);
      alert("Failed to clear conversations. Please try again.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-200">
      {/* ── Top Tab Bar ── */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="flex items-center px-6 h-14">
          {/* Product Logo/Name */}
          <div className="flex items-center gap-2 mr-8 border-r border-gray-200 pr-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-400 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-yellow-500 via-orange-400 to-pink-500 bg-clip-text text-transparent">ilm</span>
          </div>

          {/* Navigation Tabs */}
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "dashboard"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Dashboard
          </button>
          <Link href="/tools">
            <button
              className="px-4 py-2 text-sm font-medium border-b-2 transition-colors border-transparent text-gray-600 hover:text-gray-900"
            >
              Tools
            </button>
          </Link>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex flex-1 min-h-0">
        {/* Dashboard Content */}
        {activeTab === "dashboard" && (
          <div className="flex-1 min-w-0 overflow-y-auto scrollbar-thin p-6 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-baseline gap-2 pb-2">
              <h1 className="text-xl font-semibold text-slate-900">{greeting}, Raz 👋</h1>
              <span className="text-sm text-gray-500">Here&apos;s your overview</span>
            </div>

            {/* Widget grid - expanded to 3 columns */}
            <div className="flex flex-col gap-16 flex-1" style={{ minHeight: 0 }}>
              {/* Row 1: Gmail, Slack, Calendar */}
              <div className="grid grid-cols-3 gap-4 h-[220px]">
                <GmailWidget />
                <SlackWidget />
                <CalendarWidget />
              </div>

              {/* Row 2: Markets, Social Media, Analytics */}
              <div className="grid grid-cols-3 gap-4 h-[200px] mt-12">
                <StocksWidget />
                <SocialMediaWidget />
                <AnalyticsWidget />
              </div>

              {/* Row 3: News (full width) */}
              <div className="h-[160px] -mt-8">
                <NewsWidget />
              </div>
            </div>
          </div>
        )}


        {/* ── Right Sidebar: Sidekick Chat ── */}
        <div className="w-96 flex-shrink-0 border-l border-gray-200 flex flex-col bg-white overflow-hidden">
          {/* Sidebar header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-200 flex-shrink-0">
            <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-slate-900">Sidekick</span>
            {/* Live indicator */}
            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                <span className="text-[10px] text-emerald-400/70 font-medium">online</span>
              </div>
              {/* Clear button */}
              <button
                onClick={handleClearAll}
                title="Clear all conversations"
                className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Conversations Section */}
          <div className="border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
              <button
                onClick={() => setShowConversations(!showConversations)}
                className="flex items-center gap-1.5"
              >
                <ChevronDown
                  className={`h-3.5 w-3.5 text-gray-400 transition-transform ${
                    showConversations ? "" : "-rotate-90"
                  }`}
                />
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Recent Chats
                </span>
              </button>
              <Link href="/">
                <div className="h-6 w-6 flex items-center justify-center hover:bg-gray-200 rounded transition-colors cursor-pointer">
                  <Plus className="h-3 w-3 text-gray-500" />
                </div>
              </Link>
            </div>

            {/* Conversations List */}
            {showConversations && (
              <div className="max-h-[200px] overflow-y-auto px-2 pb-2">
                {conversations.length > 0 ? (
                  conversations.map((conv) => (
                    <Link key={conv.id} href={`/chat/${conv.id}`}>
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors truncate cursor-pointer">
                        <ChevronRight className="h-2.5 w-2.5 flex-shrink-0" />
                        <span className="truncate">
                          {conv.title || "New conversation"}
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="px-2 py-2 text-xs text-gray-400 text-center">
                    No conversations yet
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Chat content — flex-1 so it fills remaining height */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <ChatInterface key={clearKey} clearKey={clearKey} />
          </div>
        </div>
      </div>

      {/* Rate Limit Indicator */}
      <RateLimitIndicator />
    </div>
  );
}
