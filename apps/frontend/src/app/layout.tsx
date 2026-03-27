import "@/app/globals.css";
import { Providers } from "@/app/providers";

export const metadata = {
  title: "REX Frontend",
  description: "REX frontend baseline",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
