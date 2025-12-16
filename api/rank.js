/**
 * Serverless API: Google Search Rank Checker
 * 
 * @description 檢查關鍵字在 Google 搜尋中的排名
 * @endpoint GET /api/rank?q=keyword&domain=example.com&gl=TW
 * @returns {Object} 排名資訊
 * 
 * ⚠️ 注意：直接爬取 Google 搜尋結果可能違反 ToS，
 * 此 API 僅作為概念示範，生產環境建議使用：
 * - Google Search Console API
 * - 第三方 SEO API (SerpApi, DataForSEO)
 */

const DEFAULT_REGION = 'TW';
const MAX_RESULTS = 100; // 最多檢查前 100 名

/**
 * 模擬排名檢查（示範用）
 * 實際實作需要使用付費 API 如 SerpApi
 */
async function checkRankSimulated(keyword, domain) {
    // 模擬隨機排名（1-100 或 "未進榜"）
    const found = Math.random() > 0.3;
    if (found) {
        return {
            rank: Math.floor(Math.random() * 50) + 1,
            url: `https://${domain}/page-${Math.floor(Math.random() * 10)}`,
            simulated: true
        };
    }
    return {
        rank: null,
        url: null,
        simulated: true
    };
}

/**
 * 使用 SerpApi 檢查排名（需要 API Key）
 * 取消註解並設定環境變數 SERPAPI_KEY 以啟用
 */
async function checkRankWithSerpApi(keyword, domain, gl) {
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
        return null; // 無 API Key，使用模擬
    }

    try {
        const params = new URLSearchParams({
            api_key: apiKey,
            q: keyword,
            gl: gl,
            num: MAX_RESULTS,
            engine: 'google'
        });

        const response = await fetch(`https://serpapi.com/search?${params}`);
        if (!response.ok) return null;

        const data = await response.json();
        const organicResults = data.organic_results || [];

        for (let i = 0; i < organicResults.length; i++) {
            const result = organicResults[i];
            if (result.link && result.link.includes(domain)) {
                return {
                    rank: i + 1,
                    url: result.link,
                    title: result.title,
                    simulated: false
                };
            }
        }

        return { rank: null, url: null, simulated: false };
    } catch (error) {
        console.error('SerpApi Error:', error);
        return null;
    }
}

/**
 * Vercel Serverless Function Handler
 */
export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { q: keyword, domain, gl = DEFAULT_REGION } = req.query;

        if (!keyword || !domain) {
            return res.status(400).json({
                success: false,
                error: '缺少必要參數: q (關鍵字) 和 domain (網域)'
            });
        }

        // 嘗試使用 SerpApi，失敗則使用模擬
        let result = await checkRankWithSerpApi(keyword, domain, gl);
        if (!result) {
            result = await checkRankSimulated(keyword, domain);
        }

        return res.status(200).json({
            success: true,
            keyword: keyword,
            domain: domain,
            region: gl,
            ...result,
            checkedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Rank API Error:', error.message);
        return res.status(500).json({
            success: false,
            error: '排名檢查失敗',
            message: error.message
        });
    }
}
