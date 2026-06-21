import type { Metadata } from "next";
import Link from "next/link";
import { getAllTagsWithCount } from "@/lib/posts";
import { defaultOgImage, siteUrl } from "@/lib/site";

const title = "タグ一覧 | journal";
const description = "個人の技術ブログ journal のタグ一覧。";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    url: `${siteUrl}/tags`,
    images: [defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [defaultOgImage],
  },
};

export default function TagsPage() {
  const tags = getAllTagsWithCount();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12">
      <p className="font-mono text-xs tracking-widest text-signal">tags/</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-ink">
        タグ一覧
      </h1>
      <ul className="mt-10 divide-y divide-line font-mono text-sm">
        {tags.map(({ tag, count }) => (
          <li key={tag}>
            <Link
              href={`/tags/${tag}`}
              className="group flex items-baseline justify-between gap-4 py-3 transition hover:text-signal"
            >
              <span className="tracking-wide text-ink group-hover:text-signal">
                [{tag}]
              </span>
              <span className="h-px flex-1 bg-line" aria-hidden="true" />
              <span className="shrink-0 text-ink-dim">{count} 件</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
