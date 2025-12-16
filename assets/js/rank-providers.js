/**
 * Google Trends Dashboard - Rank Provider Interface
 * 
 * @description 排名數據提供者抽象介面，支援多種數據來源
 * @version 2.1
 * 
 * 支援的提供者：
 * - Google Search Console API（免費，需 OAuth）
 * - SerpApi（付費，即時）
 * - 手動搜尋（免費，需人工檢視）
 */

const RankProviders = (function() {
    'use strict';

    // 提供者類型枚舉
    const PROVIDER_TYPES = {
        GOOGLE_SEARCH_CONSOLE: 'gsc',
        SERPAPI: 'serpapi',
        MANUAL: 'manual'
    };

    // 當前提供者
    let currentProvider = PROVIDER_TYPES.MANUAL;
    let providerConfig = {};

    /**
     * 設定提供者
     * @param {string} type - 提供者類型
     * @param {Object} config - 提供者設定
     */
    function setProvider(type, config = {}) {
        if (!Object.values(PROVIDER_TYPES).includes(type)) {
            console.warn(`Unknown provider type: ${type}, falling back to manual`);
            type = PROVIDER_TYPES.MANUAL;
        }
        currentProvider = type;
        providerConfig = config;
        console.log(`📊 Rank provider set to: ${type}`);
    }

    /**
     * 獲取當前提供者類型
     */
    function getProvider() {
        return currentProvider;
    }

    /**
     * 檢查關鍵字排名（統一介面）
     * @param {string} keyword - 關鍵字
     * @param {string} domain - 網域
     * @param {Object} options - 額外選項
     * @returns {Promise<Object>} 排名結果
     */
    async function checkRank(keyword, domain, options = {}) {
        switch (currentProvider) {
            case PROVIDER_TYPES.GOOGLE_SEARCH_CONSOLE:
                return await checkWithGSC(keyword, domain, options);
            case PROVIDER_TYPES.SERPAPI:
                return await checkWithSerpApi(keyword, domain, options);
            case PROVIDER_TYPES.MANUAL:
            default:
                return generateManualLink(keyword, domain, options);
        }
    }

    /**
     * Google Search Console API
     */
    async function checkWithGSC(keyword, domain, options) {
        const accessToken = providerConfig.accessToken;
        if (!accessToken) {
            return { 
                success: false, 
                error: '未設定 Google Search Console 存取權杖',
                needsAuth: true 
            };
        }

        try {
            // GSC API 使用 searchanalytics/query 端點
            const siteUrl = `sc-domain:${domain}`;
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 7); // 過去 7 天

            const response = await fetch(
                `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        startDate: startDate.toISOString().split('T')[0],
                        endDate: endDate.toISOString().split('T')[0],
                        dimensions: ['query', 'page'],
                        dimensionFilterGroups: [{
                            filters: [{
                                dimension: 'query',
                                operator: 'equals',
                                expression: keyword
                            }]
                        }],
                        rowLimit: 1
                    })
                }
            );

            if (!response.ok) {
                if (response.status === 401) {
                    return { success: false, error: '存取權杖已過期', needsAuth: true };
                }
                throw new Error(`GSC API Error: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.rows && data.rows.length > 0) {
                const row = data.rows[0];
                return {
                    success: true,
                    keyword: keyword,
                    domain: domain,
                    rank: Math.round(row.position),
                    clicks: row.clicks,
                    impressions: row.impressions,
                    ctr: (row.ctr * 100).toFixed(2) + '%',
                    url: row.keys[1], // page URL
                    source: 'gsc',
                    dataRange: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
                };
            }

            return {
                success: true,
                keyword: keyword,
                domain: domain,
                rank: null,
                source: 'gsc',
                note: '無此關鍵字資料（可能無曝光或資料延遲）'
            };

        } catch (error) {
            console.error('GSC API Error:', error);
            return { 
                success: false, 
                error: error.message,
                source: 'gsc'
            };
        }
    }

    /**
     * SerpApi
     */
    async function checkWithSerpApi(keyword, domain, options) {
        const apiKey = providerConfig.apiKey;
        if (!apiKey) {
            return { success: false, error: '未設定 SerpApi Key' };
        }

        try {
            // 透過後端代理呼叫（因 CORS 限制）
            const response = await fetch(
                `/api/rank?q=${encodeURIComponent(keyword)}&domain=${encodeURIComponent(domain)}&gl=TW&key=${encodeURIComponent(apiKey)}`
            );
            
            const data = await response.json();
            return {
                ...data,
                source: 'serpapi'
            };
        } catch (error) {
            return { 
                success: false, 
                error: error.message,
                source: 'serpapi'
            };
        }
    }

    /**
     * 手動搜尋連結
     */
    function generateManualLink(keyword, domain, options) {
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
     * 開始 Google OAuth 流程
     */
    function initiateGoogleAuth() {
        const clientId = providerConfig.clientId;
        if (!clientId) {
            console.error('Google Client ID not configured');
            return;
        }

        const redirectUri = window.location.origin + '/oauth/callback';
        const scope = 'https://www.googleapis.com/auth/webmasters.readonly';
        
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `response_type=token&` +
            `scope=${encodeURIComponent(scope)}`;

        window.open(authUrl, 'google-auth', 'width=500,height=600');
    }

    /**
     * 處理 OAuth 回調
     */
    function handleOAuthCallback(hash) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        
        if (accessToken) {
            providerConfig.accessToken = accessToken;
            localStorage.setItem('gsc_access_token', accessToken);
            return true;
        }
        return false;
    }

    /**
     * 載入已儲存的設定
     */
    function loadSavedConfig() {
        const savedToken = localStorage.getItem('gsc_access_token');
        const savedProvider = localStorage.getItem('rank_provider');
        const savedSerpApiKey = localStorage.getItem('serpapi_key');

        if (savedToken) {
            providerConfig.accessToken = savedToken;
        }
        if (savedSerpApiKey) {
            providerConfig.apiKey = savedSerpApiKey;
        }
        if (savedProvider && Object.values(PROVIDER_TYPES).includes(savedProvider)) {
            currentProvider = savedProvider;
        }
    }

    /**
     * 儲存設定
     */
    function saveConfig() {
        localStorage.setItem('rank_provider', currentProvider);
        if (providerConfig.apiKey) {
            localStorage.setItem('serpapi_key', providerConfig.apiKey);
        }
    }

    // 初始化時載入儲存的設定
    loadSavedConfig();

    // 公開 API
    return {
        TYPES: PROVIDER_TYPES,
        setProvider,
        getProvider,
        checkRank,
        initiateGoogleAuth,
        handleOAuthCallback,
        setConfig: (config) => { providerConfig = { ...providerConfig, ...config }; },
        saveConfig
    };
})();

// 掛載到全域
window.RankProviders = RankProviders;
