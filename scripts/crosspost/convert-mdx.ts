import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";

const SITE_BASE_URL =
  process.env.SITE_BASE_URL ?? "https://YOUR_CLOUDFRONT_DOMAIN";

/**
 * Parses MDX content: removes the frontmatter block and returns both
 * the parsed frontmatter data and the remaining body text.
 */
export function parseFrontmatter(content: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const { data, content: body } = matter(content);
  return {
    frontmatter: data as Record<string, unknown>,
    body: body.trim(),
  };
}

/**
 * Removes PascalCase JSX components from Markdown body.
 * Targets:
 *   - Self-closing: <ComponentName ... />
 *   - Block: <ComponentName ...>...</ComponentName>
 * Preserves lowercase HTML tags (a, img, p, code, div, span, etc.)
 * Collapses 2+ consecutive blank lines into a single blank line.
 */
export function removeMdxComponents(body: string): string {
  // Remove block components: <PascalCase ...>...</PascalCase>
  // Uses non-greedy match; handles multi-line content
  let result = body.replace(
    /<([A-Z][a-zA-Z0-9]*)[^>]*>[\s\S]*?<\/\1>/g,
    ""
  );

  // Remove self-closing components: <PascalCase ... /> or <PascalCase/>
  result = result.replace(/<[A-Z][a-zA-Z0-9]*(?:\s[^>]*)?\s*\/>/g, "");

  // Collapse 2+ consecutive blank lines into one blank line
  result = result.replace(/\n{3,}/g, "\n\n");

  return result.trim();
}

/**
 * Builds a mapping from relative image paths (e.g. "./thumbnail.png") to
 * absolute CloudFront URLs (e.g. "https://DOMAIN/static/thumbnail-a61d6e.png")
 * by reading Velite's build output (.velite/posts.json).
 *
 * Velite renames images to "[name]-[hash:6].[ext]" and places them under /static/.
 * The compiled `content` field in posts.json already contains the resolved paths,
 * so we extract them in order and match them positionally with the raw MDX references.
 *
 * Falls back to an empty mapping (causing convertImagePaths to use the slug-based URL)
 * if .velite/posts.json is absent or the article cannot be found.
 */
export function buildImageMapping(
  slug: string,
  rawBody: string
): Record<string, string> {
  const mapping: Record<string, string> = {};
  try {
    const velitePath = path.join(process.cwd(), ".velite", "posts.json");
    if (!fs.existsSync(velitePath)) return mapping;

    const posts = JSON.parse(fs.readFileSync(velitePath, "utf-8")) as Array<
      { slug?: string; content?: string } | null
    >;
    const post = posts.find((p) => p?.slug === slug);
    if (!post?.content) return mapping;

    const baseUrl = SITE_BASE_URL.replace(/\/$/, "");

    // Extract relative paths from raw MDX in document order
    const relativePaths = [...rawBody.matchAll(/!\[[^\]]*\]\((\.\/[^)]+)\)/g)].map(
      (m) => m[1]
    );
    // Extract resolved /static/ paths from the compiled content in document order
    const staticPaths = [...post.content.matchAll(/src:"(\/static\/[^"]+)"/g)].map(
      (m) => m[1]
    );

    for (let i = 0; i < Math.min(relativePaths.length, staticPaths.length); i++) {
      mapping[relativePaths[i]] = `${baseUrl}${staticPaths[i]}`;
    }
  } catch {
    // Silently fall back to empty mapping
  }
  return mapping;
}

/**
 * Converts relative image paths to absolute CloudFront URLs.
 * Uses the Velite-derived imageMapping when available; falls back to the
 * slug-based path (e.g. /blog/{slug}/filename.png) when a mapping entry
 * is missing.
 *
 * @param body         - Markdown body text
 * @param slug         - Article slug (e.g. "2025-01-01-example")
 * @param imageMapping - Mapping built by buildImageMapping(); defaults to {}
 */
export function convertImagePaths(
  body: string,
  slug: string,
  imageMapping: Record<string, string> = {}
): string {
  const baseUrl = SITE_BASE_URL.replace(/\/$/, "");

  return body.replace(
    /!\[([^\]]*)\]\((\.\/[^)]+)\)/g,
    (_match, alt, relPath) => {
      // relPath includes the "./" prefix (e.g. "./thumbnail.png")
      // imageMapping keys also use the "./" prefix, so look up directly.
      // Fallback strips "./" for the slug-based URL.
      const resolved =
        imageMapping[relPath] ??
        `${baseUrl}/blog/${slug}/${relPath.replace(/^\.\//, "")}`;
      return `![${alt}](${resolved})`;
    }
  );
}

/**
 * Extracts the slug from an MDX file path.
 * Input:  "content/blog/2025-01-01-example/index.mdx"
 * Output: "2025-01-01-example"
 */
export function extractSlug(mdxPath: string): string {
  // Normalize path separators
  const normalized = mdxPath.replace(/\\/g, "/");
  const parts = normalized.split("/");
  // Path structure: content/blog/{slug}/index.mdx
  // slug is at index -2
  return parts[parts.length - 2];
}

/**
 * Full MDX-to-Markdown conversion pipeline.
 * Returns frontmatter data and converted body.
 */
export function convertMdx(
  content: string,
  mdxPath: string
): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const slug = extractSlug(mdxPath);
  const { frontmatter, body } = parseFrontmatter(content);
  const bodyWithoutComponents = removeMdxComponents(body);
  const imageMapping = buildImageMapping(slug, bodyWithoutComponents);
  const bodyWithAbsoluteImages = convertImagePaths(bodyWithoutComponents, slug, imageMapping);

  return {
    frontmatter,
    body: bodyWithAbsoluteImages,
  };
}
