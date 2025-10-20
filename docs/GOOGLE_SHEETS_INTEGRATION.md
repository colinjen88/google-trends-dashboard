# Google Sheets 整合方案

## 方案一：Google Apps Script + Web App（推薦）

### 步驟一：建立 Google Sheets

1. 前往 [Google Sheets](https://sheets.google.com)
2. 建立新試算表，命名為「Trends Dashboard Data」
3. 在第一個工作表中建立以下欄位：
   ```
   A1: title
   B1: keyword  
   C1: geo
   D1: time
   E1: emoji
   F1: created_at
   G1: updated_at
   ```

### 步驟二：建立 Google Apps Script

1. 在 Google Sheets 中，點選「擴充功能」→「Apps Script」
2. 刪除預設程式碼，貼上以下程式碼：

```javascript
// Google Apps Script 後端程式碼
function doGet(e) {
  const action = e.parameter.action;
  
  switch(action) {
    case 'getCharts':
      return getCharts();
    case 'addChart':
      return addChart(e.parameter);
    case 'updateChart':
      return updateChart(e.parameter);
    case 'deleteChart':
      return deleteChart(e.parameter);
    default:
      return ContentService
        .createTextOutput(JSON.stringify({error: 'Invalid action'}))
        .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  
  switch(action) {
    case 'addChart':
      return addChart(data);
    case 'updateChart':
      return updateChart(data);
    case 'deleteChart':
      return deleteChart(data);
    case 'importCharts':
      return importCharts(data.charts);
    default:
      return ContentService
        .createTextOutput(JSON.stringify({error: 'Invalid action'}))
        .setMimeType(ContentService.MimeType.JSON);
  }
}

function getCharts() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const charts = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const chart = {};
    headers.forEach((header, index) => {
      chart[header] = row[index];
    });
    chart.id = i; // 使用列號作為 ID
    charts.push(chart);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({success: true, charts: charts}))
    .setMimeType(ContentService.MimeType.JSON);
}

function addChart(data) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const now = new Date().toISOString();
  
  const newRow = [
    data.title || '',
    data.keyword || '',
    data.geo || '',
    data.time || '',
    data.emoji || '',
    now,
    now
  ];
  
  sheet.appendRow(newRow);
  
  return ContentService
    .createTextOutput(JSON.stringify({success: true, message: 'Chart added successfully'}))
    .setMimeType(ContentService.MimeType.JSON);
}

function updateChart(data) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const id = parseInt(data.id);
  const now = new Date().toISOString();
  
  if (id > 0 && id <= sheet.getLastRow()) {
    sheet.getRange(id + 1, 1).setValue(data.title || '');
    sheet.getRange(id + 1, 2).setValue(data.keyword || '');
    sheet.getRange(id + 1, 3).setValue(data.geo || '');
    sheet.getRange(id + 1, 4).setValue(data.time || '');
    sheet.getRange(id + 1, 5).setValue(data.emoji || '');
    sheet.getRange(id + 1, 7).setValue(now); // updated_at
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, message: 'Chart updated successfully'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({error: 'Chart not found'}))
    .setMimeType(ContentService.MimeType.JSON);
}

function deleteChart(data) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const id = parseInt(data.id);
  
  if (id > 0 && id <= sheet.getLastRow()) {
    sheet.deleteRow(id + 1);
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, message: 'Chart deleted successfully'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({error: 'Chart not found'}))
    .setMimeType(ContentService.MimeType.JSON);
}

function importCharts(charts) {
  const sheet = SpreadsheetApp.getActiveSheet();
  
  // 清除現有資料（保留標題列）
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }
  
  // 新增新資料
  const now = new Date().toISOString();
  charts.forEach(chart => {
    const newRow = [
      chart.title || '',
      chart.keyword || '',
      chart.geo || '',
      chart.time || '',
      chart.emoji || '',
      now,
      now
    ];
    sheet.appendRow(newRow);
  });
  
  return ContentService
    .createTextOutput(JSON.stringify({success: true, message: 'Charts imported successfully'}))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### 步驟三：部署 Web App

1. 在 Apps Script 編輯器中，點選「部署」→「新增部署」
2. 選擇類型：「網頁應用程式」
3. 設定：
   - 說明：「Trends Dashboard API」
   - 執行身分：「我」
   - 存取權：「任何人」（如果要公開使用）
4. 點選「部署」
5. 複製 Web App URL

### 步驟四：修改前端程式

需要修改 `dashboard.js` 中的儲存邏輯，將資料同步到 Google Sheets。

## 方案二：Google Sheets API（需要 API 金鑰）

### 優點：
- 更直接的 API 整合
- 更好的效能

### 缺點：
- 需要 Google Cloud Platform 專案
- 需要處理 OAuth 認證
- 有 API 使用限制

## 方案三：第三方服務整合

### 可考慮的服務：
1. **Airtable** - 類似 Google Sheets，有更好的 API
2. **Firebase Firestore** - Google 的 NoSQL 資料庫
3. **Supabase** - 開源的 Firebase 替代方案

## 實作建議

建議先從方案一開始，因為：
1. 完全免費
2. 設定簡單
3. 資料透明（可直接在 Google Sheets 中查看/編輯）
4. 適合個人或小團隊使用

如果需要更進階的功能或更大的使用量，再考慮其他方案。