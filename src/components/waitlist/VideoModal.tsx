"use client";

import { useState, ReactNode } from "react";
import { X } from "lucide-react";

interface VideoModalProps {
  videoId: string;
  children: ReactNode;
}

export function VideoModal({ videoId, children }: VideoModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Clickable Thumbnail */}
      <div onClick={() => setIsOpen(true)}>{children}</div>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          {/* Background Overlay */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* Modal Content */}
          <div
            className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* YouTube Embed */}
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
              title="ilm Demo"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </>
  );
}
