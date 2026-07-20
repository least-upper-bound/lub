# LUB コーディング規約

## 言語・フレームワーク

- TypeScript（ES Modules）
- Hono v4
- Hono JSX
- Cloudflare Workers ランタイム

## 命名規則

- ファイル名: ケバブケース（route ファイルは機能名）
- 型名: PascalCase
- 定数: UPPER_SNAKE_CASE
- 関数: camelCase

## 注意点

- Cloudflare Workers では Node.js API が使えない
- シークレットは `.dev.vars`（ローカル）/ Wrangler Secret（本番）で管理
- UI は max-width 440px を基準にモバイルファースト
- LLM 呼び出しは `src/services/llm.ts` に集約
