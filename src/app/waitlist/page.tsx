import { Zap, Play } from "lucide-react";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";
import { VideoModal } from "@/components/waitlist/VideoModal";

export const metadata = {
  title: "ilm - Join the Waitlist",
  description: "Your personal AI Agent for digital workspace. Join the waitlist to get early access.",
};

export default function WaitlistPage() {
  const videoId = "uxhTwou2Tvo";
  const videoThumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-start justify-center pt-12 p-6">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-400 flex items-center justify-center">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 bg-clip-text text-transparent">
              ilm
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-8">
          <p className="text-xl md:text-2xl text-gray-300 mb-2">
            Your personal AI Agent for digital workspace
          </p>
        </div>

        {/* CTA Section */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-4">Join the waitlist</h2>
          <p className="text-gray-400 mb-6 text-lg">
            Be among the first to experience ilm. We'll notify you as soon as we launch.
          </p>
        </div>

        {/* Form */}
        <WaitlistForm />

        {/* Demo Video Thumbnail */}
        <VideoModal videoId={videoId}>
          <div className="mt-12 mb-8 rounded-2xl overflow-hidden border border-white/10 bg-black/40 group cursor-pointer relative aspect-video">
            {/* Video Thumbnail */}
            <img
              src={videoThumbnail}
              alt="ilm Demo"
              className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
            />

            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />

            {/* Play Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors flex items-center justify-center backdrop-blur-sm">
                <Play className="w-10 h-10 text-white ml-1" fill="white" />
              </div>
            </div>
          </div>
        </VideoModal>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-white/10">
          <p className="text-gray-500 text-sm">
            We respect your privacy. We'll only use your email to notify you about ilm.
          </p>
        </div>
      </div>
    </div>
  );
}
