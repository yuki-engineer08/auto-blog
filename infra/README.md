# infra: GitHub Actions用 OIDC + IAM 設定（Terraform）

このディレクトリは、GitHub ActionsがS3バケットへの同期とCloudFrontディストリビューションのキャッシュ無効化を行うために必要な、AWS側のIAMリソース（OIDCプロバイダ、IAMロール、権限ポリシー）をTerraformで管理する。

**S3バケット本体・CloudFrontディストリビューション本体は対象外。** これらは事前に手動作成済みであることを前提とする。このTerraformコードはそれらの既存リソースへの最小権限アクセスを許可するIAMロールのみを作成する。

## 前提条件

- Terraform CLI（1.5.0以上）がインストールされていること
- AWS CLIの認証情報（管理者権限を持つIAMユーザー/ロール）がローカルにセットアップされていること（`aws configure` 済み、もしくは環境変数 `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` 等が設定済み）
  - これはterraform applyを実行する作業者本人の認証情報であり、GitHub Actionsとは無関係
- デプロイ対象のS3バケット名・ARN、CloudFrontディストリビューションID・ARNを事前に把握していること
- このリポジトリのGitHub Organization名（またはユーザー名）とリポジトリ名を把握していること

## 手順

### 1. 既存のGitHub OIDCプロバイダの有無を確認する

同一AWSアカウント内で既に他のリポジトリ用にGitHub Actions用のOIDCプロバイダ（`https://token.actions.githubusercontent.com`）を作成済みの場合、`aws_iam_openid_connect_provider` リソースを再作成しようとすると重複エラーになる。

```bash
aws iam list-open-id-connect-providers
```

既に存在する場合は `infra/main.tf` 内の `aws_iam_openid_connect_provider "github_actions"` リソース定義を削除し、代わりに以下のような `data` ソースで既存のプロバイダを参照するように書き換えること。

```hcl
data "aws_iam_openid_connect_provider" "github_actions" {
  url = "https://token.actions.githubusercontent.com"
}
```

その場合、`main.tf` 内の `aws_iam_openid_connect_provider.github_actions.arn` への参照もすべて `data.aws_iam_openid_connect_provider.github_actions.arn` に置き換える必要がある。

### 2. thumbprintの確認（必要な場合のみ）

利用しているAWS providerのバージョンによっては、GitHub OIDCプロバイダ作成時にthumbprintを自動取得する。手動指定が必要なバージョンを使う場合は、AWS公式ドキュメント（IAM OIDC ID provider のページ）に記載の最新のthumbprint値を確認し、`infra/variables.tf` の `github_oidc_thumbprint` のデフォルト値、または `terraform.tfvars` で上書きすること。thumbprintは将来変更される可能性があるため、apply前に必ず最新値を確認すること。

### 3. `terraform.tfvars` を作成する

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars
```

`terraform.tfvars` を編集し、以下の値を実際の値に置き換える。このファイルは `.gitignore` で除外されており、リポジトリにはコミットされない。

| 変数名 | 説明 |
|---|---|
| `github_org` | GitHub Organization名またはユーザー名 |
| `github_repo` | リポジトリ名 |
| `github_branch` | 通常は `main` のまま |
| `s3_bucket_name` | デプロイ対象のS3バケット名 |
| `s3_bucket_arn` | デプロイ対象のS3バケットのARN（例: `arn:aws:s3:::my-blog-bucket`） |
| `cloudfront_distribution_id` | デプロイ対象のCloudFrontディストリビューションID |
| `cloudfront_distribution_arn` | デプロイ対象のCloudFrontディストリビューションのARN（例: `arn:aws:cloudfront::123456789012:distribution/E1234567890ABC`） |

### 4. Terraformの初期化・適用

```bash
cd infra
terraform init
terraform plan
terraform apply
```

`apply` 完了後、以下のoutputが表示される。

- `github_actions_role_arn`: GitHub Actionsが引き受けるIAMロールのARN
- `github_oidc_provider_arn`: 作成（または参照）したOIDCプロバイダのARN

### 5. GitHub Secretsの設定

リポジトリの **Settings > Secrets and variables > Actions** で、以下のSecretsを設定する。

| Secret名 | 値 |
|---|---|
| `AWS_ROLE_ARN` | 上記outputの `github_actions_role_arn` の値 |
| `AWS_REGION` | デプロイ対象リソースのAWSリージョン（例: `ap-northeast-1`） |
| `AWS_S3_BUCKET_NAME` | デプロイ対象のS3バケット名 |
| `AWS_CLOUDFRONT_DISTRIBUTION_ID` | デプロイ対象のCloudFrontディストリビューションID |

**静的なAWS Access Key ID / Secret Access Keyは一切登録しない。** ワークフローはOIDC経由でIAMロールを引き受ける方式（`aws-actions/configure-aws-credentials` の `role-to-assume`）のみを使用する。

### 6. 動作確認

`main` ブランチに変更をpushし、GitHub Actionsの実行結果（Actionsタブ）でワークフローが起動し、build → deploy（OIDC認証 → S3同期 → CloudFrontキャッシュ無効化）の各ステップが成功することを確認する。

ビルドが失敗するような変更（例: 構文エラーを含むコードや、ビルド時バリデーションに引っかかるフロントマター）をpushした場合、`deploy` ジョブは `build` ジョブに `needs: build` で依存しているため実行されず、ワークフロー全体が失敗として記録されることを確認する。

### 7. 最小権限の検証（任意・手動）

IAMロールの権限が対象リソース以外にアクセスできないことを確認する場合、検証用に対象外のS3バケット・CloudFrontディストリビューションを用意し、ロールを引き受けた状態でそれらへの操作（書き込み・削除・キャッシュ無効化）がAccessDenied等のエラーで拒否されることを手動で確認する。

## リソースの削除

このIAMロール・ポリシー・（プロバイダを自分で作成した場合は）OIDCプロバイダを削除する場合は以下を実行する。S3バケット・CloudFrontディストリビューション本体はこのTerraformコードの管理対象外であり、削除されない。

```bash
cd infra
terraform destroy
```
