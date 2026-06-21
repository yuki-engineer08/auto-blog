"use client";

import { useMemo, useState } from "react";
import { PostList } from "@/components/post-list";
import type { SearchablePost } from "@/lib/posts";

type SearchBoxProps = {
  /** クライアント側検索の対象となる全公開記事（タイトル・本文の平文テキストを含む） */
  searchIndex: SearchablePost[];
  /** 検索未使用時（クエリが空）に表示する、ページ送り済みの記事一覧とページネーションUI */
  defaultView: React.ReactNode;
};

/**
 * 記事のタイトル・本文を対象に、入力に応じて大文字小文字を無視した部分一致で絞り込む。
 */
function searchPosts(index: SearchablePost[], query: string): SearchablePost[] {
  const normalized = query.trim().toLowerCase();
  if (normalized === "") return [];
  return index
    .filter((post) => {
      const haystack = `${post.title}\n${post.description}\n${post.plain}`.toLowerCase();
      return haystack.includes(normalized);
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function SearchBox({ searchIndex, defaultView }: SearchBoxProps) {
  const [query, setQuery] = useState("");

  const isSearching = query.trim() !== "";

  const results = useMemo(
    () => searchPosts(searchIndex, query),
    [searchIndex, query],
  );

  return (
    <div>
      <div className="mt-8">
        <label htmlFor="post-search" className="sr-only">
          記事を検索
        </label>
        <div className="flex items-center gap-2 border border-line bg-paper px-3 py-2 font-mono text-sm text-ink focus-within:border-signal">
          <span aria-hidden="true" className="text-signal">
            $
          </span>
          <input
            id="post-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search --title --body keyword"
            className="w-full bg-transparent text-ink placeholder:text-ink-dim focus:outline-none"
          />
        </div>
      </div>

      {isSearching ? (
        <div className="mt-2">
          <p className="mt-4 font-mono text-xs tracking-widest text-ink-dim">
            {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;{query.trim()}&rdquo;
          </p>
          {results.length === 0 ? (
            <p className="mt-10 font-mono text-sm text-ink-dim">
              該当する記事がありません
            </p>
          ) : (
            <PostList posts={results} />
          )}
        </div>
      ) : (
        defaultView
      )}
    </div>
  );
}
