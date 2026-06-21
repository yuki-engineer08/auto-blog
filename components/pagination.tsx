import Link from "next/link";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  /**
   * ページ番号からURLを生成する関数。
   * 省略時はトップページの一覧用のURL（`/`, `/page/2`...）を生成する。
   */
  getHref?: (page: number) => string;
};

function defaultPageHref(page: number): string {
  return page <= 1 ? "/" : `/page/${page}`;
}

export function Pagination({
  currentPage,
  totalPages,
  getHref = defaultPageHref,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav
      aria-label="ページネーション"
      className="mt-12 flex items-center justify-between border-t border-line pt-6 font-mono text-xs"
    >
      {hasPrev ? (
        <Link
          href={getHref(currentPage - 1)}
          className="tracking-wide text-ink transition hover:text-signal"
        >
          ← prev
        </Link>
      ) : (
        <span aria-disabled="true" className="tracking-wide text-line">
          ← prev
        </span>
      )}

      <span className="tracking-widest text-ink-dim">
        page {currentPage} / {totalPages}
      </span>

      {hasNext ? (
        <Link
          href={getHref(currentPage + 1)}
          className="tracking-wide text-ink transition hover:text-signal"
        >
          next →
        </Link>
      ) : (
        <span aria-disabled="true" className="tracking-wide text-line">
          next →
        </span>
      )}
    </nav>
  );
}
