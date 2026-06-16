import json
import os
from datetime import datetime
from google.oauth2 import service_account
from googleapiclient.discovery import build

# 環境變數
SHEETS_ID = os.environ.get('SHEETS_ID')
SERVICE_ACCOUNT_JSON = os.environ.get('SERVICE_ACCOUNT_JSON')
SHEET_NAME = '休診日'

def fetch_sheet_data():
    """使用 Service Account 讀取 Google Sheets"""
    service_account_info = json.loads(SERVICE_ACCOUNT_JSON)
    credentials = service_account.Credentials.from_service_account_info(
        service_account_info,
        scopes=['https://www.googleapis.com/auth/spreadsheets']
    )

    service = build('sheets', 'v4', credentials=credentials)
    sheet = service.spreadsheets()
    result = sheet.values().get(
        spreadsheetId=SHEETS_ID,
        range=SHEET_NAME
    ).execute()
    return result.get('values', [])

def validate_row(row):
    """驗證每一列資料"""
    if len(row) < 4:  # 至少需要 4 個欄位（日期、類型、備註、狀態）
        return False
    try:
        datetime.strptime(row[0].strip(), '%Y-%m-%d')  # 驗證日期格式
        if row[1].strip() not in ["休診", "特休", "其他"]:  # 驗證類型
            return False
        if row[3].strip() not in ["有效", "待審核", "待修正"]:  # 驗證狀態
            return False
        return True
    except ValueError:
        return False

def main():
    try:
        sheet_data = fetch_sheet_data()
        if not sheet_data:
            print("❌ Google Sheets 為空或無法讀取")
            return

        headers = sheet_data[0] if sheet_data else []
        holidays = []

        for row in sheet_data[1:]:
            if not validate_row(row):
                print(f"⚠️ 跳過無效資料：{row}")
                continue
            if row[3].strip() != "有效":  # 只處理「有效」狀態的資料
                print(f"ℹ️ 跳過非有效狀態的資料：{row}")
                continue

            holiday = {
                'date': row[0].strip(),
                'type': row[1].strip(),
                'note': row[2].strip() if len(row) > 2 else ''
            }
            holidays.append(holiday)

        with open('holidays.json', 'w', encoding='utf-8') as f:
            json.dump(holidays, f, ensure_ascii=False, indent=2)

        print(f"✅ 成功更新 {len(holidays)} 筆休診日資料")

    except Exception as e:
        print(f"❌ 錯誤: {e}")
        raise

if __name__ == '__main__':
    main()
