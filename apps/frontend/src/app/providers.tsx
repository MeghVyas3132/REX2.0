"use client";

import { AuthProvider } from "@/lib/auth-context";
import { TourProvider, TourSpotlight } from "@/components/tour";
import { ThemeProvider } from "@/lib/theme-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TourProvider>
          {children}
          <TourSpotlight />
        </TourProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
