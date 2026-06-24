"use client";

import { useEffect, useId, useRef, useState } from "react";

type MermaidProps = {
  chart: string;
};

/**
 * mermaid.jsはDOM/Canvas APIに依存するためサーバーコンポーネントでは描画できず、
 * クライアント側でマウント後にSVGへレンダリングする。
 */
export function Mermaid({ chart }: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, "-");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    import("mermaid").then(async ({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: {
          primaryColor: "#f6f7f4",
          primaryTextColor: "#1a1d1a",
          primaryBorderColor: "#2f6b4f",
          lineColor: "#5b6359",
          secondaryColor: "#d8ddd4",
          tertiaryColor: "#f6f7f4",
          fontFamily: "inherit",
        },
      });

      try {
        const { svg } = await mermaid.render(`mermaid-${id}`, chart);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "diagram rendering failed");
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) {
    return (
      <pre className="overflow-x-auto rounded-md border border-line bg-paper p-4 text-sm text-flag">
        Mermaid diagram error: {error}
      </pre>
    );
  }

  return <div ref={containerRef} className="not-prose my-6 flex justify-center overflow-x-auto" />;
}
