# describe

LUB（Least Upper Bound）は、2 つの概念を入力すると LLM（Groq API）によって概念的な共通祖先を 1 語で返す Web サービスです。

- 技術スタック: Hono + Cloudflare Workers / Hono JSX / Groq API
- 主なエンドポイント: GET /（UI）、POST /lub（API）、GET /health
- 設定ファイル: wrangler.toml、.dev.vars、.env.example
- 詳細仕様: spec.md
