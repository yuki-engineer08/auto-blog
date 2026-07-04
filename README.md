# auto-blog

介護士として働きながら、未経験からAWS資格取得とエンジニア転職を目指して学習する過程を発信する個人技術ブログです。コードは1行も書けない状態から、AIエージェント（Claude Code）と協働しながら設計・実装・インフラ構築までを自分で進めています。

**本番URL: https://d3o7t81m8nyt3g.cloudfront.net**

## 概要

- Markdown/MDXで記事を書くと、静的サイトとしてビルドされ、`main` ブランチへのpushで自動的に本番環境へ反映される個人ブログです。
- 記事執筆だけでなく、サイト自体の機能追加（タグ機能、検索、ページネーション、Mermaid図対応など）もスプリント単位で継続的に開発しています。
- インフラ（S3 / CloudFront）はTerraformでコード管理し、デプロイはGitHub Actions + OIDCで認証情報をリポジトリに置かずに実行しています。
- `published: true` の記事をpushすると、QiitaとZennへも自動クロスポストされます。

## 技術スタック

| 領域 | 技術 |
| --- | --- |
| フレームワーク | Next.js（App Router, `output: "export"` による静的書き出し） |
| コンテンツ管理 | Markdown/MDX + [Velite](https://velite.js.org/)（Zodスキーマでフロントマターをバリデーション） |
| 図表 | Mermaid（記事中のコードブロックから図を自動レンダリング） |
| スタイリング | Tailwind CSS |
| インフラ | Terraform（S3 + CloudFront） |
| CI/CD | GitHub Actions（OIDC認証、静的アサイン不使用 / Qiita・Zenn 自動クロスポスト） |
| 言語 | TypeScript |

## 開発フロー：Planner / Generator / Evaluatorによるスプリント運用

機能要望を直接実装に渡すのではなく、3つの役割を持つAIエージェントに分業させ、`SPEC.md` を仕様とDoD（Definition of Done）の唯一の事実源として開発を進めています。

1. **Planner** (`blog-planner`): 「ブログにタグ機能を追加して」のような数行の要望を受け取り、スプリント単位の仕様（機能要件・タスク分解・DoD）に分解して `SPEC.md` に書き出す。
2. **Generator** (`blog-generator`): `SPEC.md` の1スプリント分を読み、実装する。完了後はDoDに沿って自己評価する。
3. **Evaluator** (`blog-evaluator`): Generatorの自己評価を信頼せず、実際にアプリを操作してDoDを独立に再検証する。

この三段構成により、「仕様が曖昧なまま実装が進む」「実装者の自己評価だけで完了と判断する」というリスクを抑えています。各エージェントの定義は `.claude/agents/` 配下にあります。

## ディレクトリ構成

```
.
├── app/                  # Next.js App Router（ページ・レイアウト・タグ一覧など）
├── components/           # 記事表示用コンポーネント（目次、ページネーション、Mermaid描画など）
├── content/blog/         # 記事本体。1記事1フォルダ（YYYY-MM-DD-slug/index.mdx）+ 同梱画像
├── lib/                  # 記事取得ロジック、site設定、remark/MDXプラグイン
├── infra/                # Terraform（S3 / CloudFront / CloudFront Function）
├── scripts/crosspost/    # Qiita・Zenn クロスポストスクリプト群
├── .github/workflows/    # GitHub Actions（ビルド→S3同期 / Qiita・Zenn クロスポスト）
├── .claude/agents/       # Planner / Generator / Evaluator のエージェント定義
├── .claude/skills/       # 記事執筆など定型作業のスキル定義
├── velite.config.ts      # 記事フロントマターのZodスキーマ・ビルド設定
└── SPEC.md               # スプリント仕様とDoDの唯一の事実源
```

## ローカル開発

```bash
npm install
npm run dev
```

`http://localhost:3000` でブログが起動します。記事は `content/blog/` 配下を自動的に読み込みます（Velite）。

その他のスクリプト:

```bash
npm run build   # 静的書き出し（out/ に出力）
npm run lint     # ESLint
```

## デプロイ

`main` ブランチへのpushをトリガーに、GitHub Actions（`.github/workflows/deploy.yml`）が以下を自動実行します。

1. `npm run build` で静的サイトをビルド
2. OIDCでAWS IAMロールを引き受け（長期的なアクセスキーは保持しない）
3. ビルド出力を S3 バケットへ同期
4. CloudFrontのキャッシュを無効化

インフラ自体（S3バケット、CloudFrontディストリビューション、URL書き換え用CloudFront Function）は `infra/` 配下のTerraformで管理しています。

## 自動クロスポスト（Qiita・Zenn）

`content/blog/**/*.mdx` を変更して `main` にpushすると、GitHub Actions が変更を検知し、`published: true` の記事を Qiita と Zenn に自動投稿（または更新）します。

### 仕組み

1. `git diff` で変更された `.mdx` ファイルを特定し、`published: true` の記事のみを対象にする
2. MDX本文からMermaid・YouTubeEmbedなどのカスタムコンポーネントを除去し、プレーンMarkdownに変換する
3. 画像パスは Velite のビルド成果物（`.velite/posts.json`）を参照して正確な `/static/xxx-hash.png` URLに変換する
4. Qiita: REST API v2 で POST（初回）または PATCH（更新）。発行された `qiita_id` はフロントマターに書き戻してコミットされる（`[skip ci]` 付き）
5. Zenn: Zenn連携リポジトリに `articles/{slug}.md` を push する

### 必要なSecretsとVariables

GitHub リポジトリの Settings → Secrets and variables → Actions で設定します。

| 種別 | 名前 | 内容 |
| --- | --- | --- |
| Secret | `QIITA_ACCESS_TOKEN` | Qiitaのアクセストークン |
| Secret | `ZENN_REPO_PAT` | Zenn連携リポジトリへの書き込み権限を持つ GitHub PAT（fine-grained: Contents Read & Write） |
| Secret | `SITE_BASE_URL` | CloudFrontのURL（記事内画像の絶対パスに使用） |
| Variable | `ZENN_REPO` | Zenn連携リポジトリ名（例: `owner/zenn-articles`） |

### ドライラン

APIを呼ばずに変換結果をプレビューできます。

```bash
npm run build          # Veliteビルドが必要（画像パス解決のため）
npm run crosspost:dry-run               # HEAD~1..HEAD の差分で確認
npm run crosspost:dry-run -- <before_sha> <after_sha>  # SHA指定
```

## 記事の書き方

1. `_TEMPLATE_1.mdx` をコピーし、`content/blog/YYYY-MM-DD-記事スラッグ/index.mdx` として配置する（画像も同じフォルダに同梱）。
2. フロントマター（`title` / `description` / `date` / `tags` / `published`）を記入する。`published: false` の間は一覧・ビルドに出てこない下書き状態。
3. 本文はMarkdown/MDX。画像は `![alt](./画像ファイル名.jpg)` で参照、コードブロックは通常のフェンス記法でシンタックスハイライトされる。
4. 公開時に `published: true` にしてpushすると、CIが自動でビルド・デプロイする。QiitaとZennへのクロスポストも同時に行われる。

Claude Codeから記事を作成・編集する場合は `blog-article` スキルを使うと、上記のルール（配置場所・フロントマター・画像の扱いなど）に沿って執筆を進められます。
