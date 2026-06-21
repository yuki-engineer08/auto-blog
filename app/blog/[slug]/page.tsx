import { notFound } from "next/navigation";
import { MdxContent } from "@/components/mdx-content";
import { TableOfContents } from "@/components/table-of-contents";
import { TagLink } from "@/components/tag-link";
import { formatLogDate, getPostBySlug, getPublishedPosts } from "@/lib/posts";

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

  return (
    <article className="mx-auto w-full max-w-2xl px-4 py-12">
      <header className="mb-10 border-b border-line pb-8">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-xs text-ink-dim">
          <time dateTime={post.date} className="tracking-wide">
            {formatLogDate(post.date)}
          </time>
          {post.tags.length > 0 && (
            <ul className="flex flex-wrap gap-x-2">
              {post.tags.map((tag) => (
                <li key={tag}>
                  <TagLink tag={tag} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-ink">
          {post.title}
        </h1>
        <p className="mt-3 text-ink-dim">{post.description}</p>
      </header>
      <TableOfContents toc={post.toc} />
      <div className="prose prose-ledger max-w-none">
        <MdxContent code={post.content} />
      </div>
    </article>
  );
}
