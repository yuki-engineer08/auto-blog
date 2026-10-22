import * as runtime from "react/jsx-runtime";
import type { ComponentType } from "react";
import { Mermaid } from "@/components/mermaid";
import { RelatedPostCard } from "@/components/related-post-card";
import { ZoomableImage } from "@/components/zoomable-image";

type MdxContentProps = {
  code: string;
};

type MdxModule = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ComponentType<{ components?: Record<string, ComponentType<any>> }>;
};

// remarkMermaid（lib/remark-mermaid.ts）が ```mermaid``` ブロックをこの名前で参照する
// RelatedPostCardはMDX本文中に `<RelatedPostCard slug="..." />` と書くと解決される
// `img` を差し替えることで、本文中の画像はすべてクリックで拡大できる
const mdxComponents = { Mermaid, RelatedPostCard, img: ZoomableImage };

/**
 * Veliteが生成したMDXコンパイル済みコード（関数本体の文字列）を
 * サーバーコンポーネント上で実行し、Reactコンポーネントとして描画する。
 */
export function MdxContent({ code }: MdxContentProps) {
  const fn = new Function(code);
  const mod = fn(runtime) as MdxModule;
  const Content = mod.default;
  return <Content components={mdxComponents} />;
}
