"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isWaitlistPage = pathname === "/waitlist";

  return (
    <div className="flex h-screen overflow-hidden">
      {!isHomePage && !isWaitlistPage && <Sidebar />}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
