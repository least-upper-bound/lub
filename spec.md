# LUB 仕様書

> **作成背景**: `~/project/rag`（WatchKarte / Hono + Cloudflare Workers + Groq API）を参考に、2 つの概念を入力すると LLM が概念的な共通祖先（LUB / LCS / LCA）を返す最小 MVP としたもの。
> このドキュメントは grill-me プロセスでユーザーと合意した **Single Source of Truth** とする。

## 1. 製品概要

**製品名**: LUB

**コンセプト**: 2 つの概念を入力すると、それらが属するより上位の概念（Least Upper Bound / Least Common Subsumer / Lowest Common Ancestor）を 1 語で提示する Web サービス。

**ターゲットユーザー**:

- 概念間の関係性や抽象カテゴリを素早く知りたい人
- 発想のきっかけ・分類遊びを楽しみたい人

**価値提案**:

- 専門知識やオントロジー構築を意識せず、直感的な入力だけで抽象概念を得られる
- 結果には理由が添えられ、なぜその概念が導かれたかが分かる

## 2. MVP スコープ

### 2.1 採択（MVP に含める）

- **Hono + Cloudflare Workers で動作する LUB API** (`POST /lub`)
- **Hono JSX で実装した単一画面 UI** (`GET /`)
  - 概念 A / 概念 B の 2 入力フォーム
  - 結果カード（concept / reason / confidence）
  - 例示ペアチップ 4〜6 組
- **`~/project/rag` 準拠のライトモード・携帯特化 UI**（max-width 440px 想定）
- **Groq API `llama-3.1-8b-instant` JSON mode による概念生成**
- **入力バリデーション**（必須、1〜100 文字、同一入力許容、多言語対応）
- **エラーハンドリング**（400 / 429 / 500 別メッセージ）

### 2.2 非採用（MVP では入れない）

- RAG パイプライン（Vectorize / D1 / Workers AI 埋め込み）
- ユーザーアカウント・ログイン
- レートリミットのコード実装（WAF/Bot Management に任せる）
- 診断履歴の保存・フィードバック機能
- Cloudflare Workers Analytics / Observability（`wrangler tail` + `console.error` のみ）

## 3. 技術スタック

| レイヤー     | サービス                            |
| ------------ | ----------------------------------- |
| フレームワーク | Hono (Cloudflare Workers アダプタ)   |
| UI           | Hono JSX (`hono/jsx`)               |
| LLM          | Groq API `llama-3.1-8b-instant`     |
| キャッシュ   | なし                                |
| 監視         | `wrangler tail` + `console.error`   |

## 4. ディレクトリ構造

```
.
├── wrangler.toml
├── package.json
├── tsconfig.json
├── .dev.vars.example
├── .env.example
├── README.md
├── spec.md              # 本ドキュメント
├── src/
│   ├── index.ts         # Hono アプリエントリーポイント
│   ├── types.ts         # Cloudflare Workers 環境変数・型定義
│   ├── routes/
│   │   ├── lub.ts       # POST /lub エンドポイント
│   │   └── page.ts      # GET / UI（Hono JSX）
│   ├── components/
│   │   └── LubPage.tsx  # Hono JSX 入力・結果ページ
│   └── services/
│       └── llm.ts       # Groq API 呼び出し
└── tests/
    └── lub.test.ts      # （任意）API スモークテスト
```

## 5. grill-me 決定事項

| 項目                | 決定内容                                                                 |
| ------------------- | ------------------------------------------------------------------------ |
| アーキテクチャ      | `~/project/rag` から RAG 部分を除外し、Hono + Cloudflare Workers + Hono JSX + Groq API の最小構成 |
| 製品名              | LUB                                                                      |
| UI 実装方式         | Hono JSX。`GET /` でフォーム + 結果表示の単一ページ                     |
| UI ブランド         | `~/project/rag` 風ライトモード・携帯特化                                |
| LLM プロバイダー    | Groq `llama-3.1-8b-instant` JSON mode                                    |
| 出力形式            | `{ concept: string, reason: string, confidence: number }`               |
| 自信度              | 0.0 〜 1.0 の小数。0.7 未満は UI で警告注釈を表示                       |
| エンドポイント      | `POST /lub`                                                              |
| 入力バリデーション  | 両方必須、1〜100 文字、同一入力許容、言語は問わず受け入れる             |
| 例示チップ          | 4〜6 組の概念ペアを表示。タップで両欄に自動補完                          |
| エラーメッセージ    | 400 / 429 / 500 別にメッセージを分ける                                  |
| レート制限・認証    | コード側では実装せず、Cloudflare WAF/Bot Management に任せる。認証なし  |
| キャッシュ          | なし                                                                     |
| 監視                | `wrangler tail` + `console.error` のみ                                  |

## 6. API 仕様

### 6.1 エンドポイント

- `POST /lub`

### 6.2 リクエスト

```json
{
  "conceptA": "犬",
  "conceptB": "猫"
}
```

### 6.3 成功レスポンス（200）

```json
{
  "concept": "動物",
  "reason": "両方とも生物界における動物というカテゴリに属する。",
  "confidence": 0.95
}
```

### 6.4 バリデーションエラーレスポンス（400）

```json
{
  "error": "概念 A と概念 B の両方を入力してください。"
}
```

### 6.5 レートリミットレスポンス（429）

```json
{
  "error": "しばらく経ってからお試しください。"
}
```

### 6.6 サーバーエラーレスポンス（500）

```json
{
  "error": "処理中にエラーが発生しました。"
}
```

## 7. UI 仕様

### 7.1 ページ構成

`GET /` で返す Hono JSX ページ。

### 7.2 レイアウト

- ヘッダー: 製品名「LUB」+ 一言サブタイトル（例: 「2 つの概念の共通祖先を探す」）
- メイン:
  - 概念 A 入力欄
  - 概念 B 入力欄
  - 送信ボタン
  - 結果エリア（concept / reason / confidence）
- 例示チップ: 入力欄下に 4〜6 組のペアをチップ表示
- フッター: 免責事項（「LLM による推論結果です。正確な分類ではありません」など）

### 7.3 スタイル

- ライトモード（白背景 + 紺/グレーアクセント）
- 携帯特化、中央寄せ、max-width 440px
- `~/project/rag` の Hono JSX スタイルを参考に、`<style>` タグまたは Tailwind CDN で実装

### 7.4 例示ペアチップ

- `犬` / `猫` → `動物`
- `看護師` / `飛行機` → `産業革命`
- `おにぎり` / `ディズニーランド` → `娯楽`
- `BTS(비티에스)` / `サンタフェ研究所` → `組織`

タップすると conceptA / conceptB にそれぞれ設定され、即座に送信できる。

## 8. LLM パイプライン

1. リクエスト `conceptA` / `conceptB` を受け取る
2. バリデーションを実行
3. Groq `llama-3.1-8b-instant` を JSON mode で呼び出す
4. レスポンスから `{ concept, reason, confidence }` を抽出
5. 型ガードを通過したらクライアントに返す
6. confidence < 0.7 の場合、結果は表示するが警告注釈を付ける

### 8.1 システムプロンプト（案）

```
You are a conceptual abstraction engine.
Given two concepts, return the single best higher-level concept that serves as their
Least Upper Bound / Least Common Subsumer / Lowest Common Ancestor.

Rules:
- The answer does not need to be a dictionary taxonomic category. Contextual or emergent abstractions are allowed.
- Output must be in Japanese if inputs are mainly Japanese, otherwise match the dominant language.
- `concept` must be a single concise term or short phrase.
- `reason` must be one sentence explaining why this concept subsumes both inputs.
- `confidence` must be a number between 0.0 and 1.0 representing how strongly the concept fits.

Respond with valid JSON only, using this schema:
{"concept": string, "reason": string, "confidence": number}
```

### 8.2 ユーザープロンプト（案）

```
Concept A: {conceptA}
Concept B: {conceptB}
```

## 9. 環境変数

### 9.1 ローカル開発（`.dev.vars`）

```
GROQ_API_KEY=gsk_...
```

### 9.2 本番

```bash
npx wrangler secret put GROQ_API_KEY
```

## 10. セットアップ・デプロイ

```bash
npm install
cp .dev.vars.example .dev.vars
# GROQ_API_KEY を設定
npm run dev      # wrangler dev --remote
curl -s http://127.0.0.1:8787/lub \
  -H 'content-type: application/json' \
  -d '{"conceptA":"犬","conceptB":"猫"}'
```

デプロイ:

```bash
npm run deploy
npx wrangler secret put GROQ_API_KEY
```

## 11. 今後の拡張

- Cloudflare AI Gateway によるレスポンスキャッシュ
- 履歴表示
- 3 つ以上の概念入力への対応
- 概念階層の可視化
