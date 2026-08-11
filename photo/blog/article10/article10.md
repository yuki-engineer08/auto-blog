# 未翻訳のUnityゲームに、AIエージェントと日本語化MODを自作した話

今回epicgameにて限定で無料配信されていたカードゲーム『Foretales』に日本語対応が無かった。

ゲーム内の説明を見ても、対応言語は英語・仏語・独語・西語・中国語（簡体字/繁体字）まで。日本語は無い。
そこでAIでmodを調べ、試しに導入をしてみるも、バージョンや互換性のせいで思うように動かなかった。
いくら調べても日本語化に成功したという事例もみつからない。

じゃあ作るしかない。

MelonLoaderでゲームにフックを刺し、テキストを横取りして翻訳し、差し戻す。仕組みだけ聞けば単純だ。でも実際にやってみると、文字化け・無限翻訳ループ・IL2CPPの罠と、一筋縄ではいかない問題が次々出てきた。

Claude Codeと二人三脚で潰していった記録を残す。

---

## 全体像

やったことはこの5段階だ。

```
① Dockerで翻訳サーバーを立てる（LibreTranslate）
② MelonLoader + Harmonyでテキストをフックする
③ 文字化け（豆腐□）を直す
④ 意味不明な訳文になるバグを直す
⑤ 翻訳精度を上げるためGoogle翻訳に乗り換える
```

技術構成はこう。

```
ゲーム内テキスト（UnityEngine.UI.Text / TMP_Text）
  ↓ Harmonyでsetterをフック
翻訳キャッシュ（cache.json）を確認
  ↓ キャッシュミスなら
翻訳API（最終的にGoogle翻訳の非公式エンドポイント）
  ↓
翻訳結果をメインスレッドで .text に反映
```

MODはMelonLoader向けのC#（.NET 6）で書いた。土台はでき上がっていたので、今回は「動かない」「文字が壊れる」を一個ずつ潰すフェーズだった。

---

## ① Dockerで翻訳サーバーを立てる

最初の翻訳エンジンにはLibreTranslateを選んだ。無料でセルフホストできるからだ。

Docker未導入のマシンだったので、まずWSL2を有効化するところから始めた。

```powershell
Start-Process wsl.exe -ArgumentList "--install","--no-launch" -Verb RunAs
```

ここで一度詰まった。`wsl --status`を見ても「Virtual Machine Platformを有効にしてください」というエラーが消えない。DISM上は有効化が完了しているのに、反映されていない状態だった。

**再起動したら直った。**

Windowsの機能有効化系はだいたい再起動が必要、という基本を忘れかけていた。

再起動後は一直線だった。

```powershell
winget install -e --id Docker.DockerDesktop
docker run -d --name libretranslate -p 5000:5000 libretranslate/libretranslate
```

Docker Desktopを一度手動起動（初回同意画面はGUI操作なので自動化できない）してから、`docker ps`でLibreTranslateコンテナが立ち上がっていることを確認。

```
curl http://127.0.0.1:5000/translate -X POST -H "Content-Type: application/json" \
  -d '{"q":"Hello","source":"en","target":"ja","format":"text"}'
```

`{"translatedText":"お問い合わせ"}` が返ってきた。"Hello"が「お問い合わせ」になるのは翻訳精度の問題（後述）だが、疎通は成功。ここまでは順調だった。

---

## ② 文字化け（豆腐□）を直す

MODをビルドしてゲームを起動すると、翻訳自体は動いていた。ログにも翻訳結果が出ている。

なのに画面は全部これだった。

```
Foretales□□□□□！
```

日本語の部分が全部、豆腐（□）になる。

原因はすぐには分からなかった。翻訳結果をよく見ると、`cache.json`にはちゃんと`"グラフィック"`のような正しい日本語がUnicodeエスケープで保存されている。翻訳自体は正常。

つまり**データではなくレンダリングの問題**だった。

このゲームは元々、英・仏・独・西・中国語（簡体字/繁体字）にしか対応していない。中国語対応があるので漢字グリフはあるが、ひらがな・カタカナのグリフがフォントに無い。だから翻訳結果をそのまま表示すると、存在しないグリフの代わりに豆腐が出る。

対策は、TextMeshProのグローバルフォールバックフォントに、日本語グリフを含むフォントアセットを追加登録すること。

```csharp
var bundle = AssetBundle.LoadFromFile(bundlePath);
var rawObjects = bundle.LoadAllAssets(); // 非ジェネリック版
foreach (var obj in rawObjects)
{
    var font = obj.TryCast<TMP_FontAsset>();
    if (font == null) continue;
    TMP_Settings.fallbackFontAssets.Add(font);
}
```

使ったフォントアセットバンドルは、XUnity.AutoTranslatorというMOD向け翻訳フレームワークが配布している「Arial Unicode MS SDF」のAssetBundle。ゲームのUnityバージョン（2020.3.31f1）より新しく作られたバンドルは読み込めないリスクがあるため、ゲームのバージョンと同じか古いバージョンでビルドされたものを選んだ。

これでようやく、ひらがな・カタカナが文字として表示されるようになった。

### ハマったポイント：ジェネリックメソッドが実行時に落ちる

最初、素直に`LoadAllAssets<TMP_FontAsset>()`（ジェネリック版）を使ったら、こう落ちた。

```
System.NotSupportedException: Method unstripping failed
   at UnityEngine.AssetBundle.ConvertObjects[T](Il2CppReferenceArray`1 rawObjects)
   at UnityEngine.AssetBundle.LoadAllAssets[T]()
```

IL2CPPは「ゲーム本体が実際に使っている型引数の組み合わせ」でしかジェネリックメソッドをコンパイルしない。今回のゲームは`LoadAllAssets<TMP_FontAsset>()`という組み合わせを一度も呼んでいないので、その実体がバイナリに存在せず、呼び出しようがない。

回避策は、非ジェネリック版`LoadAllAssets()`で`UnityEngine.Object`の配列を取り、`TryCast<T>()`で型を絞り込むこと。`TryCast`はIL2CPPのバイナリを呼ぶのではなく、interopライブラリ側の完全マネージドコードで実装されているので、この制約を受けない。

IL2CPP MODを書くなら覚えておいて損はないパターンだと思う。

---

## ③ 意味不明な訳文になるバグ

文字は表示されるようになった。でも訳文の中身がおかしい。

```
最後の からから からから からから からから からから からから からから！
```

「から」の壁。他にも「彼はでで.」のような、原形をとどめていない文がいくつも出てきた。

`cache.json`を漁って原因が分かった。

```json
"One last job, and our days of stealing apples from the market are behind us!":
  "最後の仕事と、市場からリンゴを盗む私たちの日が私たちの背後にある!",

"最後の仕事と、市場からリンゴを盗む私たちの日が私たちの背後にある!":
  "最後の からから からから ... からから!"
```

**一度翻訳した日本語が、もう一度「未翻訳の原文」として扱われ、翻訳にかけ直されていた。**

日本語を「英語のつもり」で翻訳エンジンに投げれば、当然おかしな結果になる。しかもその壊れた結果がそのままキャッシュに永続化されるので、直らないまま蓄積されていく。

原因はMODの二重翻訳防止ロジックにあった。

```csharp
// 修正前
if (Cache.TryGetValue(original, out var cached))
{
    value = cached;
    return; // KnownTranslatedValues への登録を忘れている
}
```

「自分が出力した訳文を、もう一度原文として拾わないためのガード」が、キャッシュヒット時のパスにだけ抜けていた。非同期翻訳が完了した直後のパスにはちゃんとガードが入っていたので、初回だけ動いて2回目以降のセッションで壊れる、という非対称なバグになっていた。

```csharp
// 修正後
if (Cache.TryGetValue(original, out var cached))
{
    value = cached;
    KnownTranslatedValues[cached] = 0; // これを追加
    return;
}
```

TextMeshProのレイアウト再計算などで`text.text = text.text`のような自己再設定が起きるたびに、この抜け穴を突かれていたと思われる。

1行足りないだけで、遊べないレベルの訳文崩壊が起きる。地味に一番怖いバグだった。

---

## ④ 翻訳精度を上げるためGoogle翻訳に乗り換える

バグを直しても、LibreTranslateの訳文は「ぎりぎり読めるレベル」だった。

DeepLへの乗り換えも検討したが、API利用にはアカウント登録とAPIキー発行が必要。今すぐ試したかったので、キー不要で使える**Google翻訳の非公式Webエンドポイント**に切り替えた。

```csharp
var url = $"https://translate.googleapis.com/translate_a/single" +
          $"?client=gtx&sl={source}&tl={target}&dt=t&q={Uri.EscapeDataString(text)}";
```

これはtranslate.google.comの画面自体が使っているエンドポイントで、APIキーもGoogleアカウントも不要。ただし非公式なので、Google側の都合で予告なくブロック・レート制限される可能性はある。無料と引き換えのリスクとして割り切った。

同じ文章で比較するとこうなる。

```
LibreTranslate: 最後の仕事と、市場からリンゴを盗む私たちの日が私たちの背後にある!
Google翻訳    : 最後の仕事が終わり、市場からリンゴを盗む日々は終わりました。
```

一目瞭然だった。

---

## ⑤ 細かい表示崩れを直す

翻訳精度は劇的に上がった。ただ、まだ2つ気になる崩れが残っていた。

**1つ目**：ゲーム内アイコンのタグがそのまま文字として表示される。

```
5<sprite="card_effects_hints"index=21tint=1>これだけあれば数日は大丈夫ですよ
```

TextMeshProのリッチテキストタグ（`<sprite=...>`のようなアイコン指定）を、地の文と一緒に翻訳エンジンへ投げていたのが原因だ。翻訳エンジンはHTMLタグの意味を知らないので、属性名を勝手に書き換えてしまう（`card_effects_hints` → `card effects hints`のようにアンダースコアが空白になる、など）。ゲーム側は元の文字列と完全一致でアイコンを探すので、書き換えられた時点でアイコンが表示されなくなる。

対策は「翻訳前にタグをプレースホルダーに退避し、翻訳後に元に戻す」という、この手のツールでは定番の手法。

```csharp
// <sprite=...> のようなタグを一時的にプレースホルダーへ
var protectedText = RichTextTagProtector.Protect(original, out var tags);
var translated = await TranslationClient.TranslateAsync(protectedText);
translated = RichTextTagProtector.Restore(translated, tags);
```

**2つ目**：`3〜6`のような範囲表現の「〜」（全角チルダ）が豆腐になる。これはフォントのグリフが単純に無いだけだったので、ASCIIの`~`に置換する処理を足して解決した。「！」「？」も同様に豆腐になっていたので、あわせて対応した。

これで一見解決……したはずだった。

### プレースホルダー自体が化けるという想定外

最初、プレースホルダーには`zqxk0zqxk`のような英数字トークンを使っていた。これがまた新しいバグを生んだ。

```
3zqxk4zqxk 厳しい
```

アイコンと数字がスペース無しで密着するステータス表示（`アイコン+アイコン3アイコン`のような表記）で、翻訳エンジンがプレースホルダーを「意味のある単語」と誤認し、勝手に別の文字列へ「補正」してしまっていた。プレースホルダーで守ったはずのタグが、プレースホルダー自身の見た目のせいで壊れるという、笑えないオチ。

最終的な対策は、プレースホルダーをUnicodeの**私用領域（Private Use Area, U+E000〜）の1文字**に変更すること。

```csharp
private static string Placeholder(int index) =>
    char.ConvertFromUtf32(0xE000 + index);
```

私用領域の文字は、どの言語の翻訳モデルの学習データにも一切登場しない。だから「補正しよう」とする余地そのものが無くなる。

デプロイ前に、危険なパターン（数字への直接隣接、プレースホルダー同士の直接隣接、実際のゲームの表示に近い密着パターン）を実際にGoogle翻訳へ通して検証してから本番投入した。全パターンでプレースホルダーは無傷で生還した。

これでようやく、豆腐も、意味不明な訳文も、タグの化けも無くなった。

---

## 詰まりポイントまとめ

| 問題 | 原因 | 対策 |
|---|---|---|
| WSL2が有効化されない | DISM上は完了しているが未反映 | 再起動する |
| 日本語が豆腐（□）になる | ゲームのフォントにひらがな・カタカナのグリフが無い | TMPのグローバルフォールバックフォントに追加登録 |
| `LoadAllAssets<T>()`が実行時エラー | IL2CPPは未使用のジェネリック実体を呼べない | 非ジェネリック版 + `TryCast<T>()` |
| 訳文が意味不明になる | 訳文が原文として再翻訳されるループ | キャッシュヒット時にも「既に訳文である」ことを記録する |
| `<sprite=...>`タグが壊れる | タグごと翻訳エンジンに投げていた | プレースホルダーに退避してから翻訳 |
| プレースホルダー自体が化ける | 英数字トークンが「単語」と誤認される | Private Use Areaの1文字に変更 |

---

## OSSとして公開した

一通り動くようになったので、GitHubに公開した。

判断に迷ったのは「ゲーム名を出していいのか」という点だった。結論としては、翻訳MODのようなファン制作物で対象ゲーム名を説明目的で挙げること自体は、modコミュニティでは一般的な慣行らしい（いわゆるnominative fair use）。ただし、

- 「公式」「開発元承認」と誤解されないよう、READMEに非公式・非提携である旨を明記する
- ゲーム本体のファイルや、そこから自動生成されるIL2CPP用のinterop DLLはリポジトリに含めない
- 使っているフォントアセット（元をたどれば商用フォントの派生物）も同梱せず、入手先をリンクで案内するだけにする

という形に落ち着いた。ソースコード側も、`MelonGame`属性の1行を書き換えれば別のゲームにも流用できる構成になっているので、「Foretales専用ツール」ではなく「MelonLoader向け翻訳MODフレームワーク」として公開している。

---

## まとめ

今回一番学んだのは、**「動く」と「正しく動く」の間には無数の落とし穴がある**ということだ。

翻訳は動いた。でも文字が表示されない。表示されても意味不明。直しても細部が崩れる。崩れを直したら、直すための仕組み自体が新しい崩れを生む。

一つずつ、実機のログとスクリーンショットを見ながら潰していく。地味な作業だけど、確実に前に進む。

好きなゲームを日本語で遊びたい、という個人的な動機から始まった話だったが、結果的にIL2CPP MODを書く上で汎用的に使える知見がいくつも手に入った。それがこの記事とリポジトリを公開した理由でもある。
