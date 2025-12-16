/**
 * Google Trends Dashboard - Main Application Entry
 * 
 * @description 主應用程式入口，協調所有模組
 * @version 2.0
 */

(function() {
    'use strict';

    /**
     * 應用程式物件
     */
    const App = {
        // 配置
        config: {
            defaultGeo: 'TW',
            defaultTime: 'today 1-m'
        },

        // DOM 元素快取
        elements: {},

        /**
         * 初始化應用程式
         */
        async init() {
            console.log('🚀 Google Trends Dashboard 2.0 initializing...');
            
            // 快取 DOM 元素
            this.cacheElements();
            
            // 初始化各模組
            ThemeManager.init();
            ChartManager.init();
            RankTracker.init();
            
            // 綁定事件
            this.bindEvents();
            
            // 載入熱門搜尋
            await this.loadTrendingSection();
            
            console.log('✅ Dashboard ready!');
        },

        /**
         * 快取 DOM 元素
         */
        cacheElements() {
            this.elements = {
                addChartForm: document.getElementById('add-chart-form'),
                keywordInput: document.getElementById('keyword-input'),
                titleInput: document.getElementById('title-input'),
                geoSelect: document.getElementById('geo-select'),
                timeSelect: document.getElementById('time-select'),
                propertySelect: document.getElementById('property-select'),
                trendsGrid: document.getElementById('trends-grid'),
                trendingContainer: document.getElementById('trending-container'),
                themeToggle: document.getElementById('theme-toggle'),
                configPanel: document.getElementById('config-panel'),
                configFileInput: document.getElementById('config-file-input')
            };
        },

        /**
         * 綁定事件監聽器
         */
        bindEvents() {
            // 表單提交
            this.elements.addChartForm?.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddChart();
            });

            // 主題切換
            this.elements.themeToggle?.addEventListener('click', () => {
                const newTheme = ThemeManager.toggle();
                this.updateThemeToggleUI(newTheme);
                this.showToast(`已切換至${newTheme === 'dark' ? '深色' : '淺色'}模式`, 'success');
            });

            // 鍵盤快捷鍵
            document.addEventListener('keydown', (e) => {
                // Ctrl/Cmd + K 聚焦搜尋框
                if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                    e.preventDefault();
                    this.elements.keywordInput?.focus();
                }
                // Ctrl/Cmd + D 切換深色模式
                if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                    e.preventDefault();
                    ThemeManager.toggle();
                }
            });

            // CSV 匯入
            this.elements.configFileInput?.addEventListener('change', (e) => {
                this.handleConfigImport(e);
            });
        },

        /**
         * 處理新增圖表
         */
        handleAddChart() {
            const keyword = this.elements.keywordInput?.value?.trim();
            const title = this.elements.titleInput?.value?.trim();
            const geo = this.elements.geoSelect?.value || this.config.defaultGeo;
            const time = this.elements.timeSelect?.value || this.config.defaultTime;
            const property = this.elements.propertySelect?.value || '';

            if (!keyword) {
                this.showToast('請輸入關鍵字', 'warning');
                this.elements.keywordInput?.focus();
                return;
            }

            // 支援多關鍵字（逗號分隔）
            const keywords = keyword.split(',').map(k => k.trim()).filter(Boolean);
            
            keywords.forEach((kw, idx) => {
                try {
                    ChartManager.add({
                        keyword: kw,
                        title: keywords.length === 1 ? title : kw,
                        geo,
                        time,
                        property
                    });
                } catch (error) {
                    this.showToast(error.message, 'error');
                }
            });

            // 清空輸入
            this.clearInputs();
            this.showToast(`已新增 ${keywords.length} 個圖表`, 'success');
        },

        /**
         * 載入熱門搜尋區塊
         */
        async loadTrendingSection() {
            const container = this.elements.trendingContainer;
            if (!container) return;

            // 顯示載入中
            container.innerHTML = `
                <div class="trending-loading">
                    <div class="skeleton" style="height: 32px; width: 80px;"></div>
                    <div class="skeleton" style="height: 32px; width: 100px;"></div>
                    <div class="skeleton" style="height: 32px; width: 70px;"></div>
                    <div class="skeleton" style="height: 32px; width: 90px;"></div>
                    <div class="skeleton" style="height: 32px; width: 85px;"></div>
                </div>
            `;

            try {
                const data = await ApiService.getTrending(this.config.defaultGeo);
                this.renderTrendingTags(container, data.items);
            } catch (error) {
                console.error('Failed to load trending:', error);
                this.renderFallbackTrending(container);
            }
        },

        /**
         * 渲染熱門搜尋標籤
         */
        renderTrendingTags(container, items) {
            const html = `
                <div class="trending-tags">
                    ${items.slice(0, 15).map(item => `
                        <button class="glass-tag" 
                                onclick="App.addTrendingKeyword('${this.escapeHtml(item.title)}')"
                                title="點擊新增「${this.escapeHtml(item.title)}」圖表">
                            <span class="tag-icon">🔥</span>
                            <span class="tag-text">${this.escapeHtml(item.title)}</span>
                            ${item.traffic ? `<span class="tag-traffic">${item.traffic}</span>` : ''}
                        </button>
                    `).join('')}
                </div>
                <div class="trending-footer">
                    <small>
                        💡 點擊標籤快速新增圖表 · 
                        <a href="https://trends.google.com.tw/trends/trendingsearches/daily?geo=TW" 
                           target="_blank" rel="noopener">
                            查看更多 →
                        </a>
                    </small>
                </div>
            `;
            container.innerHTML = html;
        },

        /**
         * 渲染備用熱門標籤
         */
        renderFallbackTrending(container) {
            const fallbackKeywords = ['台股', 'AI', '比特幣', '房價', '匯率', '黃金', 'iPhone', 'Netflix'];
            const html = `
                <div class="trending-tags trending-tags--fallback">
                    ${fallbackKeywords.map(kw => `
                        <button class="glass-tag" onclick="App.addTrendingKeyword('${kw}')">
                            <span class="tag-icon">📊</span>
                            <span class="tag-text">${kw}</span>
                        </button>
                    `).join('')}
                </div>
                <div class="trending-footer">
                    <small>
                        ⚠️ 即時熱搜載入失敗，顯示常用關鍵字 · 
                        <a href="https://trends.google.com.tw/trends/trendingsearches/daily?geo=TW" 
                           target="_blank" rel="noopener">
                            前往 Google Trends →
                        </a>
                    </small>
                </div>
            `;
            container.innerHTML = html;
        },

        /**
         * 從熱門標籤新增關鍵字
         */
        addTrendingKeyword(keyword) {
            try {
                ChartManager.add({
                    keyword,
                    title: keyword,
                    geo: this.config.defaultGeo,
                    time: this.config.defaultTime
                });
                this.showToast(`已新增「${keyword}」趨勢圖表`, 'success');
            } catch (error) {
                this.showToast(error.message, 'error');
            }
        },

        /**
         * 清空輸入欄位
         */
        clearInputs() {
            if (this.elements.keywordInput) this.elements.keywordInput.value = '';
            if (this.elements.titleInput) this.elements.titleInput.value = '';
        },

        /**
         * 更新主題切換按鈕 UI
         */
        updateThemeToggleUI(theme) {
            const btn = this.elements.themeToggle;
            if (btn) {
                btn.innerHTML = theme === 'dark' ? '🌙' : '☀️';
                btn.title = theme === 'dark' ? '切換至淺色模式' : '切換至深色模式';
            }
        },

        /**
         * 顯示 Toast 通知
         */
        showToast(message, type = 'info') {
            // 移除已存在的 toast
            document.querySelectorAll('.toast').forEach(t => t.remove());

            const toast = document.createElement('div');
            toast.className = `toast toast--${type}`;
            
            const icons = {
                success: '✅',
                warning: '⚠️',
                error: '❌',
                info: 'ℹ️'
            };
            
            toast.innerHTML = `
                <span class="toast-icon">${icons[type] || icons.info}</span>
                <span class="toast-message">${this.escapeHtml(message)}</span>
            `;
            
            document.body.appendChild(toast);
            
            // 動畫進入
            requestAnimationFrame(() => toast.classList.add('toast--visible'));
            
            // 3秒後移除
            setTimeout(() => {
                toast.classList.remove('toast--visible');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        },

        /**
         * HTML 轉義
         */
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text || '';
            return div.innerHTML;
        },

        /**
         * 切換設定面板
         */
        toggleConfigPanel() {
            const panel = this.elements.configPanel;
            if (panel) {
                panel.classList.toggle('config-panel--open');
            }
        },

        /**
         * 匯出設定
         */
        exportConfig() {
            const charts = ChartManager.getAll();
            const csv = this.chartsToCSV(charts);
            
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `trends-config-${new Date().toISOString().slice(0,10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            
            this.showToast('設定已匯出', 'success');
        },

        /**
         * 圖表轉 CSV
         */
        chartsToCSV(charts) {
            const headers = ['title', 'keyword', 'geo', 'time', 'property'];
            let csv = headers.join(',') + '\n';
            
            charts.forEach(chart => {
                const row = [
                    `"${(chart.title || '').replace(/"/g, '""')}"`,
                    `"${(chart.keyword || '').replace(/"/g, '""')}"`,
                    chart.geo || 'TW',
                    chart.time || 'today 1-m',
                    chart.property || ''
                ];
                csv += row.join(',') + '\n';
            });
            
            return csv;
        },

        /**
         * 匯入設定
         */
        handleConfigImport(event) {
            const file = event.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const csv = e.target.result;
                    const charts = this.csvToCharts(csv);
                    
                    // 清除現有圖表
                    ChartManager.clear();
                    
                    // 新增匯入的圖表
                    charts.forEach(chart => ChartManager.add(chart));
                    
                    this.showToast(`已匯入 ${charts.length} 個圖表`, 'success');
                } catch (error) {
                    this.showToast('CSV 格式錯誤', 'error');
                }
            };
            reader.readAsText(file);
        },

        /**
         * CSV 轉圖表
         */
        csvToCharts(csv) {
            const lines = csv.trim().split('\n');
            if (lines.length < 2) return [];

            const charts = [];
            for (let i = 1; i < lines.length; i++) {
                const values = this.parseCSVLine(lines[i]);
                if (values.length >= 2) {
                    charts.push({
                        title: values[0] || values[1],
                        keyword: values[1],
                        geo: values[2] || 'TW',
                        time: values[3] || 'today 1-m',
                        property: values[4] || ''
                    });
                }
            }
            return charts;
        },

        /**
         * 解析 CSV 行
         */
        parseCSVLine(line) {
            const result = [];
            let current = '';
            let inQuotes = false;
            
            for (const char of line) {
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
    };

    // 全域暴露
    window.App = App;

    // 頁面載入後初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => App.init());
    } else {
        App.init();
    }

    // 暴露舊版 API 以保持向後相容
    window.addNewChart = () => App.handleAddChart();
    window.removeChart = (id) => ChartManager.remove(id);
    window.toggleConfigPanel = () => App.toggleConfigPanel();
    window.loadConfigFile = (e) => App.handleConfigImport(e);
    window.exportCurrentConfig = () => App.exportConfig();
    window.addTrendingKeyword = (kw) => App.addTrendingKeyword(kw);

})();
