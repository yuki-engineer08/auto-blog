import type { Metadata } from "next";
import Link from "next/link";
import { Zen_Kaku_Gothic_New, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { siteProfile, socialLinks } from "@/lib/site";

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
          <Link
            href="/"
            aria-label="journal/ 記事一覧トップへ戻る"
            className="block border-b border-line"
          >
            <img
              src="/images/header.jpg"
              alt="journal のバナー画像: CAREGIVER × ENGINEER — Blending Human Compassion with Technological Innovation"
              className="h-24 w-full object-cover sm:h-32 md:h-40"
            />
          </Link>
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
          <div className="mx-auto w-full max-w-2xl px-4 py-10">
            <div className="flex items-start gap-4">
              <img
                src={siteProfile.avatar}
                alt={`${siteProfile.name} のプロフィールアイコン`}
                className="h-14 w-14 shrink-0 rounded-full border border-line object-cover"
              />
              <div className="min-w-0">
                <p className="font-mono text-sm font-medium text-ink">
                  {siteProfile.name}
                  <span className="text-signal">/</span>
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-dim">
                  {siteProfile.bio}
                </p>
                <ul className="mt-3 flex items-center gap-3">
                  {socialLinks.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={link.name}
                        className="block opacity-80 transition hover:opacity-100"
                      >
                        <img
                          src={link.icon}
                          alt={link.name}
                          className="h-6 w-6 object-contain"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-8 font-mono text-xs tracking-wide text-ink-dim">
              EOF
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
