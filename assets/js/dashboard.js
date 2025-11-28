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