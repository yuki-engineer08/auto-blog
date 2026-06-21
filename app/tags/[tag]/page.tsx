import { notFound } from "next/navigation";
import {
  getAllTags,
  getPostsByTagAndPage,
  getTotalPagesForTag,
} from "@/lib/posts";
import { PostList } from "@/components/post-list";
import { Pagination } from "@/components/pagination";

type Props = {
  params: Promise<{ tag: string }>;
};

export function generateStaticParams() {
  return getAllTags().map((tag) => ({ tag }));
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
      <p className="text-sm font-medium text-zinc-500">タグ</p>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
        #{tag}
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
