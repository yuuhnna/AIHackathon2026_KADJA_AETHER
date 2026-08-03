import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
