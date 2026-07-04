import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";

/**
 * Returns the list of changed MDX article paths that are published.
 * Paths are relative to the repository root (e.g., "content/blog/2025-01-01-slug/index.mdx").
 */
export function detectChanges(before?: string, after?: string): string[] {
  let diffRange: string;

  if (before && after) {
    diffRange = `${before} ${after}`;
  } else {
    const envBefore = process.env.GITHUB_BEFORE;
    const envAfter = process.env.GITHUB_SHA;
    if (envBefore && envAfter) {
      diffRange = `${envBefore} ${envAfter}`;
    } else {
      // Local fallback: compare HEAD~1 to HEAD
      diffRange = "HEAD~1 HEAD";
    }
  }

  let output: string;
  try {
    output = execSync(`git diff --name-only ${diffRange}`, {
      encoding: "utf-8",
    }).trim();
  } catch (err) {
    console.error(`Failed to run git diff: ${(err as Error).message}`);
    process.exit(1);
  }

  if (!output) {
    return [];
  }

  const changedFiles = output.split("\n").map((f) => f.trim()).filter(Boolean);

  // Filter for content/blog/*/index.mdx pattern
  const mdxPattern = /^content\/blog\/[^/]+\/index\.mdx$/;
  const mdxFiles = changedFiles.filter((f) => mdxPattern.test(f));

  // Filter for published: true
  const repoRoot = path.resolve(__dirname, "../..");
  const publishedFiles = mdxFiles.filter((f) => {
    const fullPath = path.join(repoRoot, f);
    if (!fs.existsSync(fullPath)) {
      // File was deleted or not present — skip
      return false;
    }
    try {
      const raw = fs.readFileSync(fullPath, "utf-8");
      const { data } = matter(raw);
      return data.published === true;
    } catch {
      return false;
    }
  });

  return publishedFiles;
}

// When run directly as a script
if (require.main === module) {
  const before = process.argv[2];
  const after = process.argv[3];
  const files = detectChanges(before, after);
  files.forEach((f) => console.log(f));
}
