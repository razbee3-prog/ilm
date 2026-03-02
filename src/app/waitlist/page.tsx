import { Zap } from "lucide-react";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";

export const metadata = {
  title: "ilm - Join the Waitlist",
  description: "Your personal AI Agent for digital workspace. Join the waitlist to get early access.",
};

export default function WaitlistPage() {
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

        {/* Demo Video */}
        <div className="mt-12 mb-8 rounded-2xl overflow-hidden border border-white/10 bg-black/40">
          <div className="aspect-video">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/uxhTwou2Tvo"
              title="ilm Demo"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

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
