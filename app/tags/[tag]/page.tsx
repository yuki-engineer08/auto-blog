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
