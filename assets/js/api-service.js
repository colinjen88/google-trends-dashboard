/**
 * Google Trends Dashboard - API Service Module
 * 
 * @description 統一管理所有 API 請求，支援本地開發與 Vercel 部署
 * @version 2.0
 */

const ApiService = (function() {
    'use strict';

    // 配置
    const CONFIG = {
        // 偵測是否為純靜態本地開發（live-server 預設 8080 port）
        // VPS 部署後（3000 port 或 80/443）都會使用 /api
        isStaticDev: window.location.port === '8080',
        endpoints: {
            trending: '/api/trending',
            news: '/api/news',
            rank: '/api/rank'
        },
        // 純靜態開發時的備用 CORS 代理
        fallbackProxies: [
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?'
        ],
        timeout: 8000, // 8 秒超時
        cache: new Map(),
        cacheTTL: 5 * 60 * 1000 // 5 分鐘快取
    };

    /**
     * 帶超時的 fetch 包裝器
     * @param {string} url - 請求 URL
     * @param {Object} options - fetch 選項
     * @returns {Promise<Response>}
     */
    async function fetchWithTimeout(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            return response;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * 獲取快取資料（如果有效）
     * @param {string} key - 快取鍵
     * @returns {any|null}
     */
    function getFromCache(key) {
        const cached = CONFIG.cache.get(key);
        if (cached && Date.now() - cached.timestamp < CONFIG.cacheTTL) {
            console.log(`📦 Cache hit: ${key}`);
            return cached.data;
        }
        return null;
    }

    /**
     * 設定快取資料
     * @param {string} key - 快取鍵
     * @param {any} data - 要快取的資料
     */
    function setCache(key, data) {
        CONFIG.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    /**
     * 獲取熱門搜尋資料
     * @param {string} geo - 地區代碼 (TW, US, JP, etc.)
     * @returns {Promise<Object>}
     */
    async function getTrending(geo = 'TW') {
        const cacheKey = `trending_${geo}`;
        const cached = getFromCache(cacheKey);
        if (cached) return cached;

        // 嘗試使用我們的 API（部署後可用）
        if (!CONFIG.isStaticDev) {
            try {
                const response = await fetchWithTimeout(`${CONFIG.endpoints.trending}?geo=${geo}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setCache(cacheKey, data);
                        console.log('✅ Trending data from API');
                        return data;
                    }
                }
            } catch (error) {
                console.warn('API endpoint failed, trying fallback...');
            }
        }

        // 本地開發或 API 失敗時使用 fallback
        return getTrendingFallback(geo, cacheKey);
    }

    /**
     * 使用 CORS 代理獲取熱門搜尋（備用方案）
     */
    async function getTrendingFallback(geo, cacheKey) {
        const rssUrl = `https://trends.google.com/trending/rss?geo=${geo}`;
        
        for (const proxy of CONFIG.fallbackProxies) {
            try {
                const response = await fetchWithTimeout(proxy + encodeURIComponent(rssUrl));
                if (!response.ok) continue;
                
                const xmlText = await response.text();
                const items = parseRSSXml(xmlText);
                
                const data = {
                    success: true,
                    geo: geo,
                    count: items.length,
                    fetchedAt: new Date().toISOString(),
                    items: items,
                    source: 'fallback'
                };
                
                setCache(cacheKey, data);
                console.log(`✅ Trending data from fallback proxy`);
                return data;
            } catch (error) {
                console.warn(`Proxy failed: ${proxy}`);
                continue;
            }
        }

        // 所有方法都失敗
        throw new Error('無法獲取熱門搜尋資料');
    }

    /**
     * 解析 RSS XML
     * @param {string} xmlText - XML 字串
     * @returns {Array}
     */
    function parseRSSXml(xmlText) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, 'text/xml');
        const items = doc.querySelectorAll('item');
        
        return Array.from(items).slice(0, 20).map(item => ({
            title: item.querySelector('title')?.textContent || '',
            traffic: item.querySelector('ht\\:approx_traffic, approx_traffic')?.textContent || null,
            link: item.querySelector('link')?.textContent || null,
            pubDate: item.querySelector('pubDate')?.textContent || null
        }));
    }

    /**
     * 獲取相關新聞
     * @param {string} query - 搜尋關鍵字
     * @param {string} region - 地區代碼
     * @returns {Promise<Object>}
     */
    async function getNews(query, region = 'TW') {
        const cacheKey = `news_${query}_${region}`;
        const cached = getFromCache(cacheKey);
        if (cached) return cached;

        if (!CONFIG.isStaticDev) {
            try {
                const url = `${CONFIG.endpoints.news}?q=${encodeURIComponent(query)}&region=${region}`;
                const response = await fetchWithTimeout(url);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setCache(cacheKey, data);
                        return data;
                    }
                }
            } catch (error) {
                console.warn('News API failed');
            }
        }

        // Fallback: 返回空結果（新聞為可選功能）
        return {
            success: false,
            query: query,
            items: [],
            message: 'News feature requires deployment to Vercel'
        };
    }

    // 公開 API
    return {
        getTrending,
        getNews,
        clearCache: () => CONFIG.cache.clear()
    };
})();

// 掛載到全域
window.ApiService = ApiService;
