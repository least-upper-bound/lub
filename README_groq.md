# Groq API 利用とコスト概算

LUB は Groq API を使って 2 つの概念から共通祖先を生成します。

## 現行モデル

品質問題（日本語のガベージ出力）があったため、以下のモデルを使用しています。

- **現行**: `llama-3.3-70b-versatile`
- **旧**: `llama-3.1-8b-instant`（日本語 JSON mode で不安定だったため廃止）

## 料金

[Groq On-Demand Pricing](https://groq.com/pricing)（2026 年 7 月現在）:

| モデル | Input / 1M tokens | Output / 1M tokens |
| --- | --- | --- |
| `llama-3.3-70b-versatile` | $0.59 | $0.79 |
| `llama-3.1-8b-instant` | $0.05 | $0.08 |

## レート制限

[Groq Rate Limits](https://console.groq.com/docs/rate-limits)（Free tier、2026 年 7 月現在）:

| モデル | RPM | RPD | TPM | TPD |
| --- | --- | --- | --- | --- |
| `llama-3.3-70b-versatile` | 30 | 1,000 | 12,000 | 100,000 |
| `llama-3.1-8b-instant` | 30 | 14,400 | 6,000 | 500,000 |

## 1 リクエストあたりのトークン数

LUB のプロンプト（システムプロンプト + 例 + ユーザー入力）で実測した値:

- **Input**: 約 470 tokens
- **Output**: 約 40–60 tokens（理由文の長さで変動）
- **合計**: 約 510–530 tokens

## コスト概算

### `llama-3.3-70b-versatile`（現行）

```
Input  : 470 tokens × $0.59 / 1,000,000 = $0.000277
Output :  50 tokens × $0.79 / 1,000,000 = $0.000040
-----------------------------------------------
1 回あたり                    約 $0.00032
```

- **$1 で約 3,200 回**
- **$5 で約 16,000 回**
- ただし Free tier の **1 日上限は 1,000 回（RPD）** なので、1 日に使えるのはレート制限まで
- $5 分を毎日上限まで使い切ると、約 16 日で消費

### `llama-3.1-8b-instant`（旧、参考）

```
Input  : 470 tokens × $0.05 / 1,000,000 = $0.000024
Output :  50 tokens × $0.08 / 1,000,000 = $0.000004
-----------------------------------------------
1 回あたり                    約 $0.000028
```

- **$1 で約 35,700 回**
- **$5 で約 178,500 回**
- Free tier の 1 日上限は 14,400 回

## Free tier で使える回数の目安

Groq の Free tier は主に **レート制限** で管理されています。初期クレジットの有無や金額は公開情報で明確ではないため、実際の上限は Groq Console の **Usage / Billing** ページで確認してください。

| モデル | 1 日上限 | $1 分の回数 | $5 分の回数（参考） |
| --- | --- | --- | --- |
| `llama-3.3-70b-versatile` | 1,000 回/日 | 約 3,200 回 | 約 16,000 回 |
| `llama-3.1-8b-instant` | 14,400 回/日 | 約 35,700 回 | 約 178,500 回 |

## 注意点

- 上記は **推定値** です。実際のトークン数は入力概念の長さや出力理由文の長さで変わります。
- Free tier のレート制限はアカウント単位で適用されます。
- 大量に使う場合は [Developer tier](https://groq.com/blog/developer-tier-now-available-on-groqcloud) への移行を検討してください。

## 参考リンク

- [Groq Pricing](https://groq.com/pricing)
- [Groq Rate Limits](https://console.groq.com/docs/rate-limits)
- [Groq Billing FAQs](https://console.groq.com/docs/billing-faqs)
- [Groq Developer Tier](https://groq.com/blog/developer-tier-now-available-on-groqcloud)
