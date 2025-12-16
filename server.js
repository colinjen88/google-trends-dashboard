/**
 * Google Trends Dashboard - Express Server
 * 
 * @description VPS 部署用的 Express 伺服器
 * @author Colinjen88
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

// 匯入 API 路由
const trendingHandler = require('./api/trending-express');
const newsHandler = require('./api/news-express');
const rankHandler = require('./api/rank-express');
const gscHandler = require('./api/gsc-express');

const app = express();
const PORT = process.env.PORT || 3000;

// 中介軟體
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 靜態檔案服務
app.use(express.static(path.join(__dirname), {
    extensions: ['html', 'htm']
}));

// API 路由
app.get('/api/trending', trendingHandler);
app.get('/api/news', newsHandler);
app.get('/api/rank', rankHandler);
app.get('/api/gsc', gscHandler);

// 真實排名 API（需要 Puppeteer）
try {
    const rankRealHandler = require('./api/rank-real-express');
    app.get('/api/rank-real', rankRealHandler);
    console.log('✅ Real rank checking enabled (Puppeteer)');
} catch (e) {
    console.warn('⚠️ Puppeteer not available, /api/rank-real disabled');
}

// 首頁
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 處理
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// 錯誤處理
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ 
        success: false, 
        error: 'Internal Server Error' 
    });
});

// 啟動伺服器
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🚀 Google Trends Dashboard 2.0                  ║
║                                                   ║
║   Server running at: http://localhost:${PORT}        ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
    `);
});

module.exports = app;
