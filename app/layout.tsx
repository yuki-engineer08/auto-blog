import type { Metadata } from "next";
import Link from "next/link";
import { Zen_Kaku_Gothic_New, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const zenKaku = Zen_Kaku_Gothic_New({
  variable: "--font-zen-kaku",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "journal",
  description: "個人の技術ブログ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${zenKaku.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <header className="border-b border-line">
          <div className="mx-auto flex w-full max-w-2xl items-baseline justify-between px-4 py-5">
            <Link
              href="/"
              className="font-mono text-sm font-medium tracking-tight text-ink"
            >
              journal<span className="text-signal">/</span>
            </Link>
            <Link
              href="/tags"
              className="font-mono text-xs tracking-widest text-ink-dim transition hover:text-signal"
            >
              tags/
            </Link>
          </div>
        </header>
        {children}
        <footer className="mt-auto border-t border-line">
          <div className="mx-auto w-full max-w-2xl px-4 py-6 font-mono text-xs tracking-wide text-ink-dim">
            EOF
          </div>
        </footer>
      </body>
    </html>
  );
}
