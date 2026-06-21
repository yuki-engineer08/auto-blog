import {
  getPostsByPage,
  getSearchIndex,
  getTotalPages,
} from "@/lib/posts";
import { PostList } from "@/components/post-list";
import { Pagination } from "@/components/pagination";
import { SearchBox } from "@/components/search-box";

export default function Home() {
  const currentPage = 1;
  const pagePosts = getPostsByPage(currentPage);
  const totalPages = getTotalPages();
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
