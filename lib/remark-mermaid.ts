import type { Code, Root } from "mdast";
import type { MdxJsxFlowElement } from "mdast-util-mdx-jsx";
import { visit } from "unist-util-visit";

/**
 * ```mermaid``` コードブロックを <Mermaid chart="..." /> に変換する。
 * rehype-pretty-codeはhast変換後にpre>codeをシンタックスハイライトするため、
 * remark段階（mdast）でmermaidブロックだけ先に専用コンポーネントへ差し替えて素通りさせる。
 */
export function remarkMermaid() {
  return (tree: Root) => {
    visit(tree, "code", (node: Code, index, parent) => {
      if (node.lang !== "mermaid" || !parent || index === undefined) return;

      const mermaidElement: MdxJsxFlowElement = {
        type: "mdxJsxFlowElement",
        name: "Mermaid",
        attributes: [
          {
            type: "mdxJsxAttribute",
            name: "chart",
            value: node.value,
          },
        ],
        children: [],
      };

      parent.children[index] = mermaidElement;
    });
  };
}
