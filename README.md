# 📊 Google Trends Dashboard 2.0

現代化的 Google Trends 資料視覺化工具，支援無限新增關鍵字圖表、即時熱門搜尋、深色模式和模組化架構。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)

## ✨ 2.1 新功能 (VPS 強化版)

### 📊 關鍵字排名追蹤 (Rank Tracker)
- **🔍 真實排名檢測** - 整合 **Puppeteer** 無頭瀏覽器，爬取真實 Google 搜尋排名
- **🤖 自動化檢查** - 支援大量關鍵字批次檢查
- **🆓 免費模式** - 本地開發環境自動切換為「手動檢測模式」（生成無痕搜尋連結）
- **☁️ VPS 專屬功能** - 部署到 VPS 後自動啟用真實排名爬蟲功能
- **🛡️ 智慧防護** - 內建隨機延遲與 User-Agent 輪替，降低被封鎖風險

### 🔧 系統增強
- **GSC 架構準備** - 預留 Google Search Console API 整合介面
- **智慧 iframe 降級** - 當 Google Trends API 限流時，自動切換為直接連結卡片

## ✨ 2.0 新功能

### 🎨 全新設計
- **玻璃擬態 (Glassmorphism)** - 採用 2025 年主流設計語言
- **深色模式優先** - 預設深色主題，支援一鍵切換
- **流暢動畫** - CSS Keyframes 動態效果
- **Inter 字體** - 專業級 Google Fonts 字體

### 🔧 模組化架構
- **ApiService** - 統一 API 請求管理，內建快取與超時處理
- **ThemeManager** - 主題切換與系統偏好偵測
- **ChartManager** - 圖表 CRUD 與 LocalStorage 持久化
- **App** - 主應用程式協調器

### 🚀 Serverless Backend
- **`/api/trending`** - Google Trends RSS 代理（解決 CORS）
- **`/api/news`** - Google News RSS 代理（關鍵字新聞）
- **`/api/rank-real`** - 真實排名檢測 API (Puppeteer)
- **Vercel 部署就緒** - 一鍵部署到雲端

## 🎯 核心功能

| 功能 | 說明 |
|------|------|
| 📈 無限圖表 | 動態新增任意數量的趨勢圖表 |
| 🔥 即時熱搜 | 顯示台灣/各地區即時熱門搜尋 |
| 📰 相關新聞 | 點擊圖表可查看 Google News |
| 💾 設定匯出 | CSV 格式匯入/匯出圖表配置 |
| 🌍 多地區 | 台灣、美國、日本、韓國、中國、全球 |
| ⏰ 時間範圍 | 1個月至所有時間 |
| 🌙 深色模式 | 護眼深色主題，可一鍵切換 |

## 📱 響應式佈局

| 螢幕尺寸 | 每排圖表數 | 設備類型 |
|---------|----------|--------|
| > 1200px | 自動填充 | 桌面 |
| 900-1200px | 2個 | 平板 |
| < 900px | 1個 | 手機 |

## 🚀 快速開始

### 線上使用（推薦）
直接開啟 `index.html` 即可使用，無需安裝。

### 本地開發
```bash
# 複製專案
git clone https://github.com/colinjen88/google-trends-dashboard.git
cd google-trends-dashboard

# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 開啟瀏覽器
http://localhost:8080
```

### Vercel 部署（完整功能）
```bash
# 安裝 Vercel CLI
npm i -g vercel

# 部署
vercel

# 或使用 GitHub 整合一鍵部署
```

> ⚠️ **注意**：本地開發時 `/api/*` 端點不可用，熱門搜尋將使用備用 CORS 代理。部署到 Vercel 後可享受完整功能。

## 📁 專案結構

```
google-trends-dashboard/
├── 📄 index.html              # 主頁面 (v2.0)
├── 📄 vercel.json             # Vercel 部署配置
├── 📁 api/                    # Serverless Functions
│   ├── 📄 trending.js         # 熱門搜尋 API
│   └── 📄 news.js             # 新聞搜尋 API
├── 📁 assets/
│   ├── 📁 css/
│   │   ├── 📄 glass.css       # Glassmorphism 設計系統
│   │   └── 📄 styles.css      # 主要樣式表
│   └── 📁 js/
│       ├── 📄 api-service.js  # API 請求模組
│       ├── 📄 theme-manager.js # 主題管理模組
│       ├── 📄 chart-manager.js # 圖表管理模組
│       └── 📄 app.js          # 主應用程式
├── 📁 config/                 # 設定檔案
├── 📁 docs/                   # 文件資料夾
└── 📁 examples/               # 範例檔案
```

## 🛠️ 技術規格

### 前端技術
- **HTML5** - 語義化標籤、ARIA 無障礙
- **CSS3** - Grid、Flexbox、CSS 變數、Glassmorphism
- **Vanilla JavaScript** - ES6+ 模組化、IIFE 模式

### 後端技術
- **Vercel Serverless Functions** - Node.js Runtime
- **RSS 解析** - 正則表達式 XML 解析

### 瀏覽器支援
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## ⌨️ 鍵盤快捷鍵

| 快捷鍵 | 功能 |
|--------|------|
| `Ctrl + K` | 聚焦搜尋框 |
| `Ctrl + D` | 切換深淺色模式 |

## 🎨 自訂主題

修改 `assets/css/glass.css` 中的 CSS 變數：

```css
:root {
    --color-accent-primary: #6366f1;  /* 主要強調色 */
    --color-accent-secondary: #8b5cf6; /* 次要強調色 */
    --glass-blur: 20px;                /* 模糊程度 */
}
```

## 🐛 常見問題

### Q: 熱門搜尋顯示 "載入失敗"
**A:** 本地開發時屬正常現象。部署到 Vercel 後即可正常運作。

### Q: 如何清除所有圖表？
**A:** 開啟瀏覽器開發者工具，執行 `ChartManager.clear()`。

### Q: 圖表無法載入 (429 Too Many Requests)
**A:** 這是 Google Trends 的 API 速率限制。Dashboard 2.1 已內建智慧降級機制：
1. 當偵測到 API 限流時，自動將圖表轉為「直接連結卡片」
2. 點擊按鈕可直接跳轉至 Google Trends 官網查看完整圖表
3. 此限制通常會在 1-24 小時後自動解除

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！

```bash
# Fork 後開發
git checkout -b feature/your-feature
git commit -m 'feat: add amazing feature'
git push origin feature/your-feature
```

## 📜 授權條款

MIT License - 詳見 [LICENSE](LICENSE)

## 🙏 致謝

- **Google Trends** - 提供趨勢資料
- **Vercel** - 免費 Serverless 平台
- **Inter Font** - 優秀的開源字體

---

<div align="center">

**⭐ 如果這個專案對您有幫助，請給我們一個星星！**

Made with ❤️ by [Colinjen88](https://github.com/colinjen88)

</div>