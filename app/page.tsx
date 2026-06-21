import { getPostsByPage, getTotalPages } from "@/lib/posts";
import { PostList } from "@/components/post-list";
import { Pagination } from "@/components/pagination";

export default function Home() {
  const currentPage = 1;
  const pagePosts = getPostsByPage(currentPage);
  const totalPages = getTotalPages();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
        記事一覧
      </h1>
      <PostList posts={pagePosts} />
      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </main>
  );
}
