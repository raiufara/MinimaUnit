# MinimaUnit - Smart Converter デプロイ準備メモ

## 前提

- 本アプリは `Vite + React + BrowserRouter` の SPA です。
- 本番成果物は `dist/` に出力されます。
- 通貨の同梱参考レートと favicon は `npm run build` 時に自動生成されます。
- 年齢・期間、各種単位換算、設定、履歴はブラウザ内保存を前提にしています。

## すでに入っている公開向けファイル

- `public/_redirects`
  - Cloudflare Pages / Netlify で SPA の直接アクセス時に `index.html` へ戻します。
- `public/_headers`
  - `sw.js` と `manifest.webmanifest` の更新性、最低限のセキュリティヘッダーを設定しています。
- `public/robots.txt`
  - クロール許可を明示しています。
- `public/og-card.svg`
  - 共有カード用の OGP 画像です。
- `public/logo-full.svg`
  - 横組み正式ロゴです。
- `public/logo-mark.svg`
  - シンボル単体ロゴです。
- `public/favicon.svg` / `public/favicon.ico`
  - ブラウザタブと小サイズ向けアイコンです。

## ローカル確認コマンド

```bash
npm run release:check
npm run preview:host
```

- `release:check`
  - `test` → `smoke` → `build` をまとめて実行します。
- `preview:host`
  - 同一ネットワーク上のスマホから本番相当表示を確認できます。
  - 既定ポートは `4173` です。

## デプロイ先ごとのメモ

### Cloudflare Pages

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- Root directory: 空欄

詳細は [CLOUDFLARE_PAGES.md](/C:/Users/gasasaju/Documents/unit-helper/CLOUDFLARE_PAGES.md) を参照してください。

### Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- `_redirects` と `_headers` はそのまま使えます。

### Vercel

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- `vercel.json` に SPA rewrite 設定済みです。

## 公開前チェック

1. `npm run release:check` が通る
2. `/era-age` `/length` `/currency` を直接開いて崩れない
3. スマホ実機で横スクロールが出ない
4. 設定 / 履歴 / 案内ドロワーが開く
5. 通貨の基準日、最終更新、レート更新ボタンが自然に動く
6. favicon、PWA アイコン、OGP が新ブランドで揃っている

## ブランド変更時に触る場所

- `index.html`
  - `title`
  - `application-name`
  - OGP / Twitter の `title` と `description`
- `public/manifest.webmanifest`
  - `name`
  - `short_name`
  - `description`
- `public/logo-full.svg`
- `public/logo-mark.svg`
- `public/favicon.svg`
- `public/og-card.svg`
- `src/components/Layout.tsx`
  - ヘッダー / フッターのブランド表示

## 補足

- `npm run build` は毎回、通貨の同梱参考レートを最新化します。
- `favicon.ico` は `scripts/generate-favicon-ico.ps1` から自動生成されます。
- 共有テキストや問い合わせ先を本番用に詰める場合は、`index.html` と `InfoDrawer` の文言を合わせて更新すると管理しやすいです。
