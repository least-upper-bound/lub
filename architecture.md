# LUB Architecture

## 概要

LUB（Least Upper Bound）は、2 つの概念の共通祖先を LLM で導出する Web サービスです。

## 技術スタック

| レイヤー       | サービス                          |
| -------------- | --------------------------------- |
| フレームワーク | Hono (Cloudflare Workers アダプタ) |
| UI             | Hono JSX (`hono/jsx`)             |
| LLM            | Groq API `llama-3.1-8b-instant`   |
| キャッシュ     | なし                              |
| 監視           | `wrangler tail` + `console.error` |

## 構成

### エントリポイント

`src/index.ts` が Hono アプリを作成し、ルートをマウントします。

### ルート

- `GET /`: Hono JSX による単一画面 UI
- `POST /lub`: 概念 A/B から共通祖先を返す API
- `GET /health`: ヘルスチェック

### サービス

- `src/services/llm.ts`: Groq API 呼び出しと JSON パース

### コンポーネント

- `src/components/LubPage.tsx`: 入力フォーム、結果表示、例示チップ

## データフロー

```
[UI] --conceptA/conceptB--> [POST /lub] --> [Validation] --> [Groq API] --> [Response]
```

## 環境変数

- `GROQ_API_KEY`: Groq API キー

## デプロイ

Cloudflare Workers へ `wrangler deploy` でデプロイします。
