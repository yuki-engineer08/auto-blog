/**
 * Dry-run script for crosspost pipeline E2E verification.
 *
 * Detects changed published MDX files, converts them, and prints what
 * would be sent to Qiita and Zenn — without calling any external API.
 *
 * Usage:
 *   npm run crosspost:dry-run                  # HEAD~1..HEAD の差分を対象
 *   npm run crosspost:dry-run -- abc123 def456 # 指定 SHA の差分を対象
 */

import * as fs from "fs";
import * as path from "path";
import { detectChanges } from "./detect-changes";
import { convertMdx, extractSlug } from "./convert-mdx";
import { buildQiitaPayload, buildZennMarkdown } from "./build-frontmatter";

function main(): void {
  const before = process.argv[2];
  const after = process.argv[3];

  const changedFiles = detectChanges(before, after);

  if (changedFiles.length === 0) {
    console.log(
      "クロスポスト対象の記事はありません（前回コミットと差分なし）"
    );
    return;
  }

  console.log(`クロスポスト対象: ${changedFiles.length} 件\n`);

  const repoRoot = path.resolve(__dirname, "../..");

  for (const mdxPath of changedFiles) {
    const fullPath = path.join(repoRoot, mdxPath);

    let raw: string;
    try {
      raw = fs.readFileSync(fullPath, "utf-8");
    } catch (err) {
      process.stderr.write(
        `ファイル読み込み失敗 ${fullPath}: ${(err as Error).message}\n`
      );
      continue;
    }

    const { frontmatter, body } = convertMdx(raw, mdxPath);
    const slug = extractSlug(mdxPath);
    const qiitaPayload = buildQiitaPayload(frontmatter, body, slug);
    const zennMarkdown = buildZennMarkdown(frontmatter, body);

    const hasQiitaId = !!frontmatter.qiita_id;
    const hasCrosspostLink =
      /この記事は筆者のブログからの転載です/.test(qiitaPayload.body);

    const separator = "─".repeat(60);
    console.log(separator);
    console.log(`slug:   ${slug}`);
    console.log(
      `種別:   ${
        hasQiitaId
          ? `更新 (qiita_id: ${frontmatter.qiita_id as string})`
          : "新規投稿"
      }`
    );

    console.log("\n[Qiita payload]");
    console.log(`  title:   ${qiitaPayload.title}`);
    console.log(
      `  tags:    ${qiitaPayload.tags.map((t) => t.name).join(", ") || "(なし)"}`
    );
    console.log(`  private: ${qiitaPayload.private}`);
    console.log(
      `  body (先頭100文字):\n    ${qiitaPayload.body
        .slice(0, 100)
        .replace(/\n/g, "\n    ")}`
    );
    console.log(`  転載リンク含まれているか: ${hasCrosspostLink ? "YES" : "NO"}`);

    console.log("\n[Zenn markdown (先頭200文字)]");
    console.log(
      `  ${zennMarkdown.slice(0, 200).replace(/\n/g, "\n  ")}`
    );

    console.log();
  }

  console.log("─".repeat(60));
  console.log("ドライラン完了（API呼び出しは行われていません）");
}

try {
  main();
} catch (err: unknown) {
  process.stderr.write(`予期しないエラー: ${(err as Error).message}\n`);
  process.exit(1);
}
