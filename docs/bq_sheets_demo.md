# BigQuery × Googleスプレッドシート 外部テーブル連携マニュアル

Googleスプレッドシートのデータを直接 BigQuery に繋ぎ、スプレッドシートの更新が即時反映される外部テーブルを作成・利用するための手順書です。

---

## 📋 全体フロー
1. [デモ用のスプレッドシートを作成し、データを入力する](#step-1-デモ用のスプレッドシートを作成しデータを入力する)
2. [スプレッドシートの共有設定を変更する](#step-2-スプレッドシートの共有設定を変更する)
3. [スプレッドシート ID を取得する](#step-3-スプレッドシート-id-を取得する)
4. [外部テーブル作成スクリプトを実行する](#step-4-外部テーブル作成スクリプトを実行する)
5. [BigQuery でデータをクエリする](#step-5-bigquery-でデータをクエリする)

---

## Step 1: デモ用のスプレッドシートを作成し、データを入力する

1. [Google スプレッドシート](https://sheets.new) を新規作成します。
2. シートの1行目を「ヘッダー行（カラム名）」として、以下のデモデータをコピペして入力してください。

| A列: date | B列: product_name | C列: quantity | D列: unit_price | E列: total_amount |
| :--- | :--- | :--- | :--- | :--- |
| 2026-06-01 | AI Assistant Starter | 10 | 5000 | 50000 |
| 2026-06-02 | Gemini Enterprise License | 5 | 30000 | 150000 |
| 2026-06-03 | Cloud Consulting Service | 2 | 100000 | 200000 |
| 2026-06-04 | Workspace Business Plus | 15 | 3000 | 45000 |

> [!TIP]
> 合計金額 (`total_amount`) の列は、数式 `=C2*D2` のように入力しても正しく数値として BigQuery に連携されます。

---

## Step 2: スプレッドシートの共有設定を変更する

BigQuery がスプレッドシートのデータを読み取れるように権限を設定します。

1. スプレッドシート右上にある **「共有」** ボタンをクリックします。
2. 一般的なアクセス権を制限付きから **「リンクを知っている全員」** に変更し、役割が **「閲覧者」** になっていることを確認して「完了」をクリックします。

---

## Step 3: スプレッドシート ID を取得する

ブラウザのアドレスバーに表示されている URL から **スプレッドシート ID** をコピーします。

- URL 形式: `https://docs.google.com/spreadsheets/d/【ここの英数字の文字列】/edit...`
- 例: `https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7g8h9i0j/edit` の場合、ID は `1a2b3c4d5e6f7g8h9i0j` となります。

---

## Step 4: 外部テーブル作成スクリプトを実行する

ターミナルを開き、リポジトリルートで以下のコマンドを実行します。

```bash
./create_external_table.sh <あなたのGCPプロジェクトID> <データセット名> <テーブル名> <取得したスプレッドシートID>
```

**実行例:**
```bash
./create_external_table.sh my-gcp-project demo_dataset demo_sales_sheets 1a2b3c4d5e6f7g8h9i0j
```

---

## Step 5: BigQuery でデータをクエリする

作成した外部テーブルに対して、Google Cloud コンソールまたは `bq` コマンドでクエリを実行します。

```sql
SELECT * FROM `あなたのGCPプロジェクトID.データセット名.テーブル名` LIMIT 10;
```

### 💡 連携動作確認テスト
1. スプレッドシートに新しく `2026-06-05, Google Cloud Training, 1, 80000, 80000` を追記します。
2. 再度 BigQuery で上記の SQL クエリを実行すると、追加されたデータが即時に検索結果に現れることを確認できます。
