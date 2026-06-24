import * as runtime from "react/jsx-runtime";
import type { ComponentType } from "react";
import { Mermaid } from "@/components/mermaid";

type MdxContentProps = {
  code: string;
};

type MdxModule = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ComponentType<{ components?: Record<string, ComponentType<any>> }>;
};

// remarkMermaid（lib/remark-mermaid.ts）が ```mermaid``` ブロックをこの名前で参照する
const mdxComponents = { Mermaid };

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
