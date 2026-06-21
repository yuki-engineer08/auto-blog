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
      className="mt-10 flex items-center justify-between"
    >
      {hasPrev ? (
        <Link
          href={getHref(currentPage - 1)}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-500"
        >
          前のページ
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="cursor-not-allowed rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-400"
        >
          前のページ
        </span>
      )}

      <span className="text-sm text-zinc-600">
        {currentPage} / {totalPages} ページ
      </span>

      {hasNext ? (
        <Link
          href={getHref(currentPage + 1)}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-500"
        >
          次のページ
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="cursor-not-allowed rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-400"
        >
          次のページ
        </span>
      )}
    </nav>
  );
}
