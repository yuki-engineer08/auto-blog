import { defineConfig, defineCollection, s, z } from "velite";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import { remarkMermaid } from "./lib/remark-mermaid";

/**
 * 本文の平文テキストを取り出すスキーマ（クライアント側の検索インデックス用）。
 * Veliteが内部的に生成する `meta.plain`（HTML/Markdown記法を除いたプレーンテキスト）を利用する。
 * `s.excerpt()` 等と同じ実装パターン（`z.custom` + `transform` で `meta` にアクセス）に倣う。
 */
const plainText = () =>
  z
    .custom<string | undefined>((value) => value === undefined || typeof value === "string")
    .transform((value, ctx) => {
      const meta = (ctx as unknown as { meta?: { plain?: string } }).meta;
      return value ?? meta?.plain ?? "";
    });

const posts = defineCollection({
  name: "Post",
  pattern: "blog/**/index.mdx",
  schema: s
    .object({
      title: s.string().max(99),
      description: s.string().max(999),
      date: s.isodate(),
      tags: s.array(s.string()),
      published: s.boolean(),
      thumbnail: s.image().optional(),
      slug: s.path(),
      metadata: s.metadata(),
      excerpt: s.excerpt(),
      content: s.mdx(),
      plain: plainText(),
      // 本文中の h2/h3 見出しから、rehype-slugと一致するアンカーID付きの階層目次を生成する
      toc: s.toc({ minDepth: 2, maxDepth: 3 }),
    })
    .transform((data) => {
      // published: false の記事はビルド出力から除外する
      if (!data.published) return null;
      // slugは `blog/{YYYY-MM-DD-slug}` の形なので、先頭の `blog/` を取り除く
      return {
        ...data,
        slug: data.slug.replace(/^blog\//, ""),
      };
    }),
});

export default defineConfig({
  root: "content",
  strict: true,
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:6].[ext]",
    clean: true,
  },
  collections: { posts },
  mdx: {
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "wrap",
          properties: {
            className: ["anchor-link"],
          },
        },
      ],
      [
        rehypePrettyCode,
        {
          theme: "github-dark",
          // 背景色はテーマ側ではなくCSS側（--color-terminal）で統一して持たせる
          keepBackground: false,
        },
      ],
    ],
    remarkPlugins: [remarkMermaid],
  },
});
