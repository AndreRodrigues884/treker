"use client";

import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // The app's whole visual language is still dark-only (no light:
    // variants anywhere) — this wires up the toggle/persistence
    // infrastructure via next-themes without changing how anything
    // looks yet. defaultTheme="dark" keeps that the same for anyone who
    // never touches the toggle in Settings.
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
    </ThemeProvider>
  );
}
