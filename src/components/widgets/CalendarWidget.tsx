"use client";

import { useEffect, useState } from "react";
import { Calendar, MapPin, Users } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  attendees: string[];
}

function formatTime(isoString: string): string {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch {
    return isoString;
  }
}

function timeUntil(isoString: string): string {
  if (!isoString) return "";
  try {
    const eventTime = new Date(isoString).getTime();
    const now = Date.now();
    const diff = eventTime - now;
    if (diff < 0) return "In progress";
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `In ${mins}m`;
    const hours = Math.floor(mins / 60);
    return `In ${hours}h${mins % 60 > 0 ? " " + (mins % 60) + "m" : ""}`;
  } catch {
    return "";
  }
}

export function CalendarWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/widgets/calendar");
        const data = await response.json();
        if (data.error) {
          setError(data.error);
        } else {
          setEvents(data.events || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load calendar");
      } finally {
        setLoading(false);
      }
    };

    fetchCalendar();
    const interval = setInterval(fetchCalendar, 5 * 60 * 1000); // Refresh every 5min
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="h-full bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
        <div className="text-center">
          <Calendar className="h-8 w-8 text-red-400/50 mx-auto mb-2" />
          <p className="text-xs text-red-400/60">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-xl border border-gray-200 flex flex-col shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded bg-blue-500/20">
          <Calendar className="h-5 w-5 text-blue-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Calendar</h2>
        <span className="text-xs text-gray-500 ml-auto">Next 8h</span>
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-full text-xs text-gray-400">
            Loading...
          </div>
        ) : events.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-gray-400">
            No upcoming meetings
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 hover:border-blue-400 transition-all group"
            >
              {/* Time & Title */}
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                    {event.title}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    {formatTime(event.startTime)} • {timeUntil(event.startTime)}
                  </p>
                </div>
              </div>

              {/* Location */}
              {event.location && (
                <div className="flex items-center gap-1.5 text-[10px] text-gray-600 mb-1.5">
                  <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}

              {/* Attendees */}
              {event.attendees.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Users className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  <span className="text-[10px] text-gray-600 truncate">
                    {event.attendees.slice(0, 2).join(", ")}
                    {event.attendees.length > 2 ? ` +${event.attendees.length - 2}` : ""}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
