/**
 * Google Trends Dashboard - 主要功能腳本
 * Author: GitHub Copilot
 * Created: 2025/10/20
 * Description: Google Trends 多圖表展示儀表板的功能實現
 */

// ==================================================
// 全域變數與配置
// ==================================================
let chartCounter = 4; // 圖表計數器，從預設的4個圖表開始

// 支援的地區代碼和顯示名稱對應
const SUPPORTED_REGIONS = {
    'TW': '台灣',
    'CN': '中國',
    'US': '美國',
    'JP': '日本',
    'KR': '韓國',
    '': '全球'
};

// 支援的時間範圍
const SUPPORTED_TIME_RANGES = {
    'today 1-m': '過去1個月',
    'today 3-m': '過去3個月', 
    'today 12-m': '過去12個月',
    'today 5-y': '過去5年',
    'all': '所有時間'
};

// ==================================================
// 核心功能函數
// ==================================================

/**
 * 新增 Google Trends 圖表
 */
function addNewChart() {
    const keyword = document.getElementById('keyword-input').value.trim();
    const title = document.getElementById('title-input').value.trim();
    const geo = document.getElementById('geo-select').value;
    const time = document.getElementById('time-select').value;

    // 驗證必填欄位
    if (!keyword) {
        showAlert('請輸入關鍵字', 'warning');
        document.getElementById('keyword-input').focus();
        return;
    }

    // 生成唯一的圖表ID
    chartCounter++;
    const chartId = `chart-${chartCounter}`;
    const chartTitle = title || keyword;

    try {
        // 構建 Google Trends iframe URL
        const iframeUrl = buildTrendsUrl(keyword, geo, time);
        
        // 創建圖表元素
        const chartElement = createChartElement(chartId, chartTitle, iframeUrl);
        
        // 添加到DOM
        document.getElementById('trends-grid').appendChild(chartElement);
        
        // 清空輸入表單
        clearInputFields();
        
        // 顯示成功訊息
        showAlert(`成功新增圖表：${chartTitle}`, 'success');
        
    // 記錄到 Google Sheets
    if (window.addChartToSheets) {
        window.addChartToSheets({
            chartId,
            keyword,
            title: chartTitle,
            geo,
            time,
            created: new Date().toISOString()
        }).catch(err => {
            console.warn('Google Sheets API 新增失敗:', err);
            showAlert('雲端儲存失敗', 'warning');
        });
    }
    
    // 自動備份提醒（每5個圖表提醒一次）
    const chartCount = document.querySelectorAll('.trends-widget').length;
    if (chartCount % 5 === 0) {
        showBackupReminder();
    }    } catch (error) {
        console.error('新增圖表時發生錯誤:', error);
        showAlert('新增圖表失敗，請稍後再試', 'error');
    }
}

/**
 * 移除指定的圖表
 * @param {string} chartId - 圖表ID
 */
function removeChart(chartId) {
    const chart = document.getElementById(chartId);
    
    if (!chart) {
        console.warn(`找不到圖表 ${chartId}`);
        return;
    }
    
    const chartTitle = chart.querySelector('h3').textContent;
    
    if (confirm(`確定要移除圖表「${chartTitle}」嗎？`)) {
        // 添加移除動畫
        chart.style.transition = 'all 0.3s ease';
        chart.style.opacity = '0';
        chart.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            chart.remove();
            if (window.deleteChartFromSheets) {
                window.deleteChartFromSheets(chartId).catch(err => {
                    console.warn('Google Sheets API 刪除失敗:', err);
                    showAlert('雲端刪除失敗', 'warning');
                });
            }
            showAlert(`已移除圖表：${chartTitle}`, 'info');
        }, 300);
    }
}

/**
 * 匯出所有圖表設定
 */
function exportChartsConfig() {
    // 直接從 Google Sheets API 取得最新資料
    if (window.fetchCharts) {
        window.fetchCharts().then(charts => {
            const config = {
                exportDate: new Date().toISOString(),
                version: '1.0',
                charts: charts.map(chart => ({
                    id: chart.chartId || chart.id,
                    title: chart.title || chart.keyword,
                    keyword: chart.keyword,
                    geo: chart.geo,
                    time: chart.time,
                    url: chart.url || buildTrendsUrl(chart.keyword, chart.geo, chart.time)
                }))
            };
            downloadJSON(config, `google-trends-config-${getDateString()}.json`);
            showAlert('已匯出雲端設定', 'success');
        }).catch(err => {
            showAlert('雲端匯出失敗，請稍後再試', 'error');
        });
    }
}

/**
 * 匯入圖表設定
 * @param {File} file - 設定檔案
 */
function importChartsConfig(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const config = JSON.parse(e.target.result);
            if (!config.charts || !Array.isArray(config.charts)) {
                throw new Error('設定檔格式不正確');
            }
            // 呼叫 Google Sheets API 匯入
            if (window.importChartsToSheets) {
                window.importChartsToSheets(config.charts).then(res => {
                    // 匯入成功後同步前端顯示
                    window.fetchCharts().then(charts => {
                        const grid = document.getElementById('trends-grid');
                        grid.innerHTML = '';
                        chartCounter = 0;
                        charts.forEach(chart => {
                            const iframeUrl = buildTrendsUrl(chart.keyword, chart.geo, chart.time);
                            const chartElement = createChartElement(
                                chart.chartId || chart.id,
                                chart.title || chart.keyword,
                                iframeUrl
                            );
                            grid.appendChild(chartElement);
                            chartCounter++;
                        });
                        showAlert('匯入設定成功', 'success');
                    });
                }).catch(err => {
                    showAlert('雲端匯入失敗：' + err.message, 'error');
                });
            }
        } catch (error) {
            showAlert('匯入失敗：' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}

// ==================================================
// 輔助函數
// ==================================================

/**
 * 構建 Google Trends iframe URL
 * @param {string} keyword - 關鍵字
 * @param {string} geo - 地區代碼
 * @param {string} time - 時間範圍
 * @returns {string} iframe URL
 */
function buildTrendsUrl(keyword, geo, time) {
    const reqObj = {
        comparisonItem: [{
            keyword: keyword,
            geo: geo,
            time: time
        }],
        category: 0,
        property: ""
    };

    const reqString = encodeURIComponent(JSON.stringify(reqObj));
    const eqString = `q=${encodeURIComponent(keyword)}&date=${encodeURIComponent(time)}&geo=${geo}`;
    
    return `https://trends.google.com/trends/embed/explore/TIMESERIES?req=${reqString}&tz=-480&eq=${encodeURIComponent(eqString)}`;
}

/**
 * 創建圖表DOM元素
 * @param {string} chartId - 圖表ID
 * @param {string} chartTitle - 圖表標題
 * @param {string} iframeUrl - iframe URL
 * @returns {HTMLElement} 圖表DOM元素
 */
function createChartElement(chartId, chartTitle, iframeUrl, emoji = '📊') {
    const chartDiv = document.createElement('div');
    chartDiv.className = 'trends-widget';
    chartDiv.id = chartId;
    
    // 如果標題中沒有包含 "搜尋趨勢"，則添加
    const title = chartTitle.includes('搜尋趨勢') ? chartTitle : `${chartTitle} - 搜尋趨勢`;
    
    chartDiv.innerHTML = `
        <button class="btn-remove" onclick="removeChart('${chartId}')" title="移除圖表">✕</button>
        <h3>${emoji} ${escapeHtml(title)}</h3>
        <iframe class="chart-iframe" 
                src="${iframeUrl}" 
                title="${escapeHtml(chartTitle)} Google Trends"
                loading="lazy">
        </iframe>
    `;
    
    return chartDiv;
}

/**
 * 從設定創建圖表元素
 * @param {Object} config - 圖表設定
 * @returns {HTMLElement} 圖表DOM元素
 */
function createChartElementFromConfig(config) {
    const chartDiv = document.createElement('div');
    chartDiv.className = 'trends-widget';
    chartDiv.id = config.id;
    
    chartDiv.innerHTML = `
        <button class="btn-remove" onclick="removeChart('${config.id}')" title="移除圖表">✕</button>
        <h3>${escapeHtml(config.title)}</h3>
        <iframe class="chart-iframe" 
                src="${config.url}" 
                title="${escapeHtml(config.title)}"
                loading="lazy">
        </iframe>
    `;
    
    return chartDiv;
}

/**
 * 清空輸入表單
 */
function clearInputFields() {
    document.getElementById('keyword-input').value = '';
    document.getElementById('title-input').value = '';
}

/**
 * HTML 轉義
 * @param {string} text - 待轉義文字
 * @returns {string} 轉義後的文字
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 顯示提示訊息
 * @param {string} message - 訊息內容
 * @param {string} type - 訊息類型 (success, warning, error, info)
 */
function showAlert(message, type = 'info') {
    // 創建提示元素
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    // 設置背景顏色
    const colors = {
        success: '#28a745',
        warning: '#ffc107',
        error: '#dc3545',
        info: '#17a2b8'
    };
    alert.style.backgroundColor = colors[type] || colors.info;
    
    // 添加到頁面
    document.body.appendChild(alert);
    
    // 3秒後自動移除
    setTimeout(() => {
        alert.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 300);
    }, 3000);
}

/**
 * 下載JSON檔案
 * @param {Object} data - 資料物件
 * @param {string} filename - 檔案名稱
 */
function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * 取得格式化的日期字串
 * @returns {string} YYYY-MM-DD 格式的日期
 */
function getDateString() {
    return new Date().toISOString().split('T')[0];
}

/**
 * 儲存圖表到本地存儲
 * @param {string} chartId - 圖表ID
 * @param {string} keyword - 關鍵字
 * @param {string} title - 標題
 * @param {string} geo - 地區
 * @param {string} time - 時間範圍
 */
function saveChartToStorage(chartId, keyword, title, geo, time) {
    try {
        const charts = JSON.parse(localStorage.getItem('trendsCharts') || '[]');
        charts.push({ chartId, keyword, title, geo, time, created: new Date().toISOString() });
        localStorage.setItem('trendsCharts', JSON.stringify(charts));
    } catch (error) {
        console.warn('無法儲存到本地存儲:', error);
    }
}

/**
 * 從本地存儲移除圖表
 * @param {string} chartId - 圖表ID
 */
function removeChartFromStorage(chartId) {
    try {
        const charts = JSON.parse(localStorage.getItem('trendsCharts') || '[]');
        const filteredCharts = charts.filter(chart => chart.chartId !== chartId);
        localStorage.setItem('trendsCharts', JSON.stringify(filteredCharts));
    } catch (error) {
        console.warn('無法從本地存儲移除:', error);
    }
}

// ==================================================
// 事件監聽器設置
// ==================================================

/**
 * 初始化事件監聽器
 */
function initializeEventListeners() {
    // Enter 鍵快速新增圖表
    document.getElementById('keyword-input')?.addEventListener('keypress', handleEnterKey);
    document.getElementById('title-input')?.addEventListener('keypress', handleEnterKey);
    
    // 表單驗證
    document.getElementById('keyword-input')?.addEventListener('input', validateInputs);
    
    // 防止重複提交
    document.querySelector('.btn')?.addEventListener('click', debounce(addNewChart, 1000));
}

/**
 * 處理 Enter 鍵事件
 * @param {KeyboardEvent} event - 鍵盤事件
 */
function handleEnterKey(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        addNewChart();
    }
}

/**
 * 驗證輸入欄位
 */
function validateInputs() {
    const keyword = document.getElementById('keyword-input').value.trim();
    const submitBtn = document.querySelector('.btn');
    
    if (submitBtn) {
        submitBtn.disabled = !keyword;
        submitBtn.style.opacity = keyword ? '1' : '0.6';
    }
}

/**
 * 防抖函數
 * @param {Function} func - 要執行的函數
 * @param {number} delay - 延遲時間
 * @returns {Function} 防抖後的函數
 */
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// ==================================================
// 初始化與載入
// ==================================================

/**
 * DOM 載入完成後初始化
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Google Trends Dashboard 已載入');
    
    // 初始化事件監聽器
    initializeEventListeners();
    
    // 初始化表單驗證
    validateInputs();
    
    // 添加 CSS 動畫
    addCSSAnimations();
    
    console.log('✅ 初始化完成');
});

/**
 * 添加 CSS 動畫
 */
function addCSSAnimations() {
    if (!document.getElementById('dashboard-animations')) {
        const style = document.createElement('style');
        style.id = 'dashboard-animations';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            
            .trends-widget {
                animation: fadeInUp 0.5s ease;
            }
            
            @keyframes fadeInUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

// ==================================================
// RSS 熱門搜尋功能
// ==================================================

/**
 * 載入 Google Trends RSS 熱門搜尋
 */
async function loadTrendingSearches() {
    const container = document.getElementById('rss-container');
    
    try {
        // 使用 RSS2JSON API 來解析 RSS (由於 CORS 限制)
        const rssUrl = 'https://trends.google.com.tw/trending/rss?geo=TW';
        const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
        
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.status !== 'ok') {
            throw new Error(data.message || 'RSS 解析失敗');
        }
        
        displayRSSItems(data.items);
        
    } catch (error) {
        console.error('載入 RSS 失敗:', error);
        displayRSSError(error.message);
    }
}

/**
 * 顯示 RSS 項目
 * @param {Array} items - RSS 項目陣列
 */
function displayRSSItems(items) {
    const container = document.getElementById('rss-container');
    
    if (!items || items.length === 0) {
        container.innerHTML = '<p class="loading-message">暫無熱門搜尋資料</p>';
        return;
    }
    
    const itemsHtml = items.slice(0, 20).map((item, index) => {
        const title = item.title || '未知搜尋';
        const traffic = extractTrafficInfo(item.description) || `#${index + 1}`;
        const link = item.link || '#';
        
        return `
            <div class="rss-item" onclick="openTrendsLink('${escapeHtml(link)}')">
                <div class="rss-item-title">${escapeHtml(title)}</div>
                <span class="rss-item-traffic">${escapeHtml(traffic)}</span>
            </div>
        `;
    }).join('');
    
    container.innerHTML = itemsHtml;
}

/**
 * 顯示 RSS 載入錯誤
 * @param {string} errorMessage - 錯誤訊息
 */
function displayRSSError(errorMessage) {
    const container = document.getElementById('rss-container');
    container.innerHTML = `
        <div class="loading-message" style="color: #dc3545;">
            <strong>載入失敗</strong><br>
            ${escapeHtml(errorMessage)}<br><br>
            <button class="btn" onclick="loadTrendingSearches()" style="padding: 8px 16px; font-size: 12px;">
                重新載入
            </button>
        </div>
    `;
}

/**
 * 從描述中提取流量資訊
 * @param {string} description - RSS 項目描述
 * @returns {string} 流量資訊
 */
function extractTrafficInfo(description) {
    if (!description) return null;
    
    // 嘗試提取搜尋量或其他數值資訊
    const patterns = [
        /(\d+(?:,\d+)*(?:\.\d+)?[KMB]?\+?\s*searches?)/i,
        /(\d+(?:,\d+)*(?:\.\d+)?[KMB]?\+?)/,
        /(熱門度:\s*\d+)/i
    ];
    
    for (const pattern of patterns) {
        const match = description.match(pattern);
        if (match) {
            return match[1];
        }
    }
    
    return null;
}

/**
 * 開啟 Google Trends 連結
 * @param {string} link - 連結 URL
 */
function openTrendsLink(link) {
    if (link && link !== '#') {
        window.open(link, '_blank', 'noopener,noreferrer');
    }
}

/**
 * 定期更新 RSS 資料
 */
function startRSSUpdater() {
    // 立即載入一次
    loadTrendingSearches();
    
    // 每 10 分鐘更新一次
    setInterval(loadTrendingSearches, 10 * 60 * 1000);
}

// ==================================================
// 更新初始化函數
// ==================================================

/**
 * DOM 載入完成後初始化 (更新版)
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Google Trends Dashboard 已載入');
    
    // 初始化事件監聽器
    initializeEventListeners();
    // 初始化表單驗證
    validateInputs();
    // 添加 CSS 動畫
    addCSSAnimations();
    // 啟動 RSS 更新器
    startRSSUpdater();
    // 載入 Google Sheets 雲端圖表
    if (window.fetchCharts) {
        window.fetchCharts().then(charts => {
            const grid = document.getElementById('trends-grid');
            grid.innerHTML = '';
            chartCounter = 0;
            charts.forEach(chart => {
                const iframeUrl = buildTrendsUrl(chart.keyword, chart.geo, chart.time);
                const chartElement = createChartElement(
                    chart.chartId || chart.id,
                    chart.title || chart.keyword,
                    iframeUrl
                );
                grid.appendChild(chartElement);
                chartCounter++;
            });
            showAlert('已載入雲端圖表', 'info');
        }).catch(err => {
            console.warn('Google Sheets API 載入失敗:', err);
            showAlert('雲端載入失敗，使用本地預設', 'warning');
            loadDefaultConfig();
        });
    } else {
        loadDefaultConfig();
    }
    console.log('✅ 初始化完成，包含 RSS 熱門搜尋');
});

// ==================================================
// 圖表設定檔案管理功能
// ==================================================

/**
 * 切換設定面板顯示/隱藏
 */
function toggleConfigPanel() {
    const panel = document.getElementById('config-panel');
    if (panel.style.display === 'none' || panel.style.display === '') {
        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
    }
}

/**
 * 載入設定檔案
 */
function loadConfigFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 更新當前檔案資訊顯示
    updateCurrentFileInfo(file.name, file.webkitRelativePath || file.name);

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const csvData = e.target.result;
            const config = parseCSVToConfig(csvData);
            if (validateConfigFormat(config)) {
                applyConfig(config);
                showAlert('CSV 設定檔案載入成功！', 'success');
            } else {
                showAlert('CSV 檔案格式不正確', 'error');
                updateCurrentFileInfo('', '');
            }
        } catch (error) {
            console.error('載入設定檔案失敗:', error);
            showAlert('CSV 檔案載入失敗，請檢查檔案格式', 'error');
            updateCurrentFileInfo('', '');
        }
    };
    reader.readAsText(file);
}

/**
 * 匯出當前設定
 */
function exportCurrentConfig() {
    const charts = getCurrentChartsConfig();
    const csvData = configToCSV(charts);
    
    const dataBlob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'trends.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showAlert('CSV 設定檔案匯出成功！', 'success');
}

/**
 * 重置為預設設定
 */
/**
 * 顯示備份提醒
 */
function showBackupReminder() {
    if (confirm('💾 建議定期備份您的圖表設定！\n\n是否現在匯出 CSV 備份檔？')) {
        exportCurrentConfig();
    }
}

/**
 * 載入預設配置檔案
 */
function loadDefaultConfig() {
    fetch('config/trends.csv')
        .then(response => {
            if (response.ok) {
                return response.text();
            }
            throw new Error('無法載入預設設定檔');
        })
        .then(csvData => {
            const config = parseCSVToConfig(csvData);
            if (validateConfigFormat(config)) {
                applyConfig(config);
                console.log('✅ 已載入預設 trends.csv 設定檔');
            }
        })
        .catch(error => {
            console.log('ℹ️ 未找到預設設定檔，使用內建預設圖表');
            // 如果沒有外部檔案，保持現有的 HTML 預設圖表
        });
}

/**
 * 更新當前檔案資訊顯示
 */
function updateCurrentFileInfo(fileName, filePath) {
    const infoElement = document.getElementById('current-file-info');
    if (fileName) {
        infoElement.textContent = fileName;
    } else {
        infoElement.innerHTML = '<small>尚未載入外部檔案（使用預設設定）</small>';
    }
}

/**
 * 解析 CSV 數據為設定格式
 */
function parseCSVToConfig(csvData) {
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const charts = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length >= 4) {
            charts.push({
                id: `chart-${i}`,
                title: values[0] || `圖表 ${i}`,
                keyword: values[1] || '',
                geo: values[2] || 'TW',
                time: values[3] || 'today 1-m',
                emoji: values[4] || '📊',
                isDefault: false
            });
        }
    }
    
    return { charts: charts };
}

/**
 * 解析 CSV 行（處理逗號和引號）
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

/**
 * 將設定轉換為 CSV 格式
 */
function configToCSV(charts) {
    const headers = ['title', 'keyword', 'geo', 'time', 'emoji'];
    let csv = headers.join(',') + '\n';
    
    charts.forEach(chart => {
        const row = [
            `"${chart.title.replace(/"/g, '""')}"`,
            `"${chart.keyword.replace(/"/g, '""')}"`,
            chart.geo,
            chart.time,
            chart.emoji
        ];
        csv += row.join(',') + '\n';
    });
    
    return csv;
}

/**
 * 驗證設定檔案格式
 */
function validateConfigFormat(config) {
    return config && 
           config.charts && 
           Array.isArray(config.charts) &&
           config.charts.length > 0 &&
           config.charts.every(chart => 
               chart.title && 
               chart.keyword && 
               chart.geo !== undefined && 
               chart.time
           );
}

/**
 * 應用設定
 */
function applyConfig(config) {
    // 清除現有圖表
    const gridContainer = document.getElementById('trends-grid');
    gridContainer.innerHTML = '';
    
    // 重置計數器
    chartCounter = 0;
    
    // 應用新設定
    config.charts.forEach(chartConfig => {
        const iframeUrl = buildTrendsUrl(chartConfig.keyword, chartConfig.geo, chartConfig.time);
        const chartElement = createChartElement(
            chartConfig.id, 
            chartConfig.title, 
            iframeUrl,
            chartConfig.emoji
        );
        gridContainer.appendChild(chartElement);
        chartCounter = Math.max(chartCounter, parseInt(chartConfig.id.split('-')[1]) || 0);
    });
}

/**
 * 獲取當前圖表設定
 */
function getCurrentChartsConfig() {
    const charts = [];
    const chartElements = document.querySelectorAll('.trends-widget');
    
    chartElements.forEach(element => {
        const id = element.id;
        const titleElement = element.querySelector('h3');
        const iframe = element.querySelector('iframe');
        
        if (titleElement && iframe) {
            const title = titleElement.textContent.trim();
            const url = iframe.src;
            
            // 從 URL 解析參數
            const urlParams = new URLSearchParams(url.split('?')[1] || '');
            const keyword = extractKeywordFromUrl(url);
            const geo = extractGeoFromUrl(url);
            const time = extractTimeFromUrl(url);
            const emoji = titleElement.textContent.match(/^[\u{1F300}-\u{1F9FF}]/u)?.[0] || '📊';
            
            charts.push({
                id: id,
                title: title,
                keyword: keyword,
                geo: geo,
                time: time,
                emoji: emoji,
                isDefault: element.hasAttribute('data-default')
            });
        }
    });
    
    return charts;
}

/**
 * 從 URL 提取關鍵字
 */
function extractKeywordFromUrl(url) {
    // 簡化實作，實際可能需要更複雜的 URL 解析
    try {
        const matches = url.match(/keyword.*?%22([^%]+)%22/);
        return matches ? decodeURIComponent(matches[1]) : '';
    } catch {
        return '';
    }
}

/**
 * 從 URL 提取地區
 */
function extractGeoFromUrl(url) {
    try {
        const matches = url.match(/geo%22%3A%22([^%]*)%22/);
        return matches ? matches[1] : 'TW';
    } catch {
        return 'TW';
    }
}

/**
 * 從 URL 提取時間範圍
 */
function extractTimeFromUrl(url) {
    try {
        const matches = url.match(/time%22%3A%22([^%]+)%22/);
        return matches ? decodeURIComponent(matches[1]) : 'today 1-m';
    } catch {
        return 'today 1-m';
    }
}



// 全域暴露必要函數
window.addNewChart = addNewChart;
window.removeChart = removeChart;
window.exportChartsConfig = exportChartsConfig;
window.importChartsConfig = importChartsConfig;
window.loadTrendingSearches = loadTrendingSearches;
window.openTrendsLink = openTrendsLink;
window.toggleConfigPanel = toggleConfigPanel;
window.loadConfigFile = loadConfigFile;
window.exportCurrentConfig = exportCurrentConfig;