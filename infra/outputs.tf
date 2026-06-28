output "github_actions_role_arn" {
  description = "GitHub ActionsワークフローがOIDCで引き受けるIAMロールのARN（GitHub Secretsの AWS_ROLE_ARN に設定する）"
  value       = aws_iam_role.github_actions_deploy.arn
}

output "github_oidc_provider_arn" {
  description = "作成したGitHub用OIDCプロバイダのARN"
  value       = aws_iam_openid_connect_provider.github_actions.arn
}

output "cloudfront_function_arn" {
  description = "クリーンURL書き換え用CloudFront FunctionのARN（DefaultCacheBehaviorへの関連付けに使用）"
  value       = aws_cloudfront_function.url_rewrite.arn
}
