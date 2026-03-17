import "./globals.css";
import Providers from "./providers";
import { Space_Grotesk, IBM_Plex_Sans } from "next/font/google";

const fontDisplay = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const fontBody = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

export const metadata = {
  title: "REX - Workflow Automation Engine",
  description: "AI-powered workflow automation platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${fontDisplay.variable} ${fontBody.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
