# NotebookLM Smart Clipper 仕様書 (spec.md)

## 1. プロジェクト概要
ウェブサイト上の情報を効率的に収集し、Google NotebookLM に「ソース」として追加するための Chrome 拡張機能。

## 2. 主要機能
### 2.1 クリッピング (Clipping)
- **ページ全体の収集**: ポップアップから現在のページの内容を抽出して保存。
- **範囲選択の収集**: 右クリックメニュー（コンテキストメニュー）から、選択中のテキストのみを保存。
- **通知**: 保存成功時にシステム通知を表示。

### 2.2 NotebookLM 同期
- **クリップボード連携**: 保存された全アイテムを NotebookLM が読み取れる形式（Markdown 形式）でフォーマットし、クリップボードにコピー。
- **自動遷移**: 指定された NotebookLM の URL へ自動的に移動。

### 2.3 NotebookLM ヘルパー (Helper UI)
- NotebookLM のページ上に、現在キューに溜まっているアイテム数を表示するフローティングバッジを表示。
- バッジ内の「Import All」ボタンから、即座に全アイテムをクリップボードにコピー可能。

## 3. 技術仕様
### 3.1 構成要素
- **Manifest**: version 3
- **Background**: `scripts/background.js` (Service Worker) - コンテキストメニュー、通知管理。
- **Content Script**: `scripts/content.js` - ノート抽出、NotebookLM 上の UI 表示。
- **Popup**: `popup.html/js` - キューの管理、NotebookLM URL 設定。

### 3.2 データ構造 (Storage)
`chrome.storage.local` を使用。

#### `clipQueue` (Array)
保存された各アイテムのオブジェクト。
```json
{
  "title": "ページタイトル",
  "url": "ソースURL",
  "snippet": "抽出されたテキスト",
  "timestamp": 123456789
}
```

#### `notebookUrl` (String)
ユーザーが設定した同期先の NotebookLM URL。

## 4. 整合性チェックリスト
- [ ] `manifest.json` の permissions に `storage`, `tabs`, `contextMenus`, `notifications` が含まれているか。
- [ ] `content.js` の抽出サイズ制限（10,000文字）が守られているか。
- [ ] クリップボードコピー後に NotebookLM への遷移がスムーズか。
