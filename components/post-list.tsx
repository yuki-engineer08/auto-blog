import Link from "next/link";
import type { Post } from "@/lib/posts";

type PostListProps = {
  posts: Post[];
};

export function PostList({ posts }: PostListProps) {
  return (
    <ul className="mt-8 space-y-6">
      {posts.map((post) => (
        <li key={post.slug}>
          <Link
            href={`/blog/${post.slug}`}
            className="block rounded-lg border border-zinc-200 p-5 transition hover:border-zinc-400"
          >
            <h2 className="text-xl font-semibold text-zinc-900">
              {post.title}
            </h2>
            <p className="mt-2 text-zinc-600">{post.description}</p>
            <time
              dateTime={post.date}
              className="mt-3 block text-sm text-zinc-500"
            >
              {new Date(post.date).toLocaleDateString("ja-JP")}
            </time>
          </Link>
        </li>
      ))}
    </ul>
  );
}
