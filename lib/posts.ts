import { posts } from "@/.velite";
import type { Post as PostOrNull } from "@/.velite";

export type Post = NonNullable<PostOrNull>;

/** 1ページに表示する記事数 */
export const POSTS_PER_PAGE = 5;

/**
 * 日付を `2026.06.21` 形式（ログ/タイムスタンプ風）に整形する。
 * `date` はISO日付文字列（`YYYY-MM-DD...`）の先頭10文字を利用する。
 */
export function formatLogDate(date: string): string {
  return date.slice(0, 10).replaceAll("-", ".");
}

/**
 * 公開済み（published: true）の記事を日付の新しい順にソートして返す。
 * Veliteのtransformでpublished: falseの記事はnullに変換されているため、
 * ここではnullの除外のみ行えばよいが、念のためpublishedも確認する。
 */
export function getPublishedPosts(): Post[] {
  return posts
    .filter((post): post is Post => post != null && post.published)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string): Post | undefined {
  return getPublishedPosts().find((post) => post.slug === slug);
}

export function getTotalPages(): number {
  return Math.max(1, Math.ceil(getPublishedPosts().length / POSTS_PER_PAGE));
}

/**
 * 指定したページ番号（1始まり）に表示する記事一覧を返す。
 */
export function getPostsByPage(page: number): Post[] {
  const allPosts = getPublishedPosts();
  const start = (page - 1) * POSTS_PER_PAGE;
  return allPosts.slice(start, start + POSTS_PER_PAGE);
}

/**
 * 指定したタグを持つ公開済み記事を日付の新しい順にソートして返す。
 */
export function getPublishedPostsByTag(tag: string): Post[] {
  return getPublishedPosts().filter((post) => post.tags.includes(tag));
}

export function getTotalPagesForTag(tag: string): number {
  return Math.max(1, Math.ceil(getPublishedPostsByTag(tag).length / POSTS_PER_PAGE));
}

/**
 * 指定したタグの記事一覧から、指定したページ番号（1始まり）に表示する記事一覧を返す。
 */
export function getPostsByTagAndPage(tag: string, page: number): Post[] {
  const tagPosts = getPublishedPostsByTag(tag);
  const start = (page - 1) * POSTS_PER_PAGE;
  return tagPosts.slice(start, start + POSTS_PER_PAGE);
}

export type TagWithCount = {
  tag: string;
  count: number;
};

/**
 * 公開済み記事のみを対象に、全タグとその記事数を集計して返す。
 * `published: false` の記事のみが持つタグは出現しない。
 */
export function getAllTagsWithCount(): TagWithCount[] {
  const counts = new Map<string, number>();
  for (const post of getPublishedPosts()) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

/**
 * 公開済み記事に出現する全タグ名（重複なし）を返す。
 * 静的パス生成（generateStaticParams）に利用する。
 */
export function getAllTags(): string[] {
  return getAllTagsWithCount().map(({ tag }) => tag);
}

export type SearchablePost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  /** 本文の平文テキスト（クライアント側検索用） */
  plain: string;
  /** サムネイル画像（未設定の記事はundefined） */
  thumbnail?: Post["thumbnail"];
};

/**
 * クライアント側検索のための公開記事インデックスを返す。
 * `published: false` の記事は含まれない（`getPublishedPosts` が既に除外しているため）。
 * 日付の新しい順にソートされている。
 */
export function getSearchIndex(): SearchablePost[] {
  return getPublishedPosts().map((post) => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    date: post.date,
    tags: post.tags,
    plain: post.plain,
    thumbnail: post.thumbnail,
  }));
}
