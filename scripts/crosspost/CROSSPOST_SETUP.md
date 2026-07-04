# クロスポスト機能セットアップガイド

## 必要なGitHub SecretsとVariables

### Secrets（Settings > Secrets and variables > Actions > Secrets）
| 名前 | 説明 | 例 |
|---|---|---|
| `QIITA_ACCESS_TOKEN` | Qiitaの個人アクセストークン | `xxxx...` |
| `ZENN_REPO_PAT` | Zenn連携リポジトリへの書き込み権限を持つGitHub PAT | `ghp_xxxx...` |
| `SITE_BASE_URL` | ブログのCloudFrontドメイン（転載リンク・画像URLに使用） | `https://xxxx.cloudfront.net` |

### Variables（Settings > Secrets and variables > Actions > Variables）
| 名前 | 説明 | 例 |
|---|---|---|
| `ZENN_REPO` | Zenn連携リポジトリ名（`owner/repo` 形式） | `yuki-engineer08/zenn-articles` |

## Zenn連携リポジトリのセットアップ

1. GitHubに新しいリポジトリを作成する（例: `zenn-articles`）
2. Zennのダッシュボード → GitHub連携 → 上記リポジトリを選択
3. `ZENN_REPO_PAT` として使うPATを発行する（スコープ: `repo` のみで可）
4. auto-blogリポジトリのSecretsに上記PATを登録する

## Qiitaアクセストークンの取得

1. Qiitaにログイン → 設定 → アプリケーション → 個人用アクセストークンを発行
2. スコープ: `read_qiita` + `write_qiita` を選択
3. auto-blogリポジトリのSecretsに登録する（名前: `QIITA_ACCESS_TOKEN`）

## 動作確認（ドライラン）

```bash
# 直近のコミットの変更記事を確認（API呼び出しなし）
npm run crosspost:dry-run

# 特定コミット間の変更記事を確認
npm run crosspost:dry-run -- <before_sha> <after_sha>
```

## 要決定事項（確定後にこのファイルを更新してください）

- [ ] `SITE_BASE_URL`: 実際のCloudFrontドメイン
- [ ] `ZENN_REPO`: 実際のZenn連携リポジトリ名
- [ ] Zennのfrontmatter `emoji` と `type` のデフォルト値（現在: `📝` / `tech`）
- [ ] エラー通知の追加チャンネル（Slack等）の要否
