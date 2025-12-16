/**
 * Google Trends Dashboard - Rank Tracker Module
 * 
 * @description 關鍵字排名追蹤功能（使用 Puppeteer 無頭瀏覽器獲取真實排名）
 * @version 2.2
 */

const RankTracker = (function() {
    'use strict';

    // 配置
    const CONFIG = {
        storageKeyKeywords: 'trends-rank-keywords',
        storageKeyDomain: 'trends-rank-domain',
        apiEndpoint: '/api/rank-real',  // 使用真實排名 API
        maxKeywords: 50
    };

    // 狀態
    let keywords = [];
    let domain = '';
    let isChecking = false;
    let results = new Map();

    // DOM 元素
    let elements = {};

    /**
     * 初始化
     */
    function init() {
        cacheElements();
        loadFromStorage();
        bindEvents();
        render();
        console.log('📊 RankTracker initialized (Real ranking mode)');
    }

    /**
     * 快取 DOM 元素
     */
    function cacheElements() {
        elements = {
            container: document.getElementById('rank-tracker-container'),
            domainInput: document.getElementById('rank-domain-input'),
            fileInput: document.getElementById('rank-file-input'),
            keywordList: document.getElementById('rank-keyword-list'),
            resultsTable: document.getElementById('rank-results-table'),
            checkBtn: document.getElementById('rank-check-btn'),
            clearBtn: document.getElementById('rank-clear-btn'),
            statusText: document.getElementById('rank-status')
        };
    }

    /**
     * 綁定事件
     */
    function bindEvents() {
        elements.domainInput?.addEventListener('change', (e) => {
            setDomain(e.target.value);
        });

        elements.fileInput?.addEventListener('change', handleFileUpload);
        elements.checkBtn?.addEventListener('click', checkAllRanks);
        elements.clearBtn?.addEventListener('click', clearAll);
    }

    /**
     * 處理 CSV 檔案上傳
     */
    function handleFileUpload(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const lines = text.trim().split('\n');
                
                const newKeywords = [];
                lines.forEach((line, index) => {
                    if (index === 0 && line.toLowerCase().includes('keyword')) return;
                    
                    const cols = line.split(',');
                    const keyword = cols[0]?.trim().replace(/^["']|["']$/g, '');
                    if (keyword && keyword.length > 0) {
                        newKeywords.push(keyword);
                    }
                });

                if (newKeywords.length > 0) {
                    keywords = newKeywords.slice(0, CONFIG.maxKeywords);
                    saveToStorage();
                    render();
                    showStatus(`已載入 ${keywords.length} 個關鍵字`, 'success');
                } else {
                    showStatus('CSV 中未找到關鍵字', 'error');
                }
            } catch (error) {
                showStatus('CSV 解析失敗', 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    /**
     * 設定追蹤網域
     */
    function setDomain(value) {
        domain = value.trim()
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .replace(/\/.*$/, '');
        
        saveToStorage();
        
        if (domain) {
            showStatus(`追蹤網域: ${domain}`, 'info');
        }
    }

    /**
     * 檢查所有關鍵字排名
     */
    async function checkAllRanks() {
        if (isChecking || keywords.length === 0) return;
        
        if (!domain) {
            showStatus('請先輸入要追蹤的網域', 'warning');
            return;
        }

        isChecking = true;
        elements.checkBtn.disabled = true;
        elements.checkBtn.textContent = '檢查中...';
        results.clear();

        // 檢查 API 是否可用
        const isApiAvailable = await checkApiAvailability();
        
        for (let i = 0; i < keywords.length; i++) {
            const keyword = keywords[i];
            showStatus(`檢查中 (${i + 1}/${keywords.length}): ${keyword}`, 'info');
            
            try {
                let result;
                
                if (isApiAvailable) {
                    // 使用真實 API
                    result = await fetchRealRank(keyword);
                } else {
                    // API 不可用，生成搜尋連結
                    result = generateSearchLink(keyword);
                }
                
                results.set(keyword, result);
            } catch (error) {
                results.set(keyword, { 
                    success: false, 
                    rank: null, 
                    error: error.message 
                });
            }
            
            renderResults();
            
            // 每個請求間隔 2 秒（避免被封鎖）
            if (i < keywords.length - 1 && isApiAvailable) {
                await delay(2000);
            }
        }

        isChecking = false;
        elements.checkBtn.disabled = false;
        elements.checkBtn.textContent = '🔍 檢查排名';
        
        const source = isApiAvailable ? '真實排名' : '手動模式';
        showStatus(`完成！已檢查 ${keywords.length} 個關鍵字 (${source})`, 'success');
    }

    /**
     * 檢查 API 是否可用
     */
    async function checkApiAvailability() {
        try {
            const response = await fetch(`${CONFIG.apiEndpoint}?q=test&domain=test.com`, {
                method: 'GET'
            });
            return response.ok || response.status !== 404;
        } catch (e) {
            return false;
        }
    }

    /**
     * 從 API 獲取真實排名
     */
    async function fetchRealRank(keyword) {
        const url = `${CONFIG.apiEndpoint}?q=${encodeURIComponent(keyword)}&domain=${encodeURIComponent(domain)}&gl=tw`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '請求失敗');
        }
        
        return data;
    }

    /**
     * 生成手動搜尋連結（API 不可用時的備案）
     */
    function generateSearchLink(keyword) {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&gl=tw&hl=zh-TW&num=100`;
        return {
            success: true,
            keyword: keyword,
            domain: domain,
            rank: null,
            searchUrl: searchUrl,
            source: 'manual'
        };
    }

    /**
     * 延遲函數
     */
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 清除所有資料
     */
    function clearAll() {
        keywords = [];
        domain = '';
        results.clear();
        
        if (elements.domainInput) elements.domainInput.value = '';
        
        localStorage.removeItem(CONFIG.storageKeyKeywords);
        localStorage.removeItem(CONFIG.storageKeyDomain);
        
        render();
        showStatus('已清除所有資料', 'info');
    }

    /**
     * 渲染 UI
     */
    function render() {
        renderKeywordList();
        renderResults();
    }

    /**
     * 渲染關鍵字列表
     */
    function renderKeywordList() {
        if (!elements.keywordList) return;

        if (keywords.length === 0) {
            elements.keywordList.innerHTML = `
                <div class="rank-empty">
                    <span>📋 尚未載入關鍵字</span>
                    <small>請上傳 CSV 檔案</small>
                </div>
            `;
            return;
        }

        elements.keywordList.innerHTML = `
            <div class="rank-keyword-tags">
                ${keywords.map((kw, i) => `
                    <span class="rank-keyword-tag">
                        ${escapeHtml(kw)}
                        <button class="rank-keyword-remove" onclick="RankTracker.removeKeyword(${i})">×</button>
                    </span>
                `).join('')}
            </div>
            <div class="rank-keyword-count">
                共 ${keywords.length} 個關鍵字
            </div>
        `;
    }

    /**
     * 渲染結果表格
     */
    function renderResults() {
        if (!elements.resultsTable) return;

        if (results.size === 0) {
            elements.resultsTable.innerHTML = `
                <div class="rank-empty">
                    <span>📊 尚無排名資料</span>
                    <small>設定網域後點擊「檢查排名」</small>
                </div>
            `;
            return;
        }

        // 檢查是否為手動模式
        const firstResult = Array.from(results.values())[0];
        const isManualMode = firstResult?.source === 'manual';

        let html = `
            <table class="rank-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>關鍵字</th>
                        <th>${isManualMode ? '操作' : '排名'}</th>
                        ${!isManualMode ? '<th>狀態</th>' : ''}
                    </tr>
                </thead>
                <tbody>
        `;

        let index = 1;
        for (const [keyword, result] of results) {
            if (isManualMode) {
                html += `
                    <tr>
                        <td>${index++}</td>
                        <td class="rank-keyword-cell">${escapeHtml(keyword)}</td>
                        <td>
                            <a href="${result.searchUrl}" 
                               target="_blank" 
                               rel="noopener" 
                               class="rank-search-link glass-btn">
                                🔍 開啟搜尋
                            </a>
                        </td>
                    </tr>
                `;
            } else {
                const rank = result.rank;
                const rankDisplay = rank ? `#${rank}` : '-';
                const rankClass = rank ? (rank <= 10 ? 'rank-good' : rank <= 30 ? 'rank-ok' : 'rank-low') : 'rank-none';
                
                let status = '未進榜';
                if (rank) {
                    status = rank <= 10 ? '🔥 首頁' : rank <= 30 ? '👍 前三頁' : '📍 已收錄';
                } else if (result.note) {
                    status = result.note;
                } else if (result.error) {
                    status = `❌ ${result.error}`;
                }
                
                html += `
                    <tr>
                        <td>${index++}</td>
                        <td class="rank-keyword-cell">${escapeHtml(keyword)}</td>
                        <td class="rank-position ${rankClass}">${rankDisplay}</td>
                        <td class="rank-status-cell">${status}</td>
                    </tr>
                `;
            }
        }

        html += '</tbody></table>';
        
        if (isManualMode) {
            html += `
                <div class="rank-manual-notice">
                    <small>
                        💡 <strong>VPS 部署後可獲得真實排名！</strong><br>
                        目前為手動模式。部署到 VPS 並安裝 Puppeteer 後，將自動爬取真實排名。
                    </small>
                </div>
            `;
        } else if (firstResult?.cached) {
            html += `
                <div class="rank-manual-notice">
                    <small>📦 使用快取資料（1小時內有效）</small>
                </div>
            `;
        }
        
        elements.resultsTable.innerHTML = html;
    }

    /**
     * 移除單一關鍵字
     */
    function removeKeyword(index) {
        if (index >= 0 && index < keywords.length) {
            keywords.splice(index, 1);
            saveToStorage();
            render();
        }
    }

    /**
     * 顯示狀態訊息
     */
    function showStatus(message, type = 'info') {
        if (elements.statusText) {
            elements.statusText.textContent = message;
            elements.statusText.className = `rank-status rank-status--${type}`;
        }
    }

    /**
     * 載入儲存的資料
     */
    function loadFromStorage() {
        try {
            const savedKeywords = localStorage.getItem(CONFIG.storageKeyKeywords);
            const savedDomain = localStorage.getItem(CONFIG.storageKeyDomain);
            
            if (savedKeywords) keywords = JSON.parse(savedKeywords);
            if (savedDomain) {
                domain = savedDomain;
                if (elements.domainInput) elements.domainInput.value = domain;
            }
        } catch (error) {
            console.warn('Failed to load rank tracker data:', error);
        }
    }

    /**
     * 儲存資料
     */
    function saveToStorage() {
        try {
            localStorage.setItem(CONFIG.storageKeyKeywords, JSON.stringify(keywords));
            localStorage.setItem(CONFIG.storageKeyDomain, domain);
        } catch (error) {
            console.warn('Failed to save rank tracker data:', error);
        }
    }

    /**
     * HTML 轉義
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    // 公開 API
    return {
        init,
        removeKeyword,
        checkAllRanks,
        clearAll
    };
})();

// 掛載到全域
window.RankTracker = RankTracker;
