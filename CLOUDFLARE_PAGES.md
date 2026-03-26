# MinimaUnit - Smart Converter を Cloudflare Pages に公開する手順

## 1. 事前確認

ローカルで次を確認します。

```bash
npm run release:check
npm run preview:host
```

最低でも次を見ておくと安心です。

- `/era-age`
- `/length`
- `/weight`
- `/area`
- `/volume`
- `/temperature`
- `/speed`
- `/currency`

## 2. Git に push

Cloudflare Pages は Git 連携での運用が最も扱いやすいです。

- GitHub などのリポジトリに push
- 公開したいブランチを `main` にしておく

## 3. Cloudflare Pages で新規プロジェクト作成

Cloudflare ダッシュボードで次の順に進みます。

1. `Workers & Pages`
2. `Create application`
3. `Pages`
4. `Connect to Git`
5. 対象リポジトリを選択

## 4. Build 設定

Cloudflare Pages では次の値で設定します。

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: 空欄

## 5. Environment variables

Project Settings > Environment variables で次を設定します。

- `NODE_VERSION` = `20`

## 6. すでに使えるファイル

- `public/_redirects`
  - SPA の直接アクセス時に `index.html` へ戻します。
- `public/_headers`
  - `sw.js` / `manifest.webmanifest` の更新性と基本ヘッダーを設定しています。
- `public/robots.txt`
  - クロール許可設定です。
- `public/og-card.svg`
  - 共有カード画像です。

## 7. デプロイ後の確認

### ルーティング

次の URL を直接開いて 404 にならないことを確認します。

- `/era-age`
- `/length`
- `/weight`
- `/area`
- `/volume`
- `/temperature`
- `/speed`
- `/currency`

### PWA / アイコン

- `manifest.webmanifest` が正しく読める
- ブラウザタブの favicon が新ロゴになっている
- スマホでホーム画面追加時にアイコンが崩れない

### メタ情報

- タイトルが `MinimaUnit - Smart Converter`
- OGP 画像が新ブランドで出る
- 説明文が不自然でない

## 8. カスタムドメイン

Cloudflare Pages でカスタムドメインを使う場合は、デプロイ後に設定します。

その後に追加で確認する項目:

- `index.html`
  - `canonical`
  - `og:url`
- お問い合わせ導線の公開先
- 必要なら利用規約 / プライバシーポリシーの表現調整

## 9. 運用メモ

- 通貨の同梱参考レートは `npm run build` 時に自動更新されます。
- favicon は build 前に存在確認を行います。再生成はローカル側で実施します。
- ブランド差し替え時は、ロゴ資産と `index.html` / `manifest` / `Layout` をまとめて更新すると整合が取りやすいです。
