import Link from "next/link";
import { formatLogDate } from "@/lib/posts";
import type { AdjacentPosts } from "@/lib/posts";

type PostPagerProps = {
  adjacent: AdjacentPosts;
};

/**
 * 記事詳細ページ末尾の「前の記事」「次の記事」リンク。
 * `previous`（日付的に古い記事）= 前の記事、`next`（日付的に新しい記事）= 次の記事。
 * 公開記事が1件のみ、または最初/最後の記事の場合は該当する側（あるいは両方）を描画しない。
 */
export function PostPager({ adjacent }: PostPagerProps) {
  const { previous, next } = adjacent;

  if (!previous && !next) return null;

  return (
    <nav
      aria-label="前後の記事"
      className="mt-10 grid grid-cols-1 gap-3 border-t border-line pt-8 sm:grid-cols-2"
    >
      <div>
        {previous && (
          <Link
            href={`/blog/${previous.slug}`}
            className="block rounded-md border border-line px-4 py-3 transition hover:border-signal"
          >
            <p className="font-mono text-xs text-ink-dim">&larr; 前の記事</p>
            <p className="mt-1 font-bold text-ink">{previous.title}</p>
            <time dateTime={previous.date} className="mt-1 block font-mono text-xs text-ink-dim">
              {formatLogDate(previous.date)}
            </time>
          </Link>
        )}
      </div>
      <div className="sm:text-right">
        {next && (
          <Link
            href={`/blog/${next.slug}`}
            className="block rounded-md border border-line px-4 py-3 transition hover:border-signal"
          >
            <p className="font-mono text-xs text-ink-dim">次の記事 &rarr;</p>
            <p className="mt-1 font-bold text-ink">{next.title}</p>
            <time dateTime={next.date} className="mt-1 block font-mono text-xs text-ink-dim">
              {formatLogDate(next.date)}
            </time>
          </Link>
        )}
      </div>
    </nav>
  );
}
