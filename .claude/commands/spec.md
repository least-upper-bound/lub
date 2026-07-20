# spec

仕様書は `spec.md` を参照してください。

主なポイント:
- MVP スコープ: Hono + Cloudflare Workers + Hono JSX + Groq API
- POST /lub で {conceptA, conceptB} を受け取り {concept, reason, confidence} を返す
- UI は max-width 440px の携帯特化ライトモード
- レート制限・認証はコード側では実装せず WAF/Bot Management に任せる
