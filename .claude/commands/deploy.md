# deploy

本番デプロイ手順:

```bash
npm run deploy
npx wrangler secret put GROQ_API_KEY
```

ローカル開発:

```bash
cp .dev.vars.example .dev.vars
# GROQ_API_KEY=gsk_... を設定
npm run dev:local
```
