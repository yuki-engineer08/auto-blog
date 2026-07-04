/**
 * Qiita API tag format
 */
interface QiitaTag {
  name: string;
}

/**
 * Qiita API payload shape (partial — only fields we generate)
 */
export interface QiitaPayload {
  title: string;
  tags: QiitaTag[];
  private: boolean;
  body: string;
}

/**
 * Zenn frontmatter shape
 */
export interface ZennFrontmatter {
  title: string;
  emoji: string;
  type: string;
  topics: string[];
  published: boolean;
}

/**
 * Builds the Qiita API payload from article frontmatter and body.
 *
 * Mapping:
 *   title     -> title (as-is)
 *   tags[]    -> tags: [{ name: "tag" }]
 *   published -> private: !published
 */
export function buildQiitaPayload(
  frontmatter: Record<string, unknown>,
  body: string
): QiitaPayload {
  const title = (frontmatter.title as string) ?? "";
  const rawTags = (frontmatter.tags as string[]) ?? [];
  const published = (frontmatter.published as boolean) ?? false;

  return {
    title,
    tags: rawTags.map((name) => ({ name })),
    private: !published,
    body,
  };
}

/**
 * Escapes a string for use as a YAML double-quoted scalar.
 */
function yamlEscape(val: string): string {
  return val.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Builds the Zenn frontmatter and returns it as a YAML block string
 * in the format:  ---\n...\n---\n
 *
 * Mapping:
 *   title     -> title (as-is)
 *   tags[]    -> topics (max 5)
 *   published -> published (as-is)
 *   (none)    -> emoji: "📝" (default)
 *   (none)    -> type: "tech" (default)
 */
export function buildZennFrontmatter(
  frontmatter: Record<string, unknown>
): string {
  const title = (frontmatter.title as string) ?? "";
  const rawTags = (frontmatter.tags as string[]) ?? [];
  const topics = rawTags.slice(0, 5);
  const published = (frontmatter.published as boolean) ?? false;
  const emoji = "📝";
  const type = "tech";

  const topicsYaml =
    topics.length > 0
      ? topics.map((t) => `  - "${yamlEscape(t)}"`).join("\n")
      : "  []";

  return [
    "---",
    `title: "${yamlEscape(title)}"`,
    `emoji: "${emoji}"`,
    `type: "${type}"`,
    `topics:`,
    topicsYaml,
    `published: ${published}`,
    "---",
    "",
  ].join("\n");
}

/**
 * Combines Zenn frontmatter with the converted Markdown body.
 * Ensures a blank line between the closing --- and the body.
 */
export function buildZennMarkdown(
  frontmatter: Record<string, unknown>,
  body: string
): string {
  // buildZennFrontmatter already ends with "---\n"; add one more newline
  return buildZennFrontmatter(frontmatter) + "\n" + body;
}
