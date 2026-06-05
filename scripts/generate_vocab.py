import os
import json
from datetime import datetime
from dotenv import load_dotenv
import google.generativeai as genai

# --- 設定 ---
ENV_PATHS = [
    "/Users/totsuka/Desktop/戸塚諒商店/2030/tech-support-dept/.env",
    "/Users/totsuka/Desktop/戸塚誠商店/2026/growth-point-app/.env",
    os.path.join(os.path.dirname(__file__), ".env")
]

for env_path in ENV_PATHS:
    if os.path.exists(env_path):
        load_dotenv(env_path)
        break

API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
FILE_PATH = "/Users/totsuka/Desktop/戸塚誠商店/2026/learning/daily_vocab.md"

if API_KEY:
    genai.configure(api_key=API_KEY)
    # 1.5-flash は無料で利用できる範囲が広いため採用
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    model = None

PROMPT = """
あなたは英語学習のパートナーです。
英語レベルC1（英検1級、TOEIC 945点以上）に相当する、高度で知的な英単語を1つ選んでください。
以下のフォーマット（Markdown）で出力してください。余計な前置きや「承知しました」などの言葉は一切不要です。

---
### {単語}
**品詞**: {品詞}
**意味**: {日本語の意味}
**例文**: 
> {英文}
> ({日本語訳})
**語源・補足**: {語源や覚え方のヒントなど}
"""

def generate_vocab(is_test=False):
    if not API_KEY or not model:
        print("Error: API_KEY not found in .env files.")
        return

    # ディレクトリが存在しない場合は作成
    os.makedirs(os.path.dirname(FILE_PATH), exist_ok=True)
    
    try:
        final_prompt = PROMPT + ("\n(これはテスト実行です。)" if is_test else "")
        response = model.generate_content(final_prompt)
        content = response.text
        
        # ファイルに追記
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        suffix = " [テスト実行]" if is_test else ""
        header_text = f"\n## {now} の英単語{suffix}\n"
        
        with open(FILE_PATH, "a", encoding="utf-8") as f:
            f.write(header_text)
            f.write(content.strip())
            f.write("\n")
        print(f"Successfully added new word at {now}")
    except Exception as e:
        print(f"Exception occurred: {str(e)}")

if __name__ == "__main__":
    import sys
    is_test = "--test" in sys.argv
    generate_vocab(is_test=is_test)

