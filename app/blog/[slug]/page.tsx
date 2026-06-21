import Link from "next/link";
import { notFound } from "next/navigation";
import { MdxContent } from "@/components/mdx-content";
import { getPostBySlug, getPublishedPosts } from "@/lib/posts";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getPublishedPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const formattedDate = new Date(post.date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="mx-auto w-full max-w-2xl px-4 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          {post.title}
        </h1>
        <p className="mt-3 text-zinc-600">{post.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
          <time dateTime={post.date}>{formattedDate}</time>
          <ul className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <li key={tag}>
                <Link
                  href={`/tags/${tag}`}
                  className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200"
                >
                  {tag}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </header>
      <div className="prose prose-zinc max-w-none">
        <MdxContent code={post.content} />
      </div>
    </article>
  );
}
