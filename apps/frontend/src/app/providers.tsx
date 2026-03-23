"use client";

import { AuthProvider } from "@/lib/auth-context";
import { TourProvider, TourSpotlight } from "@/components/tour";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TourProvider>
        {children}
        <TourSpotlight />
      </TourProvider>
    </AuthProvider>
  );
}
