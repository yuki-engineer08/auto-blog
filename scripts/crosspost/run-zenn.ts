/**
 * Unified entry point for Zenn cross-posting.
 *
 * Pipeline:
 *   1. Detect changed MDX files (published: true) via detect-changes.ts
 *   2. For each file:
 *      a. Convert MDX -> Markdown + build Zenn-formatted markdown
 *   3. Push all converted articles to the Zenn-linked GitHub repository
 *      in a single git commit via push-zenn.ts
 *
 * Required env:
 *   ZENN_REPO_PAT  — Personal access token with write access to the Zenn repo
 *   ZENN_REPO      — Repository in "owner/repo" format (e.g., "yuki-engineer08/zenn-articles")
 *
 * Optional env (consumed by child modules):
 *   SITE_BASE_URL  — Base URL for absolute image path conversion
 *   GITHUB_BEFORE  — Commit SHA "before" for diff (detect-changes.ts)
 *   GITHUB_SHA     — Commit SHA "after"  for diff (detect-changes.ts)
 */

import * as fs from "fs";
import * as path from "path";
import { detectChanges } from "./detect-changes";
import { convertMdx, extractSlug } from "./convert-mdx";
import { buildZennMarkdown } from "./build-frontmatter";
import { pushToZenn, type ZennArticle } from "./push-zenn";

async function main(): Promise<void> {
  // Early exit if the required env vars are missing.
  if (!process.env.ZENN_REPO_PAT) {
    process.stderr.write(
      "Error: ZENN_REPO_PAT environment variable is not set.\n" +
        "Set ZENN_REPO_PAT to a GitHub Personal Access Token with write access to the Zenn repository.\n"
    );
    process.exit(1);
  }
  if (!process.env.ZENN_REPO) {
    process.stderr.write(
      "Error: ZENN_REPO environment variable is not set.\n" +
        "Set ZENN_REPO to the Zenn-linked repository in 'owner/repo' format (e.g., 'yuki-engineer08/zenn-articles').\n"
    );
    process.exit(1);
  }

  const changedFiles = detectChanges();

  if (changedFiles.length === 0) {
    console.log("No changed published MDX files detected. Nothing to do.");
    return;
  }

  console.log(`Found ${changedFiles.length} changed file(s) to process.`);

  const repoRoot = path.resolve(__dirname, "../..");
  const articles: ZennArticle[] = [];
  let failCount = 0;

  for (const mdxPath of changedFiles) {
    const fullPath = path.join(repoRoot, mdxPath);

    let raw: string;
    try {
      raw = fs.readFileSync(fullPath, "utf-8");
    } catch (err) {
      process.stderr.write(
        `Failed to read ${fullPath}: ${(err as Error).message}\n`
      );
      failCount++;
      continue;
    }

    const { frontmatter, body } = convertMdx(raw, mdxPath);
    const slug = extractSlug(mdxPath);
    const markdown = buildZennMarkdown(frontmatter, body);

    articles.push({ slug, markdown });
    console.log(`  Converted: ${slug}`);
  }

  if (failCount > 0 && articles.length === 0) {
    process.stderr.write("All files failed to process. Exiting.\n");
    process.exit(1);
  }

  await pushToZenn(articles);

  console.log(`\nDone: ${articles.length} article(s) pushed to Zenn.`);

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  process.stderr.write(`Unexpected error: ${(err as Error).message}\n`);
  process.exit(1);
});
