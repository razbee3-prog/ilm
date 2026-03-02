"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { MessageSquare, Wrench, Plus, Zap, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: string;
}

interface ConversationGroup {
  label: string;
  conversations: Conversation[];
}

function groupConversationsByTime(conversations: Conversation[]): ConversationGroup[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const groups: ConversationGroup[] = [
    { label: "Today", conversations: [] },
    { label: "Yesterday", conversations: [] },
    { label: "Last 7 days", conversations: [] },
    { label: "Older", conversations: [] },
  ];

  conversations.forEach((conv) => {
    const date = new Date(conv.updatedAt);
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (dateOnly.getTime() === today.getTime()) {
      groups[0].conversations.push(conv);
    } else if (dateOnly.getTime() === yesterday.getTime()) {
      groups[1].conversations.push(conv);
    } else if (date >= sevenDaysAgo) {
      groups[2].conversations.push(conv);
    } else {
      groups[3].conversations.push(conv);
    }
  });

  return groups.filter((g) => g.conversations.length > 0);
}

interface CollapsedGroupsState {
  [key: string]: boolean;
}

export function Sidebar() {
  const pathname = usePathname();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<CollapsedGroupsState>({});

  useEffect(() => {
    fetch("/api/conversations")
      .then((res) => res.json())
      .then(setConversations)
      .catch(console.error);
  }, [pathname]);

  const conversationGroups = groupConversationsByTime(conversations);

  const toggleGroupCollapse = (groupLabel: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupLabel]: !prev[groupLabel],
    }));
  };

  return (
    <div className="flex flex-col h-full w-64 bg-card border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-border animate-fadeInUp">
        <Zap className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">Jarvis</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-2">
        <Link href="/">
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors-300 cursor-pointer",
              pathname === "/" || pathname.startsWith("/chat")
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </div>
        </Link>
        <Link href="/tools">
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors-300 cursor-pointer",
              pathname === "/tools"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <Wrench className="h-4 w-4" />
            Tools
          </div>
        </Link>
      </nav>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-2 mt-2">
        <div className="flex items-center justify-between px-3 mb-3">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors-300"
          >
            <ChevronDown
              className={cn(
                "h-3 w-3 shrink-0 transition-transform",
                isCollapsed && "-rotate-90"
              )}
            />
            Recent Chats
          </button>
          <Link href="/">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-accent/50 transition-colors-300"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        {!isCollapsed && (
          <div className="flex flex-col gap-3">
            {conversationGroups.length > 0 ? (
              conversationGroups.map((group) => (
                <div key={group.label} className="animate-fadeInUp">
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroupCollapse(group.label)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors-300 w-full"
                  >
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 shrink-0 transition-transform",
                        collapsedGroups[group.label] && "-rotate-90"
                      )}
                    />
                    {group.label}
                  </button>

                  {/* Conversations in Group */}
                  {!collapsedGroups[group.label] && (
                    <div className="flex flex-col gap-0.5 ml-1">
                      {group.conversations.map((conv, idx) => (
                        <Link
                          key={conv.id}
                          href={`/chat/${conv.id}`}
                          className="animate-slideInLeft"
                          style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                          <div
                            className={cn(
                              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors-300 truncate cursor-pointer group",
                              pathname === `/chat/${conv.id}`
                                ? "bg-accent text-accent-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                            )}
                          >
                            <ChevronRight className="h-3 w-3 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                            <span className="truncate">
                              {conv.title || "New conversation"}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="px-3 py-2 text-xs text-muted-foreground animate-fadeIn">
                No conversations yet
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
