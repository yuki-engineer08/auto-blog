import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getPostsByPage,
  getSearchIndex,
  getTotalPages,
} from "@/lib/posts";
import { PostList } from "@/components/post-list";
import { Pagination } from "@/components/pagination";
import { SearchBox } from "@/components/search-box";
import { defaultOgImage, siteUrl } from "@/lib/site";

type Props = {
  params: Promise<{ page: string }>;
};

export function generateStaticParams() {
  const totalPages = getTotalPages();
  // 1ページ目は `/` で表示するため、2ページ目以降のみ生成する
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
    page: String(i + 2),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page } = await params;
  const title = `記事一覧 ${page}ページ目 | journal`;
  const description = "個人の技術ブログ journal の記事一覧。";
  const url = `${siteUrl}/page/${page}`;

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

export default async function PaginatedHome({ params }: Props) {
  const { page } = await params;
  const currentPage = Number(page);
  const totalPages = getTotalPages();

  if (
    !Number.isInteger(currentPage) ||
    currentPage < 2 ||
    currentPage > totalPages
  ) {
    notFound();
  }

  const pagePosts = getPostsByPage(currentPage);
  const searchIndex = getSearchIndex();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12">
      <p className="font-mono text-xs tracking-widest text-signal">index/</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-ink">
        記事一覧
      </h1>
      <SearchBox
        searchIndex={searchIndex}
        defaultView={
          <>
            <PostList posts={pagePosts} />
            <Pagination currentPage={currentPage} totalPages={totalPages} />
          </>
        }
      />
    </main>
  );
}
