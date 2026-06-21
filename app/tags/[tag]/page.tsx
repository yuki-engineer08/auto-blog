import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllTags,
  getPostsByTagAndPage,
  getTotalPagesForTag,
} from "@/lib/posts";
import { PostList } from "@/components/post-list";
import { Pagination } from "@/components/pagination";
import { defaultOgImage, siteUrl } from "@/lib/site";

type Props = {
  params: Promise<{ tag: string }>;
};

export function generateStaticParams() {
  return getAllTags().map((tag) => ({ tag }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const title = `[${tag}] の記事一覧 | journal`;
  const description = `タグ「${tag}」が付与された記事の一覧。`;
  const url = `${siteUrl}/tags/${tag}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url,
      images: [defaultOgImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [defaultOgImage],
    },
  };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;

  if (!getAllTags().includes(tag)) {
    notFound();
  }

  const totalPages = getTotalPagesForTag(tag);
  const currentPage = 1;
  const pagePosts = getPostsByTagAndPage(tag, currentPage);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12">
      <p className="font-mono text-xs tracking-widest text-signal">
        tags/{tag}
      </p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-ink">
        [{tag}]
      </h1>
      <PostList posts={pagePosts} />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        getHref={(page) =>
          page <= 1 ? `/tags/${tag}` : `/tags/${tag}/page/${page}`
        }
      />
    </main>
  );
}
