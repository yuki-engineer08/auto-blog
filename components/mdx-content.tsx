import * as runtime from "react/jsx-runtime";
import type { ComponentType } from "react";

type MdxContentProps = {
  code: string;
};

type MdxModule = {
  default: ComponentType;
};

/**
 * Veliteが生成したMDXコンパイル済みコード（関数本体の文字列）を
 * サーバーコンポーネント上で実行し、Reactコンポーネントとして描画する。
 */
export function MdxContent({ code }: MdxContentProps) {
  const fn = new Function(code);
  const mod = fn(runtime) as MdxModule;
  const Content = mod.default;
  return <Content />;
}
