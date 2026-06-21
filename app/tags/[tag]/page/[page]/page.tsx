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
  params: Promise<{ tag: string; page: string }>;
};

export function generateStaticParams() {
  return getAllTags().flatMap((tag) => {
    const totalPages = getTotalPagesForTag(tag);
    // 1ページ目は `/tags/[tag]` で表示するため、2ページ目以降のみ生成する
    return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
      tag,
      page: String(i + 2),
    }));
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag, page } = await params;
  const title = `[${tag}] の記事一覧 ${page}ページ目 | journal`;
  const description = `タグ「${tag}」が付与された記事の一覧。`;
  const url = `${siteUrl}/tags/${tag}/page/${page}`;

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

export default async function TagPaginatedPage({ params }: Props) {
  const { tag, page } = await params;

  if (!getAllTags().includes(tag)) {
    notFound();
  }

  const currentPage = Number(page);
  const totalPages = getTotalPagesForTag(tag);

  if (
    !Number.isInteger(currentPage) ||
    currentPage < 2 ||
    currentPage > totalPages
  ) {
    notFound();
  }

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
        getHref={(p) => (p <= 1 ? `/tags/${tag}` : `/tags/${tag}/page/${p}`)}
      />
    </main>
  );
}
