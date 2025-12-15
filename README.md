# 📊 Google Trends 多圖表展示儀表板

一個現代化的 Google Trends 資料視覺化工具，支援無限新增關鍵字圖表、CSV 設定檔管理、響應式設計和即時熱門搜尋顯示。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

## ✨ 功能特色

### 🎯 核心功能
- **無限圖表新增**：動態新增任意數量的 Google Trends 圖表
- **CSV 設定檔管理**：匯入/匯出圖表設定，支援外部檔案管理
- **即時熱門搜尋**：顯示台灣即時熱門搜尋趨勢，水平並排顯示
- **響應式設計**：支援桌面、平板、手機裝置
- **多地區支援**：台灣、中國、美國、日本、韓國、全球
- **時間範圍選擇**：1個月到5年，甚至所有時間
- **自訂標題**：可自訂圖表顯示名稱和表情符號

### 📱 響應式佈局

| 螢幕尺寸 | 每排圖表數 | 設備類型 |
|---------|----------|--------|
| > 1600px | 4個 | 超大螢幕 |
| 1200-1600px | 3個 | 大螢幕 |
| 800-1200px | 2個 | 平板 |
| < 800px | 1個 | 手機 |

**佈局比例**：左側控制面板 (1/3)，右側熱門搜尋 (2/3)  
**圖表尺寸**：每個圖表最小寬度 400px，確保內容清晰可讀

## 🚀 快速開始

### 線上使用
直接開啟 `index.html` 檔案即可使用，無需安裝任何軟體。

### 本地開發
```bash
# 複製專案
git clone https://github.com/your-username/google-trends-dashboard.git

# 進入專案目錄
cd google-trends-dashboard

# 安裝依賴
npm install

# 啟動開發伺服器（推薦，支援熱重載）
npm run dev

# 或使用 Python
python -m http.server 8000

# 在瀏覽器開啟
http://localhost:8080
```

## 📁 專案結構

```
google-trends-dashboard/
├── 📄 index.html              # 主要頁面
├── 📄 index-sheets.html       # Google Sheets 整合版
├── 📄 README.md               # 專案說明
├── 📄 LICENSE                 # MIT 授權條款
├── 📄 package.json            # NPM 設定檔
├── 📁 assets/                 # 靜態資源
│   ├── 📁 css/
│   │   └── 📄 styles.css      # 主要樣式表
│   └── 📁 js/
│       ├── 📄 dashboard.js    # 主要功能腳本
│       ├── 📄 dashboard-sheets.js  # Google Sheets 版腳本
│       └── 📄 sheets-api.js   # Sheets API 整合
├── 📁 config/                 # 設定檔案
│   └── 📄 trends.csv          # 預設圖表設定
├── 📁 docs/                   # 文件資料夾
│   ├── 📄 API.md              # API 文件
│   ├── 📄 CHANGELOG.md        # 版本更新記錄
│   ├── 📄 PROJECT_OVERVIEW.md # 專案概述
│   └── 📄 GOOGLE_SHEETS_INTEGRATION.md  # Google Sheets 整合說明
└── 📁 examples/               # 範例檔案
    └── 📄 simple.html         # 簡化版範例
```

## ☁️ Google Sheets 整合

**兩種使用方式：**

1. **基本版本**（`index.html`）：使用本地儲存
2. **Google Sheets 版本**（`index-sheets.html`）：支援雲端儲存

**Google Sheets 整合優點：**
- 🔄 **跨裝置同步**：在任何裝置上都能存取相同的圖表設定
- 👥 **團隊協作**：多人可共用相同的圖表設定
- 📊 **直接編輯**：可在 Google Sheets 中直接編輯圖表設定
- 🔒 **資料安全**：資料儲存在 Google 雲端，不會遺失

**快速設定：**
1. 使用 `index-sheets.html` 開啟應用程式
2. 點選「📁 管理」→「☁️ 設定 Google Sheets」
3. 按照提示完成 Google Apps Script 設定
4. 開始享受雲端同步功能！

**詳細設定說明：** 請參考 [`docs/GOOGLE_SHEETS_INTEGRATION.md`](docs/GOOGLE_SHEETS_INTEGRATION.md)

## 🛠️ 技術規格

### 前端技術
- **HTML5**：語義化標籤、無障礙支援
- **CSS3**：Grid 佈局、Flexbox、CSS 動畫
- **Vanilla JavaScript**：無框架依賴、ES6+ 語法

### 瀏覽器支援
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

### 效能最佳化
- **延遲載入**：iframe 使用 `loading="lazy"`
- **CSS 最佳化**：使用 CSS Grid 和 Flexbox
- **JavaScript 最佳化**：事件委派、防抖處理

## 🎨 自訂樣式

### 修改顏色主題
在 `assets/css/styles.css` 中修改 CSS 變數：

```css
:root {
    --primary-color: #007bff;    /* 主要顏色 */
    --secondary-color: #6c757d;  /* 次要顏色 */
    --success-color: #28a745;    /* 成功顏色 */
    --danger-color: #dc3545;     /* 危險顏色 */
}
```

### 調整佈局
修改網格設定：

```css
.trends-grid {
    grid-template-columns: repeat(5, 1fr); /* 改為5個圖表一排 */
    gap: 20px; /* 調整間距 */
}
```

## 📊 API 參考

### 核心函數

#### `addNewChart()`
新增一個 Google Trends 圖表
```javascript
// 自動從表單讀取參數
addNewChart();
```

#### `removeChart(chartId)`
移除指定ID的圖表
```javascript
removeChart('chart-1');
```

#### `exportChartsConfig()`
匯出所有圖表設定為 JSON
```javascript
exportChartsConfig();
```

#### `importChartsConfig(file)`
從 JSON 檔案匯入圖表設定
```javascript
const input = document.createElement('input');
input.type = 'file';
input.accept = '.json';
input.onchange = (e) => importChartsConfig(e.target.files[0]);
input.click();
```

### 輔助函數

#### `buildTrendsUrl(keyword, geo, time)`
構建 Google Trends iframe URL
```javascript
const url = buildTrendsUrl('黃金價格', 'TW', 'today 1-m');
```

#### `showAlert(message, type)`
顯示通知訊息
```javascript
showAlert('操作成功！', 'success');
showAlert('請檢查輸入', 'warning');
showAlert('發生錯誤', 'error');
```

## 🔧 開發指南

### 程式碼風格
- 使用 2 空格縮排
- 函數和變數使用駝峰命名法
- CSS 類別使用短橫線命名法
- 註解使用 JSDoc 格式

### 提交規範
- `feat:` 新功能
- `fix:` 修復問題
- `docs:` 文件更新
- `style:` 樣式調整
- `refactor:` 程式碼重構

### 測試
```bash
# 執行基本測試
npm test

# 檢查程式碼品質
npm run lint

# 格式化程式碼
npm run format
```

## 🐛 常見問題

### Q: 圖表無法載入
**A:** 檢查網路連線，確保可以訪問 Google Trends。某些企業網路可能封鎖外部 iframe。

### Q: 響應式佈局異常
**A:** 清除瀏覽器快取，確保使用最新的 CSS 檔案。

### Q: JavaScript 錯誤
**A:** 檢查瀏覽器控制台，確認所有檔案正確載入。

### Q: 如何新增更多預設圖表
**A:** 在 `index.html` 的 `trends-grid` 區塊中新增更多 `trends-widget` 元素。

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！

### 提交流程
1. Fork 此專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

### 開發環境
```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 建置專案
npm run build
```

## 📜 授權條款

此專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 檔案

## 🙏 致謝

- **Google Trends**：提供強大的趨勢分析 API
- **GitHub Copilot**：協助程式開發
- **開源社群**：提供靈感和技術支援

## 🔗 相關連結

- [Google Trends 官網](https://trends.google.com/)
- [專案 GitHub](https://github.com/your-username/google-trends-dashboard)
- [問題回報](https://github.com/your-username/google-trends-dashboard/issues)
- [功能建議](https://github.com/your-username/google-trends-dashboard/discussions)

---

<div align="center">

**⭐ 如果這個專案對您有幫助，請給我們一個星星！**

Made with ❤️ by [GitHub Copilot](https://github.com/features/copilot)

</div>