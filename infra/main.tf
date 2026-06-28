terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ---------------------------------------------------------------------------
# GitHub Actions用のOIDCプロバイダ
#
# 既に同一AWSアカウント内にGitHub用のOIDCプロバイダ
# (https://token.actions.githubusercontent.com) が作成済みの場合は、
# 重複作成エラーになるため、このリソース定義を削除し、
# data "aws_iam_openid_connect_provider" で既存プロバイダを参照すること。
# ---------------------------------------------------------------------------
resource "aws_iam_openid_connect_provider" "github_actions" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com",
  ]

  thumbprint_list = var.github_oidc_thumbprint
}

# ---------------------------------------------------------------------------
# IAMロール: GitHub ActionsのOIDCトークンを信頼し、
# 「このリポジトリ」かつ「mainブランチからのpush（ref:refs/heads/main）」
# のワークフロー実行からのみ引き受けを許可する
# ---------------------------------------------------------------------------
data "aws_iam_policy_document" "github_actions_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github_actions.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_org}/${var.github_repo}:ref:refs/heads/${var.github_branch}"]
    }
  }
}

resource "aws_iam_role" "github_actions_deploy" {
  name               = var.role_name
  assume_role_policy = data.aws_iam_policy_document.github_actions_trust.json
}

# ---------------------------------------------------------------------------
# 権限ポリシー: 対象のS3バケットへの同期操作と、
# 対象のCloudFrontディストリビューションへのキャッシュ無効化操作のみを許可する。
# Resourceはワイルドカードを使わず、対象リソースのARNを明示的に指定する。
# ---------------------------------------------------------------------------
data "aws_iam_policy_document" "github_actions_deploy" {
  statement {
    sid    = "S3SyncBucketLevel"
    effect = "Allow"
    actions = [
      "s3:ListBucket",
      "s3:GetBucketLocation",
    ]
    resources = [
      var.s3_bucket_arn,
    ]
  }

  statement {
    sid    = "S3SyncObjectLevel"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
    ]
    resources = [
      "${var.s3_bucket_arn}/*",
    ]
  }

  statement {
    sid    = "CloudFrontCacheInvalidation"
    effect = "Allow"
    actions = [
      "cloudfront:CreateInvalidation",
      "cloudfront:GetInvalidation",
      "cloudfront:ListInvalidations",
    ]
    resources = [
      var.cloudfront_distribution_arn,
    ]
  }
}

resource "aws_iam_role_policy" "github_actions_deploy" {
  name   = var.policy_name
  role   = aws_iam_role.github_actions_deploy.id
  policy = data.aws_iam_policy_document.github_actions_deploy.json
}

# ---------------------------------------------------------------------------
# CloudFront Function: クリーンURL書き換え（viewer-request）
#
# コード本体は cloudfront-url-rewrite.js を参照。CloudFrontディストリビューション
# 自体はこのTerraformの管理外（既存・手動作成済み）のため、DefaultCacheBehavior
# への関連付けはAWS CLI/コンソールで別途行う必要がある。
# ---------------------------------------------------------------------------
resource "aws_cloudfront_function" "url_rewrite" {
  name    = "blog-clean-url-rewrite"
  runtime = "cloudfront-js-2.0"
  comment = "クリーンURL(拡張子なしパス)をS3上の.htmlオブジェクトに解決する"
  publish = true
  code    = file("${path.module}/cloudfront-url-rewrite.js")
}
