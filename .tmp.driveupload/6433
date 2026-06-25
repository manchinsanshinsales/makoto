# GWS × GCP 連携デモ仕様書 - 顧客フィードバック自動要約＆分析ツール

このドキュメントは、Google Workspace（GWS）とGoogle Cloud（GCP）を組み合わせ、AIを活用した「顧客フィードバックの自動要約＆分析システム」を構築するための設計・仕様書です。

---

## 1. 全体アーキテクチャ

本システムは、Googleスプレッドシートに入力された顧客の声を、BigQueryでのデータ分析およびVertex AI（Gemini API）の自然言語処理を組み合わせて自動処理します。

```mermaid
graph TD
    Spreadsheet["Googleスプレッドシート (データソース)"] -->|Google Drive外部テーブル接続| BigQuery["BigQuery (データ結合・分析)"]
    Spreadsheet -->|データの読み書き| GAS["Google Apps Script (GAS)"]
    GAS -->|分析クエリの実行| BigQuery
    GAS -->|フィードバックの送信 & 結果受信| Gemini["Vertex AI / Gemini API"]
    Gemini -->|分析結果 (感情・要約・アクション)| GAS
```

---

## 2. データスキーマ（データ構造）

### ① Googleスプレッドシート：「フィードバック」シート
現場の担当者が入力するか、問い合わせフォーム等から自動追加されるシートです。

| 列名 | データ型 | 説明 |
| :--- | :--- | :--- |
| `ID` | 整数 / 文字列 | フィードバックの一意な識別子。 |
| `Timestamp` | 日時 | 問い合わせが作成された日時。 |
| `CustomerID` | 文字列 | 顧客ID（売上データと結合するためのキー）。 |
| `CustomerFeedback` | 文字列 | 顧客から送られた生の問い合わせ文。 |
| `Sentiment` | 文字列 | **[AI自動入力]** 感情分析結果（Positive / Negative / Neutral）。 |
| `Summary` | 文字列 | **[AI自動入力]** 問い合わせ内容の1文要約。 |
| `ActionPlan` | 文字列 | **[AI自動入力]** 次に取るべきアクション（箇条書き3点以内）。 |

### ② BigQuery：「顧客マスタ」テーブル (`customers`)
基幹システム等からBigQueryへ同期されている、顧客属性や売上情報のデータです。

| 列名 | データ型 | 説明 |
| :--- | :--- | :--- |
| `customer_id` | STRING | 顧客ID（主キー）。 |
| `company_name` | STRING | 顧客企業名。 |
| `plan_level` | STRING | 契約プラン（Free / Pro / Enterprise）。 |
| `sales_rep` | STRING | 担当営業担当者名。 |

---

## 3. 設定手順

### ステップ1：BigQueryでGoogle Drive外部テーブルを作成する
スプレッドシートのデータを物理的に移動させずに、直接BigQueryから参照できるように設定します。

1. BigQueryコンソールで対象のデータセットを選択し、「テーブルを作成」をクリック。
2. ソースに「ドライブ」を選択し、スプレッドシートのURLを入力。
3. ファイル形式に「Google スプレッドシート」を選択。
4. スキーマ（列名）をスプレッドシートのヘッダーに合わせて定義（または自動検出を選択）。
5. テーブル名を `external_feedback` として作成。

### ステップ2：分析用結合ビューの作成
外部テーブルと顧客マスタテーブルを結合（JOIN）し、「Enterpriseプランの顧客からの問い合わせ」といった高度な条件でデータを抽出できるようにします。

```sql
CREATE OR REPLACE VIEW my_dataset.customer_insights AS
SELECT
  f.ID,
  f.Timestamp,
  c.company_name,
  c.plan_level,
  c.sales_rep,
  f.CustomerFeedback
FROM
  `my_dataset.external_feedback` f
JOIN
  `my_dataset.customers` c
ON
  f.CustomerID = c.customer_id;
```

---

## 4. GAS（Google Apps Script）実装コードサンプル

スプレッドシートのスクリプトエディタに配置する、BigQueryとVertex AI (Gemini API) を仲介するプログラムです。

### ① BigQueryから重要データを取得するスクリプト
```javascript
function getFeedbackFromBigQuery() {
  const projectId = 'your-gcp-project-id';
  const query = `
    SELECT ID, CustomerFeedback, company_name, plan_level 
    FROM \`my_dataset.customer_insights\` 
    WHERE Sentiment IS NULL OR Sentiment = '';
  `;
  
  const request = {
    query: query,
    useLegacySql: false
  };
  
  const queryResults = BigQuery.Jobs.query(request, projectId);
  const rows = queryResults.rows;
  
  return rows ? rows.map(row => {
    return {
      id: row.f[0].v,
      feedback: row.f[1].v,
      company: row.f[2].v,
      plan: row.f[3].v
    };
  }) : [];
}
```

### ② Vertex AI (Gemini API) を呼び出し、分析結果をスプレッドシートに書き戻す
```javascript
function analyzeFeedbackWithGemini() {
  const feedbacks = getFeedbackFromBigQuery();
  if (feedbacks.length === 0) return;
  
  const apiKey = 'YOUR_GEMINI_API_KEY'; // 本番環境ではシークレットマネージャーやプロパティサービスを使用します
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('フィードバック');
  const data = sheet.getDataRange().getValues();
  
  feedbacks.forEach(item => {
    const prompt = `
      以下の顧客フィードバックを分析してください。
      顧客名: ${item.company}
      プラン: ${item.plan}
      フィードバック内容: ${item.feedback}
      
      出力は以下のJSON形式のみで返してください。余計な説明文やマークダウンの枠は含めないでください。
      {
        "sentiment": "Positive" または "Negative" または "Neutral",
        "summary": "1文での簡単な要約",
        "action": "箇条書きで3つ以内の次の対応アクション"
      }
    `;
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    };
    
    try {
      const response = UrlFetchApp.fetch(url, options);
      const result = JSON.parse(response.getContentText());
      const cleanJson = JSON.parse(result.candidates[0].content.parts[0].text); // JSON文字列をパース
      
      // スプレッドシートの該当行を探して書き戻し
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] == item.id) { // ID列が一致する行
          sheet.getRange(i + 1, 5).setValue(cleanJson.sentiment); // E列 (Sentiment)
          sheet.getRange(i + 1, 6).setValue(cleanJson.summary);   // F列 (Summary)
          sheet.getRange(i + 1, 7).setValue(cleanJson.action);    // G列 (ActionPlan)
          break;
        }
      }
    } catch (e) {
      Logger.log('エラーが発生しました: ' + e.message);
    }
  });
}
```

---

## 5. セキュリティとアクセスコントロール（GWS ⇄ GCP IAM 連携）

実務（特にGWS Admin / PCMLEの観点）において、安全にこのシステムを運用するためのベストプラクティスです。

1. **Googleグループによるロール管理**:
   - GWSの管理コンソールから `gcp-ml-operators@yourdomain.com` というグループを作成します。
   - GCP IAMでこのグループに対して `Vertex AI User` および `BigQuery Job User` ロールを付与します。
   - メンバーの追加・削除はGWS側のみで行い、GCPへの不要な直接権限付与を防ぎます。
2. **サービスアカウントによるAPI呼び出しの安全化**:
   - GASからAPIキーを直接叩くのではなく、GCP上で「サービスアカウント」を発行し、その秘密鍵（OAuth2認証）を用いてVertex AIを呼び出すことで、APIキーの紛失リスクをゼロにします。
3. **Google Drive共有設定**:
   - データソースとなるスプレッドシートは「共有ドライブ」内に配置し、閲覧できるユーザー（GWS組織内の指定OUのみ）を厳密に制限します。これにより、GCPから外部テーブル経由でデータが覗かれる範囲を限定します。
