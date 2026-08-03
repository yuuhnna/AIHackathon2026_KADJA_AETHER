import type { Metadata } from "next";
import NavBar from "@/components/NavBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "AETHER — Mangrove Vulnerability Dashboard",
  description:
    "AI-powered environmental decision support for proactive mangrove conservation in Iloilo Province.",
  openGraph: {
    title: "AETHER — Mangrove Vulnerability Dashboard",
    description:
      "AI-powered environmental decision support for proactive mangrove conservation in Iloilo Province.",
    images: [{ url: "/aether-logo-green.png" }],
  },
  twitter: {
    card: "summary",
    title: "AETHER — Mangrove Vulnerability Dashboard",
    images: ["/aether-logo-green.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-white focus:text-ink focus:px-4 focus:py-2 focus:rounded-sm focus:font-mono focus:text-xs focus:shadow-lg"
        >
          Skip to main content
        </a>
        <NavBar />
        <div id="main-content" className="flex flex-1 flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
