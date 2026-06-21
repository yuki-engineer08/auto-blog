import { defineConfig, defineCollection, s } from "velite";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";

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
      slug: s.path(),
      metadata: s.metadata(),
      excerpt: s.excerpt(),
      content: s.mdx(),
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
    remarkPlugins: [],
  },
});
