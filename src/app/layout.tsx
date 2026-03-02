import type { Metadata } from "next";
import "./globals.css";
import { LayoutClient } from "@/components/layout/layout-client";

export const metadata: Metadata = {
  title: "ilm - Personal AI Agent",
  description: "Your intelligent agent platform powered by MCP tools",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
