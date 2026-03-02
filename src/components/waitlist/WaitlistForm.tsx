"use client";

import { useState } from "react";
import { Mail, CheckCircle, AlertCircle, Loader } from "lucide-react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage("Welcome to the ilm waitlist! 🎉");
        setEmail("");
        // Reset success message after 5 seconds
        setTimeout(() => {
          setStatus("idle");
          setMessage("");
        }, 5000);
      } else {
        setStatus("error");
        if (data.alreadyExists) {
          setMessage("This email is already on the waitlist!");
        } else {
          setMessage(data.error || "Something went wrong. Please try again.");
        }
      }
    } catch (error) {
      setStatus("error");
      setMessage("Failed to join waitlist. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <div className="flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 focus-within:border-white/40 transition-colors">
            <Mail className="h-5 w-5 text-white/60 mr-3" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={status === "loading" || status === "success"}
              className="flex-1 bg-transparent text-white placeholder:text-white/50 focus:outline-none disabled:opacity-50"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className="w-full bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 text-black font-semibold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {status === "loading" && (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              Joining...
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle className="h-4 w-4" />
              Joined!
            </>
          )}
          {(status === "idle" || status === "error") && "Join the Waitlist"}
        </button>
      </form>

      {/* Success Message */}
      {status === "success" && (
        <div className="mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-green-400 text-sm font-medium">{message}</p>
            <p className="text-green-300/70 text-xs mt-1">
              We'll notify you when ilm launches!
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {status === "error" && (
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-red-400 text-sm">{message}</p>
        </div>
      )}
    </div>
  );
}
