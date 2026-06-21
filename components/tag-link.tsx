import Link from "next/link";

type TagLinkProps = {
  tag: string;
  className?: string;
};

/**
 * タグをCLIのフラグ風（`[tag]`）に表示するリンク。
 */
export function TagLink({ tag, className = "" }: TagLinkProps) {
  return (
    <Link
      href={`/tags/${tag}`}
      className={`font-mono tracking-wide text-signal transition hover:text-flag ${className}`}
    >
      [{tag}]
    </Link>
  );
}
