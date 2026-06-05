#!/bin/bash

# 使用方法を表示する関数
show_usage() {
    echo "使用方法: $0 <PROJECT_ID> <DATASET_NAME> <TABLE_NAME> <SPREADSHEET_ID>"
    echo "引数:"
    echo "  PROJECT_ID     : GCPのプロジェクトID"
    echo "  DATASET_NAME   : BigQueryのデータセット名 (存在しない場合は自動作成されます)"
    echo "  TABLE_NAME     : 作成する外部テーブル名"
    echo "  SPREADSHEET_ID : GoogleスプレッドシートのID (URLの/d/と/editの間の文字列)"
    echo ""
    echo "実行例:"
    echo "  $0 my-gcp-project demo_dataset demo_sales_sheets 1a2b3c4d5e6f7g8h9i0j"
    exit 1
}

# 引数の数を確認
if [ "$#" -ne 4 ]; then
    show_usage
fi

PROJECT_ID=$1
DATASET_NAME=$2
TABLE_NAME=$3
SPREADSHEET_ID=$4

DEFINITION_FILE="/Users/totsuka/Documents/makoto/bq_external_table_definition.json"
TEMP_DEFINITION_FILE="/Users/totsuka/Documents/makoto/temp_definition.json"

# 定義ファイルが存在するか確認
if [ ! -f "$DEFINITION_FILE" ]; then
    echo "エラー: 定義ファイル $DEFINITION_FILE が見つかりません。"
    exit 1
fi

# スプレッドシートIDをプレースホルダーと置換して一時ファイルを作成
sed "s|YOUR_SPREADSHEET_ID|${SPREADSHEET_ID}|g" "$DEFINITION_FILE" > "$TEMP_DEFINITION_FILE"

echo "========================================="
echo "BigQuery 外部テーブルを作成しています..."
echo "プロジェクト ID  : $PROJECT_ID"
echo "データセット名   : $DATASET_NAME"
echo "テーブル名       : $TABLE_NAME"
echo "スプレッドシート : https://docs.google.com/spreadsheets/d/$SPREADSHEET_ID"
echo "========================================="

# データセットが存在するか確認、なければ作成
bq show --project_id="$PROJECT_ID" "$DATASET_NAME" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "データセット '$DATASET_NAME' が存在しないため、新規作成します..."
    bq mk --project_id="$PROJECT_ID" --dataset "$DATASET_NAME"
    if [ $? -ne 0 ]; then
        echo "エラー: データセットの作成に失敗しました。"
        rm -f "$TEMP_DEFINITION_FILE"
        exit 1
    fi
fi

# 外部テーブルを作成 (すでに存在する場合はエラーになります)
bq mk \
  --project_id="$PROJECT_ID" \
  --external_table_definition="${TEMP_DEFINITION_FILE}" \
  "${DATASET_NAME}.${TABLE_NAME}"

if [ $? -eq 0 ]; then
    echo "-----------------------------------------"
    echo "🎉 外部テーブル '$TABLE_NAME' の作成に成功しました！"
    echo "スプレッドシートの変更がクエリに即時反映されます。"
    echo "-----------------------------------------"
else
    echo "❌ エラー: 外部テーブルの作成に失敗しました。"
    echo "※ 既に同名のテーブルが存在する場合は、先に削除するか別名を使用してください。"
fi

# 一時ファイルの削除
rm -f "$TEMP_DEFINITION_FILE"
