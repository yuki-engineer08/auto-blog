import Link from "next/link";
import { getAllTagsWithCount } from "@/lib/posts";

export default function TagsPage() {
  const tags = getAllTagsWithCount();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
        タグ一覧
      </h1>
      <ul className="mt-8 flex flex-wrap gap-3">
        {tags.map(({ tag, count }) => (
          <li key={tag}>
            <Link
              href={`/tags/${tag}`}
              className="flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400"
            >
              <span>#{tag}</span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                {count}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
