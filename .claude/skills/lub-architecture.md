# LUB アーキテクチャ

## 概要

LUB は Hono + Cloudflare Workers で動作する軽量な Web サービスです。

## ディレクトリ構造

- `src/index.ts`: アプリエントリーポイント
- `src/types.ts`: 型定義と定数
- `src/routes/page.tsx`: GET / UI
- `src/routes/lub.ts`: POST /lub API
- `src/components/LubPage.tsx`: Hono JSX ページコンポーネント
- `src/services/llm.ts`: Groq API 呼び出し

## データフロー

1. ユーザーが概念 A / B を入力
2. POST /lub でバリデーション
3. Groq API を JSON mode で呼び出し
4. {concept, reason, confidence} を返す
5. UI で結果を表示（confidence < 0.7 は警告注釈）
