"use client";

import { SessionProvider } from "next-auth/react";
import { ApiCallChips } from "@/components/ApiCallChips";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <ApiCallChips />
    </SessionProvider>
  );
}

