/**
 * Pushes Zenn-formatted Markdown files to the Zenn GitHub-linked repository.
 *
 * Required env:
 *   ZENN_REPO_PAT  — Personal access token with write access to the Zenn repo
 *   ZENN_REPO      — Repository in "owner/repo" format (e.g., "yuki-engineer08/zenn-articles")
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { execSync } from "child_process";

export interface ZennArticle {
  slug: string;
  markdown: string; // Zenn-formatted frontmatter + Markdown body
}

/**
 * Validates and normalises a Zenn slug.
 * Zenn requirements: only [a-z0-9_-], 12–50 characters.
 * If the slug exceeds 50 chars, it is truncated at a hyphen boundary.
 */
function validateSlug(slug: string): string {
  let validated = slug;

  if (validated.length > 50) {
    const truncated = validated.slice(0, 50);
    const lastHyphen = truncated.lastIndexOf("-");
    // Only truncate at hyphen when the result would still meet the 12-char minimum
    validated =
      lastHyphen >= 12 ? truncated.slice(0, lastHyphen) : truncated;
    process.stderr.write(
      `Warning: slug "${slug}" exceeds 50 characters and was truncated to "${validated}"\n`
    );
  }

  const validPattern = /^[a-z0-9_-]+$/;
  if (!validPattern.test(validated)) {
    process.stderr.write(
      `Warning: slug "${validated}" contains characters not allowed by Zenn ` +
        `(only a-z, 0-9, hyphens, and underscores are permitted)\n`
    );
  }

  if (validated.length < 12) {
    process.stderr.write(
      `Warning: slug "${validated}" is shorter than the Zenn minimum of 12 characters\n`
    );
  }

  return validated;
}

/**
 * Clones the Zenn-linked repository, writes article files to articles/{slug}.md,
 * commits all files in a single commit, and pushes.
 *
 * The PAT is embedded in the clone/push URL but is never written to stdout/stderr.
 */
export async function pushToZenn(articles: ZennArticle[]): Promise<void> {
  const pat = process.env.ZENN_REPO_PAT;
  const repo = process.env.ZENN_REPO;

  if (!pat) {
    process.stderr.write(
      "Error: ZENN_REPO_PAT environment variable is not set.\n"
    );
    process.exit(1);
  }
  if (!repo) {
    process.stderr.write(
      "Error: ZENN_REPO environment variable is not set.\n"
    );
    process.exit(1);
  }

  if (articles.length === 0) {
    console.log("No articles to push to Zenn.");
    return;
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "zenn-push-"));

  try {
    // Clone the repository using the PAT.
    // stdio: 'pipe' prevents the URL (containing the PAT) from being printed.
    console.log(`Cloning ${repo} into temporary directory...`);
    execSync(
      `git clone --depth 1 https://${pat}@github.com/${repo}.git "${tmpDir}"`,
      { stdio: "pipe" }
    );

    // Replace the remote URL with one that does NOT contain the PAT so that
    // any subsequent logged git commands are safe.
    execSync(
      `git remote set-url origin https://github.com/${repo}.git`,
      { cwd: tmpDir, stdio: "pipe" }
    );

    // Configure the committer identity.
    execSync('git config user.name "github-actions[bot]"', { cwd: tmpDir });
    execSync(
      'git config user.email "github-actions[bot]@users.noreply.github.com"',
      { cwd: tmpDir }
    );

    // Ensure the articles/ directory exists.
    const articlesDir = path.join(tmpDir, "articles");
    if (!fs.existsSync(articlesDir)) {
      fs.mkdirSync(articlesDir, { recursive: true });
    }

    // Write all article files and collect validated slugs.
    const processedSlugs: string[] = [];
    for (const article of articles) {
      const slug = validateSlug(article.slug);
      const filePath = path.join(articlesDir, `${slug}.md`);
      fs.writeFileSync(filePath, article.markdown, "utf-8");
      processedSlugs.push(slug);
      console.log(`  Wrote articles/${slug}.md`);
    }

    // Stage all article files in one go.
    execSync("git add articles/", { cwd: tmpDir });

    // Check whether there are actually any staged changes.
    let hasChanges: boolean;
    try {
      execSync("git diff --cached --exit-code", { cwd: tmpDir, stdio: "pipe" });
      hasChanges = false;
    } catch {
      hasChanges = true;
    }

    if (!hasChanges) {
      console.log(
        "No changes detected after staging. Articles are already up to date."
      );
      return;
    }

    // Build the commit message.
    const commitMessage =
      processedSlugs.length === 1
        ? `feat: crosspost ${processedSlugs[0]} from auto-blog`
        : `feat: crosspost ${processedSlugs.join(", ")} from auto-blog`;

    execSync(`git commit -m "${commitMessage}"`, { cwd: tmpDir });
    console.log(`Committed: ${commitMessage}`);

    // Push using the PAT URL; stdio: 'pipe' hides the URL from logs.
    execSync(
      `git push https://${pat}@github.com/${repo}.git HEAD:main`,
      { cwd: tmpDir, stdio: "pipe" }
    );

    console.log(
      `Successfully pushed ${processedSlugs.length} article(s) to ${repo}.`
    );
  } finally {
    // Always clean up the temporary directory.
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (err) {
      process.stderr.write(
        `Warning: failed to remove temporary directory "${tmpDir}": ${(err as Error).message}\n`
      );
    }
  }
}
