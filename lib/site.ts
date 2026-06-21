/**
 * サイト運営者のプロフィールとSNSリンクの設定。
 *
 * ここの値はすべて運営者が自由に書き換えてよい。フッター（app/layout.tsx）が参照する。
 * TODO(運営者): 下記の `name` / `bio` / 各SNSの `href` を実際の値に差し替えること。
 *   - name / bio       : 表示名・自己紹介文（現状はプレースホルダ）
 *   - socialLinks.href : 各SNSアカウントの実URL（現状は your-handle のプレースホルダ）
 */

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
  name: "yuki",
  /** TODO(運営者): 実際の自己紹介文に差し替え */
  bio: "介護の現場で人と向き合った経験と、エンジニアとしてのものづくりを掛け合わせて活動しています。「CAREGIVER × ENGINEER」をテーマに、技術と人の温かさを橋渡しする試みや、日々の学びをこのブログに綴ります。",
  /** プロフィールアイコン（public/images/profile.jpg） */
  avatar: "/images/profile.jpg",
};

export const socialLinks: SocialLink[] = [
  {
    name: "X (Twitter)",
    // TODO(運営者): 実際のXアカウントURLに差し替え
    href: "https://x.com/your-handle",
    icon: "/images/x-icon.png",
  },
  {
    name: "YouTube",
    // TODO(運営者): 実際のYouTubeチャンネルURLに差し替え
    href: "https://youtube.com/@your-handle",
    icon: "/images/youtube-icon.png",
  },
];
