/**
 * サイト運営者のプロフィールとSNSリンクの設定。
 *
 * ここの値はすべて運営者が自由に書き換えてよい。フッター（app/layout.tsx）が参照する。
 * TODO(運営者): 下記の `name` / `bio` / 各SNSの `href` を実際の値に差し替えること。
 *   - name / bio       : 表示名・自己紹介文（現状はプレースホルダ）
 *   - socialLinks.href : 各SNSアカウントの実URL（現状は your-handle のプレースホルダ）
 */

/** Google Analytics 4 測定ID */
export const ga4MeasurementId = "G-LDQ7JL615Z";

/**
 * サイトの公開ベースURL（OGP画像等を絶対URLで出力するために使用）。
 * TODO(運営者): 実際のCloudFront公開ドメイン（またはカスタムドメイン）に差し替えること。
 *   例: "https://d111111abcdef8.cloudfront.net" や "https://blog.example.com"
 */
export const siteUrl = "https://d3o7t81m8nyt3g.cloudfront.net";

/**
 * サイト共通のデフォルトOGP画像（/public からの絶対パス）。
 * サムネイル未設定の記事や、記事一覧・タグページ等の非記事ページで使用する。
 * Sprint4で導入したヘッダーバナー画像（public/images/header.jpg）を流用している。
 * width/height は header.jpg の実寸（1792x592）。
 * TODO(運営者): SNS映えを優先するなら、OGP推奨比率(1.91:1, 例 1200x630)の専用画像を
 *   用意して url/width/height を差し替えるとよい。
 */
export const defaultOgImage = {
  url: "/images/header.jpg",
  width: 1792,
  height: 592,
};

export type SocialLink = {
  /** アクセシビリティ用ラベル兼 alt（例: "X (Twitter)"） */
  name: string;
  /** リンク先URL（外部・新しいタブで開く） */
  href: string;
  /** /public からのアイコン画像パス */
  icon: string;
};

export const siteProfile = {
  /** TODO(運営者): 実際の表示名に差し替え */
  name: "介護士AIエンジニアYuki",
  /** TODO(運営者): 実際の自己紹介文に差し替え */
  bio: "介護の現場で人と向き合った経験と、エンジニアとしてのものづくりを掛け合わせて活動しています。「CAREGIVER × ENGINEER」をテーマに、技術と人の温かさを橋渡しする試みや、日々の学びをこのブログに綴ります。",
  /** プロフィールアイコン（public/images/profile.jpg） */
  avatar: "/images/profile.jpg",
};

export const socialLinks: SocialLink[] = [
  {
    name: "X (Twitter)",
    // TODO(運営者): 実際のXアカウントURLに差し替え
    href: "https://x.com/yuki_engineer08",
    icon: "/images/x-icon.png",
  },
  {
    name: "YouTube",
    // TODO(運営者): 実際のYouTubeチャンネルURLに差し替え
    href: "https://www.youtube.com/@yuki_engineer08",
    icon: "/images/youtube-icon.png",
  },
];
