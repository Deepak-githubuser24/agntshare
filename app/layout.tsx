import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
  title: "Agntshare | HTTPS for AI Agent State",
  description:
    "Replace raw 100k+ token context bloat with short-lived, scoped, cryptographically verified pathway tokens. MCP-native, framework agnostic, zero-trust state handoffs for AI agents.",
  keywords: ["AI agents", "LLM file sharing", "agentic memory", "pathway tokens", "MCP", "Model Context Protocol", "LangChain", "CrewAI"],
  openGraph: {
    title: "Agntshare | HTTPS for AI Agent State",
    description:
      "Replace raw context bloat with short-lived, scoped, cryptographically verified pathway tokens. Pass the token, not the 120k context window.",
    url: "https://agnt.sr",
    siteName: "Agntshare Protocol",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agntshare | HTTPS for AI Agent State",
    description:
      "Replace raw context bloat with short-lived, scoped, cryptographically verified pathway tokens. Pass the token, not the 120k context window.",
  },
  metadataBase: new URL("https://agnt.sr"),
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
      <body className="min-h-full flex flex-col">
        <Script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
