/**
 * 記事本文（h2/h3）から自動生成した目次（TOC）を、階層を視覚的に区別して表示する。
 * 各項目のリンク先は Sprint 0 で rehype-slug が見出しに付与したアンカーID（`#id`）と一致する
 * （Veliteの `s.toc()` が同じ github-slugger アルゴリズムでURLを生成しているため）。
 */
export type TocItem = {
  title: string;
  url: string;
  items: TocItem[];
};

type TableOfContentsProps = {
  toc: TocItem[];
};

function TocList({ items, depth }: { items: TocItem[]; depth: number }) {
  if (items.length === 0) return null;
  return (
    <ul className={depth === 0 ? "space-y-1.5" : "mt-1.5 space-y-1.5 border-l border-line pl-4"}>
      {items.map((item) => (
        <li key={item.url}>
          <a
            href={item.url}
            className="block text-ink-dim transition hover:text-signal"
          >
            {item.title}
          </a>
          <TocList items={item.items} depth={depth + 1} />
        </li>
      ))}
    </ul>
  );
}

/**
 * 見出しが1つも無い記事では何も描画しない（呼び出し側でも空配列ガードは可能だが、
 * このコンポーネント単体でも破綻しないようにする）。
 */
export function TableOfContents({ toc }: TableOfContentsProps) {
  if (!toc || toc.length === 0) return null;

  return (
    <nav
      aria-label="目次"
      className="mb-10 rounded-md border border-line bg-paper px-5 py-4 font-mono text-sm"
    >
      <p className="mb-3 text-xs tracking-widest text-ink-dim">// TABLE OF CONTENTS</p>
      <TocList items={toc} depth={0} />
    </nav>
  );
}
