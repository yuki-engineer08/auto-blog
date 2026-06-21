import Link from "next/link";
import { formatLogDate } from "@/lib/posts";

/**
 * 一覧表示に必要な最小限のフィールド。
 * `Post`（Velite由来の全フィールドを持つ型）・`SearchablePost`（検索インデックス用の型）
 * のいずれを渡しても表示できるようにする。
 * `thumbnail` は未設定の記事が存在するため optional。
 */
type PostListItem = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  thumbnail?: {
    src: string;
    width: number;
    height: number;
  };
};

type PostListProps = {
  posts: PostListItem[];
};

export function PostList({ posts }: PostListProps) {
  return (
    <ul className="mt-10 divide-y divide-line">
      {posts.map((post) => (
        <li key={post.slug} className="py-6 first:pt-0">
          <Link
            href={`/blog/${post.slug}`}
            className="group flex items-start justify-between gap-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-xs text-ink-dim">
                <time dateTime={post.date} className="tracking-wide">
                  {formatLogDate(post.date)}
                </time>
                {post.tags.length > 0 && (
                  <span className="flex flex-wrap gap-x-2 tracking-wide">
                    {post.tags.map((tag) => (
                      <span key={tag}>[{tag}]</span>
                    ))}
                  </span>
                )}
              </div>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-ink transition group-hover:text-signal">
                {post.title}
              </h2>
              <p className="mt-1.5 text-ink-dim">{post.description}</p>
            </div>
            <div className="shrink-0">
              {post.thumbnail ? (
                <img
                  src={post.thumbnail.src}
                  alt={`${post.title} のサムネイル画像`}
                  className="h-16 w-16 rounded-sm border border-line object-cover sm:h-20 sm:w-20"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="flex h-16 w-16 items-center justify-center rounded-sm border border-dashed border-line font-mono text-[0.6rem] text-ink-dim sm:h-20 sm:w-20"
                >
                  no img
                </div>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
