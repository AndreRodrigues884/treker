"use client";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useState } from "react";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  // Created once per component instance (client-only), so each browser tab
  // gets its own cache and server-fetched data isn't leaked between users.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {/* The app's whole visual language is still dark-only (no light:
       * variants anywhere) — this wires up the toggle/persistence
       * infrastructure via next-themes without changing how anything
       * looks yet. defaultTheme="dark" keeps that the same for anyone who
       * never touches the toggle in Settings. */}
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
