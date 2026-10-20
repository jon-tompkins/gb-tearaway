"use client";

import { SessionProvider } from "next-auth/react";
import { PageTracker } from "./PageTracker";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PageTracker />
      {children}
    </SessionProvider>
  );
}
