"use client";

/**
 * 記事本文末尾に置く「ページ先頭に戻る」ボタン。
 * クリックでページ先頭までスムーズスクロールする。
 * クライアント側のクリックハンドラが必要なため Client Component とする。
 */
export function ScrollToTopButton() {
  function handleClick() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-line bg-paper px-5 py-3 font-mono text-sm text-ink-dim transition hover:text-signal sm:w-auto"
    >
      <span aria-hidden="true">↑</span>
      ページ先頭に戻る
    </button>
  );
}
