# NotebookLM Smart Clipper

Google NotebookLM への情報収集を劇的に効率化する Chrome 拡張機能です。

## 🌟 主な特徴
- **ワンクリック収集**: ポップアップから現在のページを瞬時に保存。
- **右クリック連携**: サイト上の重要な文章をハイライトして、そのまま Notebook へ。
- **スマートインポート**: 収集した複数の情報を最適な形式で一括コピー。NotebookLM の「ソース追加 -> テキスト」に貼り付けるだけ。

## 📂 プロジェクト構成
- `docs/spec.md`: 詳細な機能仕様。
- `scripts/`:
  - `background.js`: コンテキストメニューと通知。
  - `content.js`: ページ内容の抽出と NotebookLM 上の補助 UI。
  - `popup.js`: キューの管理と同期設定。
- `manifest.json`: 拡張機能の設定。

## 🛠 日本語でのセットアップ
1. Chrome で `chrome://extensions/` を開く。
2. 「デベロッパー モード」をオンにする。
3. 「パッケージ化されていない拡張機能を読み込む」を選択し、このフォルダを選択。

## 📖 仕様の詳細
詳細は [docs/spec.md](docs/spec.md) を参照してください。
