import * as fs from "fs";
import * as path from "path";
import { detectChanges } from "./detect-changes";
import { convertMdx, extractSlug } from "./convert-mdx";
import { buildQiitaPayload, buildZennMarkdown } from "./build-frontmatter";

interface CrosspostResult {
  mdxPath: string;
  slug: string;
  frontmatter: Record<string, unknown>;
  qiita: {
    payload: {
      title: string;
      tags: Array<{ name: string }>;
      private: boolean;
      body: string;
    };
  };
  zenn: {
    markdown: string;
  };
}

function main(): void {
  const before = process.argv[2];
  const after = process.argv[3];

  const changedFiles = detectChanges(before, after);

  if (changedFiles.length === 0) {
    process.stdout.write("[]\n");
    return;
  }

  const repoRoot = path.resolve(__dirname, "../..");
  const results: CrosspostResult[] = [];

  for (const mdxPath of changedFiles) {
    const fullPath = path.join(repoRoot, mdxPath);

    let raw: string;
    try {
      raw = fs.readFileSync(fullPath, "utf-8");
    } catch (err) {
      console.error(`Failed to read ${fullPath}: ${(err as Error).message}`);
      process.exit(1);
    }

    const { frontmatter, body } = convertMdx(raw, mdxPath);
    const slug = extractSlug(mdxPath);

    const qiitaPayload = buildQiitaPayload(frontmatter, body);
    const zennMarkdown = buildZennMarkdown(frontmatter, body);

    results.push({
      mdxPath,
      slug,
      frontmatter,
      qiita: {
        payload: qiitaPayload,
      },
      zenn: {
        markdown: zennMarkdown,
      },
    });
  }

  process.stdout.write(JSON.stringify(results, null, 2) + "\n");
}

main();
