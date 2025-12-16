/**
 * Serverless API: Google News RSS Proxy
 * 
 * @description 代理 Google News RSS Feed，根據關鍵字搜尋相關新聞
 * @endpoint GET /api/news?q=keyword&hl=zh-TW&gl=TW
 * @returns {Object} JSON 格式的新聞資料
 */

// 語言/地區配置
const LANGUAGE_CONFIG = {
    TW: { hl: 'zh-TW', gl: 'TW', ceid: 'TW:zh-Hant' },
    US: { hl: 'en-US', gl: 'US', ceid: 'US:en' },
    JP: { hl: 'ja', gl: 'JP', ceid: 'JP:ja' },
    KR: { hl: 'ko', gl: 'KR', ceid: 'KR:ko' },
    CN: { hl: 'zh-CN', gl: 'CN', ceid: 'CN:zh-Hans' }
};

const DEFAULT_REGION = 'TW';
const MAX_ITEMS = 10;

/**
 * 解析 Google News RSS XML 為結構化資料
 * @param {string} xmlText - RSS XML 字串
 * @returns {Array} 新聞項目陣列
 */
function parseNewsRSS(xmlText) {
    const items = [];
    
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title>(.*?)<\/title>/;
    const linkRegex = /<link>(.*?)<\/link>/;
    const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/;
    const sourceRegex = /<source[^>]*>(.*?)<\/source>/;
    
    let match;
    let count = 0;
    
    while ((match = itemRegex.exec(xmlText)) !== null && count < MAX_ITEMS) {
        const itemXml = match[1];
        
        const titleMatch = itemXml.match(titleRegex);
        const linkMatch = itemXml.match(linkRegex);
        const pubDateMatch = itemXml.match(pubDateRegex);
        const sourceMatch = itemXml.match(sourceRegex);
        
        if (titleMatch && linkMatch) {
            // 清理標題（移除 HTML entities）
            let title = titleMatch[1]
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'");
            
            items.push({
                title: title,
                link: linkMatch[1],
                pubDate: pubDateMatch ? pubDateMatch[1] : null,
                source: sourceMatch ? sourceMatch[1] : null
            });
            count++;
        }
    }
    
    return items;
}

/**
 * Vercel Serverless Function Handler
 */
export default async function handler(req, res) {
    // 設定 CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=120');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    try {
        const query = req.query.q;
        if (!query || query.trim() === '') {
            return res.status(400).json({
                success: false,
                error: '缺少必要參數: q (搜尋關鍵字)'
            });
        }
        
        // 取得地區配置
        const region = (req.query.region || DEFAULT_REGION).toUpperCase();
        const config = LANGUAGE_CONFIG[region] || LANGUAGE_CONFIG[DEFAULT_REGION];
        
        // 構建 Google News RSS URL
        const encodedQuery = encodeURIComponent(query.trim());
        const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=${config.hl}&gl=${config.gl}&ceid=${config.ceid}`;
        
        const response = await fetch(rssUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; TrendsDashboard/2.0)',
                'Accept': 'application/rss+xml, application/xml, text/xml'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Google News 回應錯誤: ${response.status}`);
        }
        
        const xmlText = await response.text();
        const items = parseNewsRSS(xmlText);
        
        return res.status(200).json({
            success: true,
            query: query,
            region: region,
            count: items.length,
            fetchedAt: new Date().toISOString(),
            items: items
        });
        
    } catch (error) {
        console.error('News API Error:', error.message);
        return res.status(500).json({
            success: false,
            error: '無法獲取新聞資料',
            message: error.message
        });
    }
}
