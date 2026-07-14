import Link from "next/link";
import { getPostBySlug } from "@/lib/posts";

type RelatedPostCardProps = {
  slug: string;
};

/**
 * MDX本文中に埋め込む関連記事カード。`<RelatedPostCard slug="..." />` で呼び出す。
 * 存在しないslugを渡した場合はビルドを止めず何も描画しない。
 */
export function RelatedPostCard({ slug }: RelatedPostCardProps) {
  const post = getPostBySlug(slug);
  if (!post) return null;

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="not-prose group my-8 flex items-center gap-4 rounded-md border border-line p-4 no-underline transition hover:border-signal"
    >
      <div className="shrink-0">
        {post.thumbnail ? (
          <img
            src={post.thumbnail.src}
            alt={`${post.title} のサムネイル画像`}
            className="h-20 w-20 rounded-sm border border-line object-cover sm:h-24 sm:w-24"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-20 w-20 items-center justify-center rounded-sm border border-dashed border-line font-mono text-[0.6rem] text-ink-dim sm:h-24 sm:w-24"
          >
            no img
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-xs text-ink-dim">関連記事</p>
        <h3 className="mt-1 font-bold text-ink transition group-hover:text-signal">
          {post.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-ink-dim">{post.description}</p>
      </div>
    </Link>
  );
}
