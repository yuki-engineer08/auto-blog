variable "aws_region" {
  description = "デプロイ対象リソースが存在するAWSリージョン"
  type        = string
  default     = "ap-northeast-1"
}

variable "github_org" {
  description = "GitHubのOrganization名（またはユーザー名）"
  type        = string
  default     = "your-github-org"
}

variable "github_repo" {
  description = "このリポジトリ名（Organization/ユーザー名を含まないリポジトリ名のみ）"
  type        = string
  default     = "auto-blog"
}

variable "github_branch" {
  description = "IAMロールの引き受けを許可するブランチ名"
  type        = string
  default     = "main"
}

variable "s3_bucket_name" {
  description = "デプロイ対象のS3バケット名（既存・手動作成済みのバケット）"
  type        = string
  default     = "your-blog-bucket-name"
}

variable "s3_bucket_arn" {
  description = "デプロイ対象のS3バケットのARN（既存・手動作成済みのバケット）"
  type        = string
  default     = "arn:aws:s3:::your-blog-bucket-name"
}

variable "cloudfront_distribution_id" {
  description = "デプロイ対象のCloudFrontディストリビューションID（既存・手動作成済み）"
  type        = string
  default     = "YOUR_CLOUDFRONT_DISTRIBUTION_ID"
}

variable "cloudfront_distribution_arn" {
  description = "デプロイ対象のCloudFrontディストリビューションのARN（既存・手動作成済み）"
  type        = string
  default     = "arn:aws:cloudfront::123456789012:distribution/YOUR_CLOUDFRONT_DISTRIBUTION_ID"
}

variable "github_oidc_thumbprint" {
  description = <<-EOT
    GitHub OIDCプロバイダのTLS証明書のthumbprint（SHA1フィンガープリント）。
    AWS providerのバージョンによっては自動取得されるため未使用になる場合がある。
    手動指定が必要な場合は実行時にAWSドキュメント記載の最新値を確認して指定すること。
  EOT
  type        = list(string)
  default     = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

variable "role_name" {
  description = "GitHub Actionsが引き受けるIAMロール名"
  type        = string
  default     = "github-actions-blog-deploy-role"
}

variable "policy_name" {
  description = "IAMロールにアタッチする権限ポリシー名"
  type        = string
  default     = "github-actions-blog-deploy-policy"
}
