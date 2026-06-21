output "github_actions_role_arn" {
  description = "GitHub ActionsワークフローがOIDCで引き受けるIAMロールのARN（GitHub Secretsの AWS_ROLE_ARN に設定する）"
  value       = aws_iam_role.github_actions_deploy.arn
}

output "github_oidc_provider_arn" {
  description = "作成したGitHub用OIDCプロバイダのARN"
  value       = aws_iam_openid_connect_provider.github_actions.arn
}
