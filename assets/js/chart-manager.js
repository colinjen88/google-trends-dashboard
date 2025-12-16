/**
 * Google Trends Dashboard - Chart Manager Module
 * 
 * @description 管理 Google Trends 圖表的建立、刪除與持久化
 * @version 2.0
 */

const ChartManager = (function() {
    'use strict';

    // 配置
    const CONFIG = {
        storageKey: 'trends-dashboard-charts',
        containerSelector: '#trends-grid',
        regions: {
            'TW': { name: '台灣', flag: '🇹🇼' },
            'US': { name: '美國', flag: '🇺🇸' },
            'JP': { name: '日本', flag: '🇯🇵' },
            'KR': { name: '韓國', flag: '🇰🇷' },
            'CN': { name: '中國', flag: '🇨🇳' },
            '': { name: '全球', flag: '🌐' }
        },
        timeRanges: {
            'today 1-m': '過去1個月',
            'today 3-m': '過去3個月',
            'today 12-m': '過去12個月',
            'today 5-y': '過去5年',
            'all': '所有時間'
        },
        properties: {
            '': '網頁搜尋',
            'images': '圖片搜尋',
            'news': '新聞搜尋',
            'youtube': 'YouTube',
            'froogle': 'Google 購物'
        }
    };

    // 狀態
    let charts = new Map();
    let container = null;

    /**
     * 初始化圖表管理器
     */
    function init() {
        container = document.querySelector(CONFIG.containerSelector);
        if (!container) {
            console.error('Chart container not found');
            return;
        }

        // 載入已儲存的圖表
        loadFromStorage();
        
        console.log(`📊 ChartManager initialized with ${charts.size} charts`);
    }

    /**
     * 從 LocalStorage 載入圖表
     */
    function loadFromStorage() {
        try {
            const saved = localStorage.getItem(CONFIG.storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                // 不自動渲染，讓使用者自行決定
                data.forEach(chart => charts.set(chart.id, chart));
            }
        } catch (error) {
            console.warn('Failed to load charts from storage:', error);
        }
    }

    /**
     * 儲存圖表到 LocalStorage
     */
    function saveToStorage() {
        try {
            const data = Array.from(charts.values());
            localStorage.setItem(CONFIG.storageKey, JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save charts to storage:', error);
        }
    }

    /**
     * 建立 Google Trends Embed URL
     * @param {Object} options - 圖表選項
     * @returns {string}
     */
    function buildEmbedUrl(options) {
        const { keyword, geo = 'TW', time = 'today 1-m', property = '' } = options;
        
        const req = {
            comparisonItem: [{
                keyword: keyword,
                geo: geo,
                time: time
            }],
            category: 0,
            property: property
        };
        
        const encodedReq = encodeURIComponent(JSON.stringify(req));
        const encodedKeyword = encodeURIComponent(keyword);
        const encodedTime = encodeURIComponent(time);
        
        return `https://trends.google.com/trends/embed/explore/TIMESERIES?req=${encodedReq}&tz=-480&eq=q%3D${encodedKeyword}%26date%3D${encodedTime}%26geo%3D${geo}`;
    }

    /**
     * 建立圖表 DOM 元素
     * @param {Object} chartData - 圖表資料
     * @returns {HTMLElement}
     */
    function createChartElement(chartData) {
        const { id, keyword, title, geo, time, property } = chartData;
        const embedUrl = buildEmbedUrl({ keyword, geo, time, property });
        const regionInfo = CONFIG.regions[geo] || CONFIG.regions['TW'];
        
        const article = document.createElement('article');
        article.className = 'trends-widget glass-card animate-fade-in-up';
        article.id = id;
        article.dataset.keyword = keyword;
        
        article.innerHTML = `
            <div class="widget-header">
                <h3 class="widget-title">
                    <span class="widget-icon">📊</span>
                    <span class="widget-title-text">${escapeHtml(title || keyword)}</span>
                </h3>
                <div class="widget-actions">
                    <button class="widget-btn widget-btn--news" 
                            onclick="ChartManager.showNews('${escapeHtml(keyword)}')" 
                            title="查看相關新聞">
                        📰
                    </button>
                    <button class="widget-btn widget-btn--remove" 
                            onclick="ChartManager.remove('${id}')" 
                            title="移除圖表">
                        ✕
                    </button>
                </div>
            </div>
            <div class="widget-meta">
                <span class="widget-meta-item">${regionInfo.flag} ${regionInfo.name}</span>
                <span class="widget-meta-item">⏱️ ${CONFIG.timeRanges[time] || time}</span>
            </div>
            <iframe class="widget-iframe" 
                    src="${embedUrl}" 
                    frameborder="0"
                    scrolling="no"
                    style="width: 100%; height: 350px;"
                    loading="lazy"
                    title="${keyword} Google Trends 圖表">
            </iframe>
        `;
        
        return article;
    }

    /**
     * HTML 轉義
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 新增圖表
     * @param {Object} options - 圖表選項
     * @returns {string} 圖表 ID
     */
    function add(options) {
        const { keyword, title, geo = 'TW', time = 'today 1-m', property = '' } = options;
        
        if (!keyword?.trim()) {
            throw new Error('關鍵字為必填項目');
        }
        
        const id = `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const chartData = {
            id,
            keyword: keyword.trim(),
            title: title?.trim() || keyword.trim(),
            geo,
            time,
            property,
            createdAt: new Date().toISOString()
        };
        
        // 建立並插入 DOM
        const element = createChartElement(chartData);
        container.appendChild(element);
        
        // 儲存
        charts.set(id, chartData);
        saveToStorage();
        
        console.log(`📊 Added chart: ${keyword}`);
        return id;
    }

    /**
     * 移除圖表
     * @param {string} id - 圖表 ID
     */
    function remove(id) {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('animate-fade-out');
            setTimeout(() => element.remove(), 250);
        }
        
        charts.delete(id);
        saveToStorage();
        
        console.log(`🗑️ Removed chart: ${id}`);
    }

    /**
     * 顯示相關新聞（整合 API Service）
     * @param {string} keyword - 關鍵字
     */
    async function showNews(keyword) {
        try {
            const data = await window.ApiService?.getNews(keyword);
            if (data?.items?.length > 0) {
                // 建立新聞彈窗
                showNewsModal(keyword, data.items);
            } else {
                showToast('暫無相關新聞', 'info');
            }
        } catch (error) {
            showToast('無法載入新聞', 'error');
        }
    }

    /**
     * 顯示新聞彈窗
     */
    function showNewsModal(keyword, items) {
        // 移除已存在的彈窗
        document.querySelector('.news-modal')?.remove();
        
        const modal = document.createElement('div');
        modal.className = 'news-modal glass-card animate-fade-in-scale';
        modal.innerHTML = `
            <div class="news-modal-header">
                <h4>📰 「${escapeHtml(keyword)}」相關新聞</h4>
                <button class="news-modal-close glass-btn" onclick="this.closest('.news-modal').remove()">✕</button>
            </div>
            <div class="news-modal-content">
                ${items.map(item => `
                    <a href="${item.link}" target="_blank" rel="noopener" class="news-item">
                        <span class="news-title">${escapeHtml(item.title)}</span>
                        <span class="news-source">${item.source || ''}</span>
                    </a>
                `).join('')}
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 點擊外部關閉
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    /**
     * 顯示 Toast 通知
     */
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast--${type} animate-fade-in`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('animate-fade-out');
            setTimeout(() => toast.remove(), 250);
        }, 3000);
    }

    /**
     * 獲取所有圖表
     */
    function getAll() {
        return Array.from(charts.values());
    }

    /**
     * 獲取圖表數量
     */
    function getCount() {
        return charts.size;
    }

    /**
     * 清除所有圖表
     */
    function clear() {
        container.innerHTML = '';
        charts.clear();
        saveToStorage();
    }

    // 公開 API
    return {
        init,
        add,
        remove,
        showNews,
        getAll,
        getCount,
        clear,
        CONFIG
    };
})();

// 掛載到全域
window.ChartManager = ChartManager;
