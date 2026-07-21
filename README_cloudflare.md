# Cloudflare アカウント作成後の手順

このドキュメントは、Cloudflare アカウントを作成したあとに行うセットアップを順番にまとめたものです。  
アプリ本体の説明は [`README.md`](./README.md)、仕様は [`spec.md`](./spec.md) を参照してください。

前提:

- リポジトリのコードはすでに用意済み
- `.env` または `.dev.vars` に `GROQ_API_KEY` が設定済みであること
- Node.js / npm が使えること

---

## チェックリスト（全体像）

1. [ ] 依存関係のインストール
2. [ ] Wrangler ログイン
3. [ ] Account ID の確認
4. [ ] **workers.dev サブドメインの登録**（`npm run dev` / remote の前提）
5. [ ] `.dev.vars` の設定
6. [ ] ローカル動作確認（`npm run dev` / `npx wrangler dev --remote`）
7. [ ] デプロイ + Secret 登録

---

## 1. 依存関係のインストール

プロジェクトルートで:

```bash
npm install
```

以降のコマンドは、特に断りがなければプロジェクトルートで実行します。

---

## 2. Wrangler にログイン

```bash
npx wrangler login
```

ブラウザが開くので、作成した Cloudflare アカウントで許可します。

ログイン確認:

```bash
npx wrangler whoami
```

---

## 3. Account ID を控える

次のいずれかで Account ID を取得します。

- ダッシュボード右サイドバー / Workers 概要に表示される **Account ID**
- または:

```bash
npx wrangler whoami
```

本アプリは D1 / Vectorize を使わないため、Account ID を手動で設定ファイルに書く必要はありません。
ただしダッシュボード URL に使うため、控えておくと便利です。

---

## 4. workers.dev サブドメインを登録する（必須）

本アプリの `npm run dev` は **`npx wrangler dev --remote`** 相当です。  
remote モードでは、事前に **workers.dev サブドメイン登録** が必須です。

### 何ができていればよいか

| 用語 | 実例（このプロジェクト） | 意味 |
|------|--------------------------|------|
| **workers.dev サブドメイン**（アカウント単位） | `least-upper-bound.workers.dev` | アカウントに 1 つ。remote dev / 公開 URL の前提 |
| **Worker URL**（アプリ単位） | `lub.least-upper-bound.workers.dev` | Worker 名 `lub` の本番 URL |
| **Preview URL** | `*-lub.least-upper-bound.workers.dev` | プレビュー用 |

`least-upper-bound` 部分がアカウント共通サブドメインです。これが付いていれば手順 4 の目的は達成です。

### 手順: Create application で有効化する

1. **Workers & Pages** を開く

   `https://dash.cloudflare.com/b25ced8451fb4ffef7ccfebba2f650be/workers-and-pages`

2. **Create application** を選ぶ
3. **Import a repository** で GitHub リポジトリを接続する  
   例: `https://github.com/least-upper-bound/lub`
4. 作成後、Worker の **Domains** 画面を開く  
   例:

   `https://dash.cloudflare.com/b25ced8451fb4ffef7ccfebba2f650be/workers/services/view/lub/production/domains`

5. 次の **Worker URL** が表示されていることを確認する

   | 種別 | 表示例 |
   |------|--------|
   | Production | `lub.least-upper-bound.workers.dev` |
   | Preview | `*-lub.least-upper-bound.workers.dev` |

6. 各 URL の横にある **有効化セレクトボックスを ON** にする

これでアカウントに `least-upper-bound.workers.dev` が紐づき、Worker 公開 URL も使える状態になります。

> リポジトリ名が `lub` の場合、ダッシュボード上の Worker 名も `lub` になります。  
> `wrangler.toml` の `name = "lub"` と一致しているため、CLI デプロイでも同じ URL `https://lub.least-upper-bound.workers.dev/` が使えます。

### 登録できたか確認する

Domains 画面で Production / Preview の workers.dev URL が **ON** なら成功です。

```text
Production  lub.least-upper-bound.workers.dev          ON
Preview     *-lub.least-upper-bound.workers.dev        ON
```

その後、手元で:

```bash
npm run dev
```

`register a workers.dev subdomain` / `edge-preview` エラーが出なければ、この手順は完了です。

### Git 連携 Worker と CLI デプロイの関係

本番環境は `https://lub.least-upper-bound.workers.dev/` です。  
`wrangler.toml` の `name = "lub"` に従い、`npx wrangler deploy` でも Worker 名 `lub` でデプロイされます。

| 経路 | Worker 名 | URL 例 | 位置づけ |
|------|-----------|--------|----------|
| `npx wrangler deploy`（CLI） | `lub` | `https://lub.least-upper-bound.workers.dev` | 本番デプロイ |
| Create application（GitHub） | `lub` | `https://lub.least-upper-bound.workers.dev` | workers.dev 有効化用（既に完了） |

Git 連携で作った `lub` は、サブドメイン有効化の目的を果たせば十分です。  
以降の本番運用は、README どおり **CLI（`wrangler deploy`）** を主に使って問題ありません。Git 連携側は残しても削除しても構いません。

### 未登録のときに出るエラー（実例）

```text
✘ [ERROR] You need to register a workers.dev subdomain before running the
dev command in remote mode. You can either enable local mode by pressing l,
or register a workers.dev subdomain here:
https://dash.cloudflare.com/b25ced8451fb4ffef7ccfebba2f650be/workers/onboarding

✘ [ERROR] Failed to start the remote proxy session.
Error reloading remote server: A request to the Cloudflare API
(/accounts/.../workers/subdomain/edge-preview) failed.
```

**対処**: 上記手順で workers.dev URL を ON にしてから、`npm run dev` を再実行する。

> サブドメイン（例: `least-upper-bound.workers.dev`）は **1 アカウントにつき 1 回** で足ります。

---

## 5. 環境変数を設定する

### 5.1 `.dev.vars`（`wrangler dev` 用）

Wrangler のローカル/remote 開発実行は `.env` ではなく **`.dev.vars`** を読みます。

```bash
cp .dev.vars.example .dev.vars
```

Worker 本体が必要なのは **`GROQ_API_KEY` のみ** です。

```bash
GROQ_API_KEY=gsk_...
```

> `.dev.vars` は `.gitignore` に含まれています。Git にコミットしないでください。

### 5.2 本番 Secret

デプロイ後に `GROQ_API_KEY` を Workers Secret として登録します（後述）。

---

## 6. ローカルで動作確認する

### 6.1 起動コマンド（重要）

`wrangler` は **グローバルインストールしていません**。  
`npm install` 後に `node_modules` 内へ入るため、次のどちらかで起動します。

| コマンド | 説明 |
|----------|------|
| **`npm run dev`**（推奨） | `package.json` 経由。中身は `wrangler dev --remote` |
| **`npx wrangler dev --remote`** | ローカルの wrangler を `npx` で実行 |

```bash
# 推奨
npm run dev

# 同等
npx wrangler dev --remote
```

**使わないこと:**

```bash
wrangler dev --remote
# → wrangler: コマンドが見つかりません
```

グローバルに `wrangler` が無いため、パスが通りません。

### 6.2 起動前チェック

- [ ] プロジェクトルートで `npm install` 済み
- [ ] **手順 4**: workers.dev サブドメイン登録済み
- [ ] **手順 5**: `.dev.vars` に `GROQ_API_KEY` あり

### 6.3 起動

```bash
cd ~/project/lub   # プロジェクトルート
npm run dev
```

### 6.4 リクエスト確認

別ターミナルで:

```bash
curl -s http://127.0.0.1:8787/health

curl -s http://127.0.0.1:8787/lub \
  -H 'content-type: application/json' \
  -d '{"conceptA":"犬","conceptB":"猫"}'
```

期待する例:

- `concept` が 1 語程度の上位概念（例: `動物`）
- `confidence` が 0〜1 の数値
- `reason` が入っている

### 6.5 `dev:local` について

```bash
npm run dev:local   # = npx wrangler dev（--remote なし）
```

Hono ルーティングや UI の軽確認用です。  
ただし `GROQ_API_KEY` は `.dev.vars` から読まれるため、ローカルでも Groq API 呼び出しは動作します。  
`--remote` なしでも問題ない場合がありますが、本アプリの `npm run dev` は `--remote` 推奨です。

### 6.6 よくあるエラー: `wrangler: コマンドが見つかりません`

**症状（実ログ）:**

```text
$ wrangler dev --remote
wrangler: コマンドが見つかりません
```

**原因:** `wrangler` をグローバルコマンドとして叩いている。本プロジェクトでは devDependency のため PATH に無い。

**対処:**

```bash
npm run dev
# または
npx wrangler dev --remote
```

まだ失敗する場合:

```bash
npm install
npm run dev
```

### 6.7 よくあるエラー: workers.dev サブドメイン未登録

**症状（実ログ）:**

```text
Using secrets defined in .dev.vars
⎔ Establishing remote connection...
✘ [ERROR] You need to register a workers.dev subdomain before running the
dev command in remote mode. You can either enable local mode by pressing l,
or register a workers.dev subdomain here:
https://dash.cloudflare.com/b25ced8451fb4ffef7ccfebba2f650be/workers/onboarding

✘ [ERROR] Failed to start the remote proxy session.
Error reloading remote server: A request to the Cloudflare API
(/accounts/.../workers/subdomain/edge-preview) failed.
```

**原因:**

1. `npx wrangler dev --remote` で remote 接続しようとしている
2. アカウントに **workers.dev サブドメインが未登録**

**対処:**

1. Create application で workers.dev URL を ON にする（[手順 4](#4-workersdev-サブドメインを登録する必須)）
2. もう一度 `npm run dev` を実行する

### 6.8 よくあるエラー: Groq API エラー

**症状:** 429 / 401 レスポンス、または 500 エラー

**原因:**

- `.dev.vars` の `GROQ_API_KEY` が未設定 / 誤っている
- Groq API のレートリミットに達している

**対処:**

- `.dev.vars` に正しい `GROQ_API_KEY` が設定されているか確認する
- 429 の場合は時間をおいて再試行する

---

## 7. 本番デプロイする

```bash
npx wrangler deploy
```

Workers の Secret に Groq キーを登録（ダッシュボードでも可）:

```bash
npx wrangler secret put GROQ_API_KEY
```

プロンプトが出たら `.dev.vars` と同じキーを貼り付けます。

デプロイ後の URL（`wrangler.toml` の `name = "lub"` により決まる）:

```text
https://lub.least-upper-bound.workers.dev
```

動作確認:

```bash
curl -s https://lub.least-upper-bound.workers.dev/lub \
  -H 'content-type: application/json' \
  -d '{"conceptA":"犬","conceptB":"猫"}'
```

---

## よくある失敗と対処

| 症状 | 想定原因 | 対処 |
|------|----------|------|
| `wrangler: コマンドが見つかりません` | グローバル `wrangler` が無い | `npm run dev` または `npx wrangler ...` を使う（手順 6.1 / 6.6） |
| `register a workers.dev subdomain` / `edge-preview` 失敗 | サブドメイン未登録 | [手順 4](#4-workersdev-サブドメインを登録する必須) で登録後、`npm run dev` |
| `dev` 中に Groq エラー | `.dev.vars` 未設定 / キー誤り | 手順 5.1 |
| デプロイ後だけ Groq 失敗 | Secret 未登録 | `wrangler secret put GROQ_API_KEY` |
| 429 Too Many Requests | Groq レートリミット | 時間をおいて再試行 |

---

## 作成される Cloudflare リソース一覧

| リソース | 名前（既定） | 用途 |
|----------|--------------|------|
| Workers（CLI / 本番） | `lub` | `wrangler deploy` 時の API 本体。本番 URL `https://lub.least-upper-bound.workers.dev` |
| Workers（Git 連携・手順 4） | `lub` | Create application 時。workers.dev 有効化用 |
| workers.dev サブドメイン | `least-upper-bound.workers.dev` | remote dev / 公開 URL の親ドメイン |
| Secret | `GROQ_API_KEY` | LLM（Groq） |

---

## 次にやること（まとめコマンド）

アカウント作成後、最短での通し手順:

```bash
npm install
npx wrangler login

# 1) 必須: Workers & Pages → Create application → GitHub 連携
#    Domains で Production/Preview の workers.dev を ON
#    例: lub.least-upper-bound.workers.dev

cp .dev.vars.example .dev.vars
# .dev.vars に GROQ_API_KEY を設定

npm run dev   # = npx wrangler dev --remote（素の wrangler コマンドは使わない）
# 動作確認後
npx wrangler deploy
npx wrangler secret put GROQ_API_KEY
```
