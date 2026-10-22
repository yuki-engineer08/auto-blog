"use client";

import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";
import { createPortal } from "react-dom";

type ZoomableImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  /** クリック領域（<button>）のクラス。記事トップのように幅いっぱいに広げたいときに上書きする */
  triggerClassName?: string;
};

/**
 * クリックで原寸に近いサイズへ拡大表示できる画像。
 * 記事トップのサムネイルと、MDX本文中の `![alt](./x.png)`（`img` の差し替え）の両方で使う。
 * 拡大表示は <p> の中に置けない要素になるため、開いている間だけ document.body へポータルで描画する。
 * 閉じ方: 背景クリック / ×ボタン / Esc。開いている間は背景のスクロールを止める。
 */
export function ZoomableImage({
  className,
  alt,
  triggerClassName = "inline-block max-w-full align-top",
  ...props
}: ZoomableImageProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const trigger = triggerRef.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={alt ? `${alt}（クリックで拡大）` : "画像を拡大"}
        className={`cursor-zoom-in ${triggerClassName}`}
      >
        <img alt={alt ?? ""} className={className} {...props} />
      </button>
      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={alt || "拡大画像"}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/85 p-4"
          >
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              aria-label="閉じる"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-2xl leading-none text-white transition hover:bg-black/80"
            >
              ×
            </button>
            <img
              src={props.src}
              alt={alt ?? ""}
              className="max-h-[92vh] max-w-[96vw] object-contain"
            />
          </div>,
          document.body,
        )}
    </>
  );
}
