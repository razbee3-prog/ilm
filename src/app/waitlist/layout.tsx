import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ilm - Join the Waitlist",
  description: "Your personal AI Agent for digital workspace. Join the waitlist to get early access.",
};

export default function WaitlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
