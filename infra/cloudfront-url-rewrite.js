// CloudFront Function (viewer-request) — クリーンURL対応
//
// 目的:
//   Next.js の `output: "export"` は記事ページを `blog/<slug>.html` のように
//   拡張子つきで書き出すが、サイト内リンクは拡張子なし(`/blog/<slug>`)で生成される。
//   S3 + CloudFront はそのままでは拡張子なしパスを解決できず 403 になる。
//   この関数で viewer-request 時にURIを書き換え、クリーンURLを `.html` / `index.html`
//   に対応付ける。
//
// 対応付け:
//   /                         -> /index.html
//   /blog/2026-06-21-foo      -> /blog/2026-06-21-foo.html
//   /blog/2026-06-21-foo/     -> /blog/2026-06-21-foo.html（末尾スラッシュも許容）
//   /tags                     -> /tags.html
//   /tags/nextjs              -> /tags/nextjs.html
//   /page/2                   -> /page/2.html
//   /tags/nextjs/page/2       -> /tags/nextjs/page/2.html
//   /static/thumb-ab12.png    -> (末尾セグメントにドットあり=変更しない)
//   /images/header.jpg        -> (同上)
//   /favicon.ico              -> (同上)
//
// 注意: Next.js (`trailingSlash` 未設定 = false) は記事ページ等を
//   `blog/<slug>.html` として書き出す（`blog/<slug>/index.html` ではない）。
//   そのため末尾スラッシュ付きURIを安易に `+ "index.html"` すると
//   実在しないキーになり S3 が 403 (AccessDenied) を返す。
//   ルート "/" 以外の末尾スラッシュは取り除いてから通常の解決にかける。
//
// ランタイム: cloudfront-js-2.0（1.0でも動くよう ES5 構文に限定）
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri === "/") {
    request.uri = "/index.html";
    return request;
  }

  // ルート以外の末尾スラッシュは除去して通常のパスとして扱う
  if (uri.charAt(uri.length - 1) === "/") {
    uri = uri.substring(0, uri.length - 1);
  }

  // パス末尾セグメントに拡張子(ドット)が無ければ .html を補う。
  // ドットがある場合は静的アセット等とみなしてそのまま通す。
  var lastSegment = uri.substring(uri.lastIndexOf("/") + 1);
  if (lastSegment.indexOf(".") === -1) {
    uri = uri + ".html";
  }

  request.uri = uri;
  return request;
}
