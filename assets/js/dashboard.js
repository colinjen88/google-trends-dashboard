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
    const property = document.getElementById('property-select') ? document.getElementById('property-select').value : '';

    // 驗證必填欄位
    if (!keyword) {
        showAlert('請輸入關鍵字', 'warning');
        document.getElementById('keyword-input').focus();
        return;
    }

    // 處理多個關鍵字
    const keywords = keyword.split(',').map(k => k.trim()).filter(k => k);
    
    keywords.forEach((k, index) => {
        // 生成唯一ID
        const chartId = `chart-${Date.now()}-${index}`;
        const chartTitle = title || k;
        
        // 建立 URL
        const iframeUrl = buildTrendsUrl(k, geo, time, property);
        
        // 建立並添加圖表元素
        const chartElement = createChartElement(chartId, chartTitle, iframeUrl);
        document.getElementById('trends-grid').appendChild(chartElement);
        
        // 儲存到本地
        saveChartToStorage(chartId, k, chartTitle, geo, time);
    });

    clearInputFields();
}

/**
 * 移除圖表
 */
function removeChart(chartId) {
    const chart = document.getElementById(chartId);
    if (chart) {
        chart.remove();
        removeChartFromStorage(chartId);
    }
}

/**
 * 構建 Google Trends Embed URL
 */
function buildTrendsUrl(keyword, geo, time, property = '') {
    const req = {
        comparisonItem: [{
            keyword: keyword,
            geo: geo,
            time: time
        }],
        category: 0,
        property: property
    };
    
    const query = encodeURIComponent(keyword);
    const date = encodeURIComponent(time);
    
    return `https://trends.google.com/trends/embed/explore/TIMESERIES?req=${JSON.stringify(req)}&tz=-480&eq=q%3D${query}%26date%3D${date}%26geo%3D${geo}`;
}

/**
 * 建立圖表 DOM 元素
 */
function createChartElement(id, title, iframeUrl, emoji = '📊') {
    const article = document.createElement('article');
    article.className = 'trends-widget';
    article.id = id;
    
    article.innerHTML = `
        <button class="btn-remove" onclick="removeChart('${id}')" title="移除此圖表">✕</button>
        <h3>${emoji} ${escapeHtml(title)}</h3>
        <iframe class="chart-iframe"
            src="${iframeUrl}"
            loading="lazy"
            style="border-radius: 2px; box-shadow: rgba(0, 0, 0, 0.12) 0px 0px 2px 0px, rgba(0, 0, 0, 0.24) 0px 2px 2px 0px;">
        </iframe>
    `;
    
    return article;
}

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

/**
 * 載入熱門搜尋 (RSS)
 */
async function loadTrendingSearches() {
    const rssContainer = document.getElementById('rss-container');
    if (!rssContainer) return;

    // 先顯示備用內容，如果 RSS 能成功載入則覆蓋
    // 這樣可以確保用戶不會看到永遠載入中的狀態
    displayFallbackContent(rssContainer);

    // Google Trends RSS 來源
    const rssUrl = 'https://trends.google.com.tw/trending/rss?geo=TW';
    
    // 多個 CORS 代理服務（按優先順序嘗試）
    const corsProxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(rssUrl)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(rssUrl)}`
    ];

    // 嘗試透過 CORS 代理獲取即時資料
    for (const proxyUrl of corsProxies) {
        try {
            // 加入超時機制 (5秒)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(proxyUrl, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Accept': 'application/rss+xml, application/xml, text/xml'
                }
            });
            
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            // 檢查是否成功解析 XML
            const items = xmlDoc.querySelectorAll('item');
            if (items.length === 0) {
                throw new Error('No items found');
            }

            // 成功獲取資料，顯示熱門搜尋
            displayTrendingItems(items, rssContainer);
            console.log('✅ 熱門搜尋載入成功 (即時資料)');
            return; // 成功後退出
        } catch (error) {
            console.warn(`CORS 代理失敗: ${proxyUrl}`, error.message);
            continue; // 嘗試下一個代理
        }
    }

    // 如果所有代理都失敗，備用內容已經顯示，這裡只需記錄
    console.log('ℹ️ 使用備用熱門關鍵字');
}

/**
 * 顯示熱門搜尋項目
 */
function displayTrendingItems(items, container) {
    let html = '<div class="trending-tags">';
    
    items.forEach((item, index) => {
        if (index >= 20) return; // 最多顯示 20 個項目
        
        const title = item.querySelector('title')?.textContent || '';
        const traffic = item.querySelector('ht\\:approx_traffic, approx_traffic')?.textContent || '';
        const newsUrl = item.querySelector('ht\\:news_item_url, news_item_url')?.textContent || '';
        
        if (title) {
            html += `
                <div class="trending-tag" onclick="addTrendingKeyword('${escapeHtml(title)}')" title="點擊新增「${escapeHtml(title)}」圖表">
                    <span class="tag-title">🔥 ${escapeHtml(title)}</span>
                    ${traffic ? `<span class="tag-traffic">${traffic}</span>` : ''}
                </div>
            `;
        }
    });
    
    html += '</div>';
    html += `
        <div class="trending-footer">
            <small>💡 點擊關鍵字可快速新增圖表 | 資料來源：Google Trends</small>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * 顯示備用內容（當 RSS 載入失敗時）
 */
function displayFallbackContent(container) {
    // 顯示一些常見的熱門關鍵字作為備用
    const fallbackKeywords = [
        '台股', 'AI', '比特幣', '房價', '匯率', 
        '黃金', 'iPhone', 'Netflix', '旅遊', '美食'
    ];
    
    let html = '<div class="trending-tags fallback">';
    
    fallbackKeywords.forEach(keyword => {
        html += `
            <div class="trending-tag" onclick="addTrendingKeyword('${keyword}')" title="點擊新增「${keyword}」圖表">
                <span class="tag-title">📊 ${keyword}</span>
            </div>
        `;
    });
    
    html += '</div>';
    html += `
        <div class="trending-footer">
            <p><a href="https://trends.google.com.tw/trends/trendingsearches/daily?geo=TW" target="_blank">
                👉 查看 Google Trends 即時熱門搜尋
            </a></p>
            <small>💡 上方為熱門推薦關鍵字，點擊可快速新增圖表</small>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * 從熱門搜尋新增關鍵字圖表
 */
function addTrendingKeyword(keyword) {
    // 設定關鍵字到輸入框
    const keywordInput = document.getElementById('keyword-input');
    if (keywordInput) {
        keywordInput.value = keyword;
    }
    
    // 直接新增圖表
    addNewChart();
    
    // 顯示提示
    showAlert(`已新增「${keyword}」趨勢圖表`, 'success');
}

// 暴露新函數到全域
window.addTrendingKeyword = addTrendingKeyword;

/**
 * 開啟 Google Trends 連結
 */
function openTrendsLink(keyword) {
    const url = `https://trends.google.com.tw/trends/explore?q=${encodeURIComponent(keyword)}&geo=TW`;
    window.open(url, '_blank');
}

// 全域暴露必要函數
window.addNewChart = addNewChart;
window.removeChart = removeChart;
window.exportChartsConfig = exportChartsConfig;
// window.importChartsConfig = importChartsConfig; // 尚未實作
window.loadTrendingSearches = loadTrendingSearches;
window.openTrendsLink = openTrendsLink;
window.toggleConfigPanel = toggleConfigPanel;
window.loadConfigFile = loadConfigFile;
window.exportCurrentConfig = exportCurrentConfig;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadDefaultConfig();
    loadTrendingSearches();
});