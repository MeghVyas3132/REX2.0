import "./globals.css";
import Providers from "./providers";

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
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
