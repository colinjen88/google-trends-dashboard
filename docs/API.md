# API 文件

Google Trends Dashboard 的 JavaScript API 參考文件。

## 📋 目錄

- [核心功能](#核心功能)
- [輔助函數](#輔助函數)
- [事件處理](#事件處理)
- [資料結構](#資料結構)
- [範例程式碼](#範例程式碼)

## 🎯 核心功能

### `addNewChart()`

新增一個 Google Trends 圖表到儀表板。

**語法：**
```javascript
addNewChart()
```

**描述：**
從表單輸入讀取關鍵字、標題、地區和時間範圍，然後創建新的圖表。

**回傳值：**
- `void`

**範例：**
```javascript
// 透過程式觸發新增圖表
addNewChart();
```

### `removeChart(chartId)`

移除指定ID的圖表。

**語法：**
```javascript
removeChart(chartId)
```

**參數：**
- `chartId` *(string)*：要移除的圖表ID

**描述：**
會先顯示確認對話框，用戶確認後移除圖表並播放移除動畫。

**回傳值：**
- `void`

**範例：**
```javascript
// 移除ID為 'chart-1' 的圖表
removeChart('chart-1');
```

### `exportChartsConfig()`

匯出所有圖表的設定為 JSON 檔案。

**語法：**
```javascript
exportChartsConfig()
```

**描述：**
掃描頁面上所有圖表，提取標題和URL，生成設定檔並下載。

**回傳值：**
- `void`

**匯出格式：**
```json
{
  "exportDate": "2025-10-20T12:00:00.000Z",
  "version": "1.0",
  "charts": [
    {
      "id": "chart-1",
      "title": "📊 黃金價格 - 搜尋趨勢",
      "url": "https://trends.google.com/trends/embed/..."
    }
  ]
}
```

### `importChartsConfig(file)`

從 JSON 檔案匯入圖表設定。

**語法：**
```javascript
importChartsConfig(file)
```

**參數：**
- `file` *(File)*：包含圖表設定的JSON檔案

**描述：**
解析JSON檔案並重建圖表到儀表板。

**回傳值：**
- `void`

**範例：**
```javascript
const input = document.createElement('input');
input.type = 'file';
input.accept = '.json';
input.onchange = (e) => importChartsConfig(e.target.files[0]);
input.click();
```

## 🔧 輔助函數

### `buildTrendsUrl(keyword, geo, time)`

構建 Google Trends iframe URL。

**語法：**
```javascript
buildTrendsUrl(keyword, geo, time)
```

**參數：**
- `keyword` *(string)*：搜尋關鍵字
- `geo` *(string)*：地區代碼（TW, US, JP, KR, CN 或空字串表示全球）
- `time` *(string)*：時間範圍（today 1-m, today 3-m, today 12-m, today 5-y, all）

**回傳值：**
- *(string)*：Google Trends iframe URL

**範例：**
```javascript
const url = buildTrendsUrl('黃金價格', 'TW', 'today 1-m');
console.log(url);
// 輸出: https://trends.google.com/trends/embed/explore/TIMESERIES?req=...
```

### `createChartElement(chartId, chartTitle, iframeUrl)`

創建圖表DOM元素。

**語法：**
```javascript
createChartElement(chartId, chartTitle, iframeUrl)
```

**參數：**
- `chartId` *(string)*：圖表的唯一ID
- `chartTitle` *(string)*：圖表標題
- `iframeUrl` *(string)*：Google Trends iframe URL

**回傳值：**
- *(HTMLElement)*：圖表DOM元素

**範例：**
```javascript
const chartElement = createChartElement(
  'chart-5',
  '比特幣價格',
  'https://trends.google.com/trends/embed/...'
);
document.getElementById('trends-grid').appendChild(chartElement);
```

### `showAlert(message, type)`

顯示通知訊息。

**語法：**
```javascript
showAlert(message, type)
```

**參數：**
- `message` *(string)*：訊息內容
- `type` *(string)*：訊息類型（success, warning, error, info）

**描述：**
在頁面右上角顯示通知訊息，3秒後自動消失。

**回傳值：**
- `void`

**範例：**
```javascript
showAlert('圖表新增成功！', 'success');
showAlert('請檢查輸入內容', 'warning');
showAlert('載入失敗，請稍後再試', 'error');
showAlert('歡迎使用儀表板', 'info');
```

### `escapeHtml(text)`

HTML 字元轉義。

**語法：**
```javascript
escapeHtml(text)
```

**參數：**
- `text` *(string)*：待轉義的文字

**回傳值：**
- *(string)*：轉義後的安全文字

**範例：**
```javascript
const safeText = escapeHtml('<script>alert("xss")</script>');
console.log(safeText); // &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;
```

## 🎛️ 事件處理

### `handleEnterKey(event)`

處理 Enter 鍵事件，快速新增圖表。

**語法：**
```javascript
handleEnterKey(event)
```

**參數：**
- `event` *(KeyboardEvent)*：鍵盤事件物件

### `validateInputs()`

驗證輸入欄位，啟用/禁用提交按鈕。

**語法：**
```javascript
validateInputs()
```

### `debounce(func, delay)`

防抖函數，避免重複執行。

**語法：**
```javascript
debounce(func, delay)
```

**參數：**
- `func` *(Function)*：要執行的函數
- `delay` *(number)*：延遲時間（毫秒）

**回傳值：**
- *(Function)*：防抖後的函數

**範例：**
```javascript
const debouncedSave = debounce(() => {
  console.log('儲存資料...');
}, 1000);

// 連續呼叫只會執行最後一次
debouncedSave();
debouncedSave();
debouncedSave(); // 只有這次會執行
```

## 📊 資料結構

### ChartConfig

圖表設定物件。

**結構：**
```typescript
interface ChartConfig {
  id: string;          // 圖表ID
  keyword: string;     // 搜尋關鍵字
  title?: string;      // 自訂標題（可選）
  geo: string;         // 地區代碼
  time: string;        // 時間範圍
  created: string;     // 創建時間（ISO格式）
}
```

### ExportConfig

匯出設定物件。

**結構：**
```typescript
interface ExportConfig {
  exportDate: string;  // 匯出日期（ISO格式）
  version: string;     // 版本號
  charts: Array<{      // 圖表陣列
    id: string;        // 圖表ID
    title: string;     // 圖表標題
    url: string;       // iframe URL
  }>;
}
```

## 🚀 範例程式碼

### 基本使用

```javascript
// 初始化時檢查
document.addEventListener('DOMContentLoaded', function() {
  console.log('Dashboard 已準備就緒');
  
  // 手動新增圖表
  setTimeout(() => {
    document.getElementById('keyword-input').value = '台積電';
    document.getElementById('geo-select').value = 'TW';
    document.getElementById('time-select').value = 'today 3-m';
    addNewChart();
  }, 2000);
});
```

### 批次新增圖表

```javascript
const keywords = ['黃金', '白銀', '原油', '比特幣'];

keywords.forEach((keyword, index) => {
  setTimeout(() => {
    document.getElementById('keyword-input').value = keyword;
    document.getElementById('title-input').value = `${keyword}分析`;
    addNewChart();
  }, index * 1000); // 每秒新增一個
});
```

### 自訂通知系統

```javascript
function customAlert(message, type, duration = 5000) {
  showAlert(message, type);
  
  // 記錄到控制台
  console.log(`[${type.toUpperCase()}] ${message}`);
  
  // 可選：發送到分析系統
  if (typeof gtag !== 'undefined') {
    gtag('event', 'alert_shown', {
      'alert_type': type,
      'message': message
    });
  }
}
```

### 圖表管理

```javascript
// 取得所有圖表
function getAllCharts() {
  return Array.from(document.querySelectorAll('.trends-widget')).map(widget => ({
    id: widget.id,
    title: widget.querySelector('h3').textContent,
    url: widget.querySelector('iframe').src
  }));
}

// 清空所有圖表
function clearAllCharts() {
  if (confirm('確定要清空所有圖表嗎？此操作無法復原。')) {
    const charts = document.querySelectorAll('.trends-widget');
    charts.forEach(chart => chart.remove());
    showAlert('已清空所有圖表', 'info');
  }
}

// 複製圖表
function duplicateChart(chartId) {
  const original = document.getElementById(chartId);
  if (original) {
    const clone = original.cloneNode(true);
    clone.id = `chart-${Date.now()}`;
    clone.querySelector('.btn-remove').setAttribute('onclick', `removeChart('${clone.id}')`);
    document.getElementById('trends-grid').appendChild(clone);
    showAlert('圖表已複製', 'success');
  }
}
```

## 🔒 安全性注意事項

1. **XSS 防護**：所有用戶輸入都會經過 `escapeHtml()` 處理
2. **URL 驗證**：只允許 Google Trends 的官方域名
3. **檔案驗證**：匯入功能只接受 JSON 格式檔案
4. **輸入限制**：關鍵字長度限制為100字元，標題限制為50字元

## 🐛 錯誤處理

```javascript
// 全域錯誤處理
window.addEventListener('error', function(event) {
  console.error('發生錯誤:', event.error);
  showAlert('系統發生錯誤，請重新整理頁面', 'error');
});

// Promise 錯誤處理
window.addEventListener('unhandledrejection', function(event) {
  console.error('未處理的 Promise 錯誤:', event.reason);
  showAlert('載入資料時發生錯誤', 'error');
});
```