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
 * Converts relative image paths to absolute CloudFront URLs.
 * Input pattern:  ![alt](./relative/path.png)
 * Output pattern: ![alt](https://YOUR_CLOUDFRONT_DOMAIN/blog/{slug}/relative/path.png)
 *
 * @param body - Markdown body text
 * @param slug - Article slug extracted from the MDX file path (e.g., "2025-01-01-example")
 */
export function convertImagePaths(body: string, slug: string): string {
  const baseUrl = SITE_BASE_URL.replace(/\/$/, "");

  return body.replace(
    /!\[([^\]]*)\]\(\.\/([^)]+)\)/g,
    (_match, alt, relPath) => {
      return `![${alt}](${baseUrl}/blog/${slug}/${relPath})`;
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
  const bodyWithAbsoluteImages = convertImagePaths(bodyWithoutComponents, slug);

  return {
    frontmatter,
    body: bodyWithAbsoluteImages,
  };
}
