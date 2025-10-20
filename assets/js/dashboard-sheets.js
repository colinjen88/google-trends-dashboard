/**
 * Google Trends Dashboard - Google Sheets 整合版本
 * 支援 Google Sheets 作為後端儲存
 */

// Google Apps Script Web App URL（請替換為您的實際 URL）
const GOOGLE_SHEETS_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';

// 儲存模式設定
let storageMode = 'local'; // 'local' 或 'sheets'

// RSS 相關設定
const RSS_PROXY = 'https://api.rss2json.com/v1/api.json?rss_url=';
const RSS_URL = 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=TW';
let rssUpdateInterval;

// 預設圖表設定
const DEFAULT_CHARTS = [
    { title: '黃金價格趨勢', keyword: '黃金價格', geo: 'TW', time: 'today 12-m', emoji: '💰' },
    { title: '投資黃金', keyword: '投資 黃金', geo: 'TW', time: 'today 12-m', emoji: '📈' },
    { title: '黃金存摺', keyword: '黃金存摺', geo: 'TW', time: 'today 12-m', emoji: '🏦' },
    { title: '金價走勢', keyword: '金價', geo: 'TW', time: 'today 12-m', emoji: '💎' }
];

// ================== Google Sheets 整合功能 ==================

/**
 * 設定 Google Sheets 整合
 */
function setupGoogleSheets(webAppUrl) {
    if (!webAppUrl || webAppUrl === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
        alert('請先設定 Google Apps Script Web App URL');
        return false;
    }
    
    // 更新全域變數
    window.GOOGLE_SHEETS_URL = webAppUrl;
    storageMode = 'sheets';
    
    // 儲存設定到 localStorage
    localStorage.setItem('googleSheetsUrl', webAppUrl);
    localStorage.setItem('storageMode', 'sheets');
    
    // 測試連線
    testGoogleSheetsConnection();
    
    return true;
}

/**
 * 測試 Google Sheets 連線
 */
async function testGoogleSheetsConnection() {
    try {
        const response = await fetch(`${window.GOOGLE_SHEETS_URL}?action=getCharts`);
        const data = await response.json();
        
        if (data.success) {
            showNotification('Google Sheets 連線成功！', 'success');
            loadChartsFromSheets();
        } else {
            throw new Error(data.error || '連線失敗');
        }
    } catch (error) {
        console.error('Google Sheets 連線失敗:', error);
        showNotification('Google Sheets 連線失敗，已切換到本地儲存模式', 'warning');
        storageMode = 'local';
    }
}

/**
 * 從 Google Sheets 載入圖表
 */
async function loadChartsFromSheets() {
    try {
        const response = await fetch(`${window.GOOGLE_SHEETS_URL}?action=getCharts`);
        const data = await response.json();
        
        if (data.success) {
            charts = data.charts || [];
            updateChartsDisplay();
            showNotification('已從 Google Sheets 同步圖表資料', 'success');
        } else {
            throw new Error(data.error || '載入失敗');
        }
    } catch (error) {
        console.error('從 Google Sheets 載入失敗:', error);
        showNotification('載入失敗，使用本地資料', 'warning');
        loadChartsFromLocal();
    }
}

/**
 * 新增圖表到 Google Sheets
 */
async function addChartToSheets(chart) {
    try {
        const response = await fetch(window.GOOGLE_SHEETS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'addChart',
                ...chart
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('圖表已新增到 Google Sheets', 'success');
            loadChartsFromSheets(); // 重新載入以獲取最新資料
        } else {
            throw new Error(data.error || '新增失敗');
        }
    } catch (error) {
        console.error('新增到 Google Sheets 失敗:', error);
        showNotification('新增失敗，已儲存到本地', 'warning');
        addChartToLocal(chart);
    }
}

/**
 * 匯入圖表到 Google Sheets
 */
async function importChartsToSheets(charts) {
    try {
        const response = await fetch(window.GOOGLE_SHEETS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'importCharts',
                charts: charts
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('CSV 資料已匯入到 Google Sheets', 'success');
            loadChartsFromSheets();
        } else {
            throw new Error(data.error || '匯入失敗');
        }
    } catch (error) {
        console.error('匯入到 Google Sheets 失敗:', error);
        showNotification('匯入失敗', 'error');
    }
}

// ================== 本地儲存功能 ==================

/**
 * 從本地儲存載入圖表
 */
function loadChartsFromLocal() {
    const saved = localStorage.getItem('trendsCharts');
    if (saved) {
        try {
            charts = JSON.parse(saved);
        } catch (error) {
            console.error('載入本地資料失敗:', error);
            charts = [...DEFAULT_CHARTS];
        }
    } else {
        charts = [...DEFAULT_CHARTS];
    }
    updateChartsDisplay();
}

/**
 * 新增圖表到本地儲存
 */
function addChartToLocal(chart) {
    charts.unshift(chart);
    localStorage.setItem('trendsCharts', JSON.stringify(charts));
    updateChartsDisplay();
    showNotification('圖表已新增到本地儲存', 'success');
}

/**
 * 儲存圖表到本地
 */
function saveChartsToLocal() {
    localStorage.setItem('trendsCharts', JSON.stringify(charts));
}

// ================== 通用功能 ==================

let charts = [];

/**
 * 初始化應用程式
 */
function initApp() {
    // 載入設定
    const savedUrl = localStorage.getItem('googleSheetsUrl');
    const savedMode = localStorage.getItem('storageMode');
    
    if (savedUrl && savedMode === 'sheets') {
        window.GOOGLE_SHEETS_URL = savedUrl;
        storageMode = 'sheets';
        loadChartsFromSheets();
    } else {
        storageMode = 'local';
        loadChartsFromLocal();
    }
    
    // 載入 RSS
    loadRSSFeeds();
    
    // 設定自動備份提醒
    setupBackupReminder();
    
    // 綁定事件
    setupEventListeners();
}

/**
 * 設定事件監聽器
 */
function setupEventListeners() {
    // 表單提交
    document.getElementById('add-chart-form').addEventListener('submit', handleAddChart);
    
    // 檔案管理
    document.getElementById('config-btn').addEventListener('click', toggleConfigPanel);
    document.getElementById('close-config').addEventListener('click', closeConfigPanel);
    document.getElementById('export-csv').addEventListener('click', exportToCSV);
    document.getElementById('import-csv').addEventListener('change', handleCSVImport);
    document.getElementById('upload-csv').addEventListener('click', () => {
        document.getElementById('import-csv').click();
    });
    
    // Google Sheets 設定
    document.getElementById('setup-sheets').addEventListener('click', showGoogleSheetsSetup);
    document.getElementById('switch-local').addEventListener('click', switchToLocalStorage);
    
    // 點擊外部關閉面板
    document.addEventListener('click', (e) => {
        const configPanel = document.getElementById('config-panel');
        const configBtn = document.getElementById('config-btn');
        
        if (!configPanel.contains(e.target) && !configBtn.contains(e.target)) {
            closeConfigPanel();
        }
    });
}

/**
 * 處理新增圖表
 */
function handleAddChart(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const keyword = formData.get('keyword').trim();
    const customTitle = formData.get('title').trim();
    const geo = formData.get('geo') || 'TW';
    const time = formData.get('time') || 'today 12-m';
    
    if (!keyword) {
        showNotification('請輸入關鍵字', 'error');
        return;
    }
    
    const title = customTitle || keyword;
    const emoji = getRandomEmoji();
    
    const newChart = {
        title,
        keyword,
        geo,
        time,
        emoji,
        id: Date.now()
    };
    
    // 根據儲存模式選擇相應的方法
    if (storageMode === 'sheets' && window.GOOGLE_SHEETS_URL) {
        addChartToSheets(newChart);
    } else {
        addChartToLocal(newChart);
    }
    
    // 清空表單
    e.target.reset();
}

/**
 * 顯示 Google Sheets 設定對話框
 */
function showGoogleSheetsSetup() {
    const url = prompt(
        '請輸入您的 Google Apps Script Web App URL:\n\n' +
        '1. 請先參考 docs/GOOGLE_SHEETS_INTEGRATION.md 完成設定\n' +
        '2. 在 Apps Script 中部署為 Web App\n' +
        '3. 將 Web App URL 貼到下方:',
        localStorage.getItem('googleSheetsUrl') || ''
    );
    
    if (url) {
        if (setupGoogleSheets(url)) {
            updateStorageModeDisplay();
        }
    }
}

/**
 * 切換到本地儲存模式
 */
function switchToLocalStorage() {
    if (confirm('確定要切換到本地儲存模式嗎？\n\n注意：您需要手動匯出 CSV 來備份資料。')) {
        storageMode = 'local';
        localStorage.setItem('storageMode', 'local');
        loadChartsFromLocal();
        updateStorageModeDisplay();
        showNotification('已切換到本地儲存模式', 'info');
    }
}

/**
 * 更新儲存模式顯示
 */
function updateStorageModeDisplay() {
    const statusElement = document.getElementById('storage-status');
    if (statusElement) {
        if (storageMode === 'sheets') {
            statusElement.innerHTML = `
                <span class="status-indicator success"></span>
                已連接 Google Sheets
            `;
        } else {
            statusElement.innerHTML = `
                <span class="status-indicator warning"></span>
                本地儲存模式
            `;
        }
    }
}

// ================== 其他功能（保持不變）==================

/**
 * 生成隨機 emoji
 */
function getRandomEmoji() {
    const emojis = ['📈', '📊', '💰', '🎯', '🔍', '📱', '💻', '🏢', '🌟', '⭐', '💎', '🏆', '🎉', '🚀', '⚡'];
    return emojis[Math.floor(Math.random() * emojis.length)];
}

/**
 * 更新圖表顯示
 */
function updateChartsDisplay() {
    const container = document.getElementById('trends-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    charts.forEach((chart, index) => {
        const chartCard = createChartCard(chart, index);
        container.appendChild(chartCard);
    });
    
    updateConfigDisplay();
}

/**
 * 創建圖表卡片
 */
function createChartCard(chart, index) {
    const card = document.createElement('div');
    card.className = 'chart-card';
    
    const encodedKeyword = encodeURIComponent(chart.keyword);
    const embedUrl = `https://trends.google.com/trends/embed/explore/TIMESERIES?hl=zh-TW&tz=-480&q=${encodedKeyword}&geo=${chart.geo}&gprop=&date=${chart.time}`;
    
    card.innerHTML = `
        <div class="chart-header">
            <h3>${chart.emoji} ${chart.title}</h3>
            <button class="btn-icon" onclick="removeChart(${index})" title="移除圖表" aria-label="移除 ${chart.title}">
                <span>×</span>
            </button>
        </div>
        <div class="chart-container">
            <iframe 
                src="${embedUrl}" 
                frameborder="0" 
                scrolling="no"
                loading="lazy"
                title="${chart.title} - Google Trends"
                aria-label="Google Trends 圖表：${chart.title}">
            </iframe>
        </div>
        <div class="chart-info">
            <small>關鍵字：${chart.keyword} | 地區：${chart.geo} | 時間：${getTimeLabel(chart.time)}</small>
        </div>
    `;
    
    return card;
}

/**
 * 移除圖表
 */
function removeChart(index) {
    if (confirm('確定要移除這個圖表嗎？')) {
        charts.splice(index, 1);
        
        if (storageMode === 'sheets' && window.GOOGLE_SHEETS_URL) {
            // 對於 Google Sheets，需要重新同步整個列表
            importChartsToSheets(charts);
        } else {
            saveChartsToLocal();
        }
        
        updateChartsDisplay();
        showNotification('圖表已移除', 'info');
    }
}

/**
 * 獲取時間標籤
 */
function getTimeLabel(timeValue) {
    const timeLabels = {
        'now 7-d': '過去7天',
        'today 1-m': '過去30天',
        'today 3-m': '過去3個月',
        'today 12-m': '過去12個月',
        'today 5-y': '過去5年',
        'all': '所有時間'
    };
    return timeLabels[timeValue] || timeValue;
}

// ================== CSV 功能（修改以支援 Google Sheets）==================

/**
 * 匯出為 CSV
 */
function exportToCSV() {
    if (charts.length === 0) {
        showNotification('沒有圖表可以匯出', 'warning');
        return;
    }
    
    const headers = ['title', 'keyword', 'geo', 'time', 'emoji'];
    const csvContent = [
        headers.join(','),
        ...charts.map(chart => 
            headers.map(header => `"${(chart[header] || '').toString().replace(/"/g, '""')}"`).join(',')
        )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `trends-charts-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('CSV 檔案已下載', 'success');
    }
}

/**
 * 處理 CSV 匯入
 */
function handleCSVImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
        showNotification('請選擇 CSV 檔案', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const csv = e.target.result;
            const lines = csv.split('\n').filter(line => line.trim());
            
            if (lines.length < 2) {
                throw new Error('CSV 檔案格式不正確');
            }
            
            const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
            const importedCharts = [];
            
            for (let i = 1; i < lines.length; i++) {
                const values = parseCSVLine(lines[i]);
                if (values.length === headers.length) {
                    const chart = {};
                    headers.forEach((header, index) => {
                        chart[header] = values[index];
                    });
                    
                    if (chart.title && chart.keyword) {
                        chart.id = Date.now() + i;
                        importedCharts.push(chart);
                    }
                }
            }
            
            if (importedCharts.length > 0) {
                if (confirm(`找到 ${importedCharts.length} 個圖表，確定要匯入嗎？\n這將會覆蓋現有的圖表設定。`)) {
                    charts = importedCharts;
                    
                    if (storageMode === 'sheets' && window.GOOGLE_SHEETS_URL) {
                        importChartsToSheets(charts);
                    } else {
                        saveChartsToLocal();
                        updateChartsDisplay();
                        showNotification(`已匯入 ${importedCharts.length} 個圖表`, 'success');
                    }
                }
            } else {
                throw new Error('CSV 檔案中沒有有效的圖表資料');
            }
        } catch (error) {
            console.error('CSV 匯入失敗:', error);
            showNotification(`匯入失敗：${error.message}`, 'error');
        }
        
        event.target.value = '';
    };
    
    reader.readAsText(file, 'UTF-8');
}

/**
 * 解析 CSV 行
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
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

// ================== 其他保持不變的功能 ==================

function toggleConfigPanel() {
    const panel = document.getElementById('config-panel');
    panel.classList.toggle('active');
    updateConfigDisplay();
}

function closeConfigPanel() {
    document.getElementById('config-panel').classList.remove('active');
}

function updateConfigDisplay() {
    const currentFile = document.getElementById('current-file');
    const chartCount = document.getElementById('chart-count');
    
    if (currentFile) {
        if (storageMode === 'sheets') {
            currentFile.textContent = 'Google Sheets 雲端儲存';
        } else {
            currentFile.textContent = '瀏覽器本地儲存';
        }
    }
    
    if (chartCount) {
        chartCount.textContent = `${charts.length} 個圖表`;
    }
    
    updateStorageModeDisplay();
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-weight: 500;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// RSS 和備份功能保持不變...
function loadRSSFeeds() {
    // RSS 載入邏輯
}

function setupBackupReminder() {
    // 備份提醒邏輯
}

// 當頁面載入完成時初始化
document.addEventListener('DOMContentLoaded', initApp);