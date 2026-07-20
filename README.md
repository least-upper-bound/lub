# LUB — 2 つの概念の共通祖先を探す

2 つの概念を入力すると、それらが属するより上位の概念（Least Upper Bound / Least Common Subsumer / Lowest Common Ancestor）を 1 語で提示する Web サービスです。

- **製品名**: LUB
- **技術スタック**: Hono + Cloudflare Workers / Hono JSX / Groq API
- **仕様**: [`spec.md`](./spec.md)

## 技術スタック

| レイヤー       | サービス                          |
| -------------- | --------------------------------- |
| フレームワーク | Hono (Cloudflare Workers アダプタ) |
| UI             | Hono JSX (`hono/jsx`)             |
| LLM            | Groq API `llama-3.1-8b-instant`   |
| キャッシュ     | なし                              |
| 監視           | `wrangler tail` + `console.error` |

## エンドポイント

### `GET /`

Hono JSX で実装された単一画面 UI。

### `POST /lub`

**リクエスト**

```json
{
  "conceptA": "犬",
  "conceptB": "猫"
}
```

**成功レスポンス (200)**

```json
{
  "concept": "動物",
  "reason": "両方とも生物界における動物というカテゴリに属する。",
  "confidence": 0.95
}
```

**エラー**

- `400` `{ "error": "概念 A と概念 B の両方を入力してください。" }`
- `429` `{ "error": "しばらく経ってからお試しください。" }`
- `500` `{ "error": "処理中にエラーが発生しました。" }`

### `GET /health`

```json
{ "status": "ok" }
```

## セットアップ

### 1. 依存関係

```bash
npm install
```

### 2. 環境変数

```bash
cp .dev.vars.example .dev.vars
# GROQ_API_KEY=gsk_... を設定
```

`.env.example` も同様です（本番用シークレット管理の参考用）。

### 3. ローカル開発

```bash
npm run dev      # wrangler dev --remote
# または
npm run dev:local
```

```bash
curl -s http://127.0.0.1:8787/lub \
  -H 'content-type: application/json' \
  -d '{"conceptA":"犬","conceptB":"猫"}'
```

### 4. デプロイ

```bash
npm run deploy
npx wrangler secret put GROQ_API_KEY
```

## ディレクトリ構造

```
.
├── wrangler.toml
├── package.json
├── tsconfig.json
├── .dev.vars.example
├── .env.example
├── README.md
├── spec.md
└── src/
    ├── index.ts
    ├── types.ts
    ├── routes/
    │   ├── lub.ts
    │   └── page.tsx
    ├── components/
    │   └── LubPage.tsx
    └── services/
        └── llm.ts
```

## ライセンス

Private.
