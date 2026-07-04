/**
 * Unified entry point for Qiita cross-posting.
 *
 * Pipeline:
 *   1. Detect changed MDX files (published: true) via detect-changes.ts
 *   2. For each file:
 *      a. Convert MDX -> Markdown + build Qiita payload
 *      b. POST (new) or PATCH (existing) the article on Qiita
 *      c. If it was a new POST, write the returned qiita_id back into the
 *         MDX frontmatter and commit + push with [skip ci]
 *   3. Print success / failure counts and exit accordingly.
 *
 * Required env:
 *   QIITA_ACCESS_TOKEN  — Qiita personal access token
 *
 * Optional env (consumed by child modules):
 *   SITE_BASE_URL       — Base URL for crosspost attribution links
 *   GITHUB_TOKEN        — Used by write-back-id.ts to git push
 *   GITHUB_BEFORE       — Commit SHA "before" for diff (detect-changes.ts)
 *   GITHUB_SHA          — Commit SHA "after"  for diff (detect-changes.ts)
 */

import * as fs from "fs";
import * as path from "path";
import { detectChanges } from "./detect-changes";
import { convertMdx, extractSlug } from "./convert-mdx";
import { buildQiitaPayload } from "./build-frontmatter";
import { postToQiita, type PostQiitaInput } from "./post-qiita";
import { writeBackId } from "./write-back-id";

async function main(): Promise<void> {
  // Early exit if the required token is missing.
  if (!process.env.QIITA_ACCESS_TOKEN) {
    process.stderr.write(
      "Error: QIITA_ACCESS_TOKEN environment variable is not set.\n"
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
  let successCount = 0;
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
    const qiitaPayload = buildQiitaPayload(frontmatter, body, slug);

    const input: PostQiitaInput = {
      slug,
      frontmatter: frontmatter as PostQiitaInput["frontmatter"],
      qiita: { payload: qiitaPayload },
    };

    // Record whether this is a new article before posting.
    const isNewArticle = !frontmatter.qiita_id;

    const result = await postToQiita(input);
    // postToQiita calls process.exit(1) on error, so we only reach here on success.

    const action = result.isNew ? "POST" : "PATCH";
    console.log(`[${action}] ${slug} -> ${result.url}`);
    successCount++;

    // Only write back the ID when this was a brand-new POST.
    if (isNewArticle && result.isNew) {
      try {
        writeBackId(fullPath, result.qiita_id);
      } catch (err) {
        process.stderr.write(
          `Warning: failed to write back qiita_id for ${slug}: ${(err as Error).message}\n`
        );
        // Non-fatal: the article was already posted successfully.
      }
    }
  }

  console.log(`\nDone: ${successCount} succeeded, ${failCount} failed.`);

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  process.stderr.write(`Unexpected error: ${(err as Error).message}\n`);
  process.exit(1);
});
