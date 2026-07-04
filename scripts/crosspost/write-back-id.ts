/**
 * Writes a Qiita article ID back into the MDX file's frontmatter,
 * then commits and pushes the change.
 *
 * Usage: tsx scripts/crosspost/write-back-id.ts <mdxPath> <qiita_id>
 * Example: tsx scripts/crosspost/write-back-id.ts content/blog/2025-01-01-example/index.mdx abc123def
 *
 * Notes:
 *   - The commit message includes "[skip ci]" so this commit does not trigger
 *     another crosspost workflow run.
 *   - Git push relies on the remote being configured with write access
 *     (GitHub Actions provides this via actions/checkout + GITHUB_TOKEN).
 *   - When run outside of CI, git push will likely fail if credentials are
 *     not configured — this is expected behaviour.
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import matter from "gray-matter";

/**
 * Extracts the slug from an MDX file path.
 * "content/blog/2025-01-01-example/index.mdx" -> "2025-01-01-example"
 */
function extractSlugFromPath(mdxPath: string): string {
  const normalized = mdxPath.replace(/\\/g, "/");
  const parts = normalized.split("/");
  return parts[parts.length - 2];
}

/**
 * Writes the Qiita article ID into the frontmatter of the given MDX file,
 * then commits and pushes the change with [skip ci] in the message.
 *
 * @param mdxPath - Absolute or repo-relative path to the MDX file.
 * @param qiitaId - The Qiita item ID returned by the API.
 */
export function writeBackId(mdxPath: string, qiitaId: string): void {
  const absPath = path.isAbsolute(mdxPath)
    ? mdxPath
    : path.resolve(process.cwd(), mdxPath);

  // Read and parse the MDX file.
  const raw = fs.readFileSync(absPath, "utf-8");
  const parsed = matter(raw);

  // Inject / overwrite qiita_id.
  parsed.data.qiita_id = qiitaId;

  // Re-serialise: matter.stringify(content, data) produces "---\n...\n---\n<content>"
  // Use LF line endings to keep consistency on both Windows and Linux.
  const newContent = matter
    .stringify(parsed.content, parsed.data)
    .replace(/\r\n/g, "\n");

  fs.writeFileSync(absPath, newContent, "utf-8");

  const slug = extractSlugFromPath(absPath);
  const commitMessage = `chore: write back Qiita ID for ${slug} [skip ci]`;

  // Configure git identity if not already set (required in CI environments).
  try {
    execSync("git config user.email", { stdio: "pipe" });
  } catch {
    execSync('git config user.email "github-actions[bot]@users.noreply.github.com"');
    execSync('git config user.name "github-actions[bot]"');
  }

  execSync(`git add "${absPath}"`);
  execSync(`git commit -m "${commitMessage}"`);

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    process.stderr.write(
      "GITHUB_TOKEN is not set; skipping git push (expected outside CI)\n"
    );
    return;
  }

  execSync("git push");
  console.log(`Committed and pushed qiita_id=${qiitaId} for ${slug}`);
}

// When run directly as a CLI script.
if (require.main === module) {
  const [, , mdxPathArg, qiitaIdArg] = process.argv;

  if (!mdxPathArg || !qiitaIdArg) {
    process.stderr.write(
      "Usage: tsx scripts/crosspost/write-back-id.ts <mdxPath> <qiita_id>\n"
    );
    process.exit(1);
  }

  writeBackId(mdxPathArg, qiitaIdArg);
}
