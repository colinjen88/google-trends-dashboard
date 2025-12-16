/**
 * Serverless API: Google Trends RSS Proxy
 * 
 * @description 代理 Google Trends 即時熱搜 RSS Feed，解決 CORS 問題
 * @endpoint GET /api/trending?geo=TW
 * @returns {Object} JSON 格式的熱門搜尋資料
 */

// 支援的地區代碼
const SUPPORTED_GEOS = ['TW', 'US', 'JP', 'KR', 'CN', 'HK', 'SG'];
const DEFAULT_GEO = 'TW';

/**
 * 解析 RSS XML 為結構化資料
 * @param {string} xmlText - RSS XML 字串
 * @returns {Array} 熱門搜尋項目陣列
 */
function parseRSStoJSON(xmlText) {
    const items = [];
    
    // 使用正則解析 XML（Serverless 環境無需 DOM Parser）
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/;
    const trafficRegex = /<ht:approx_traffic>(.*?)<\/ht:approx_traffic>/;
    const linkRegex = /<link>(.*?)<\/link>/;
    const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/;
    const newsItemRegex = /<ht:news_item_title><!\[CDATA\[(.*?)\]\]><\/ht:news_item_title>/g;
    
    let match;
    while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemXml = match[1];
        
        const titleMatch = itemXml.match(titleRegex);
        const trafficMatch = itemXml.match(trafficRegex);
        const linkMatch = itemXml.match(linkRegex);
        const pubDateMatch = itemXml.match(pubDateRegex);
        
        // 收集相關新聞標題
        const relatedNews = [];
        let newsMatch;
        while ((newsMatch = newsItemRegex.exec(itemXml)) !== null) {
            relatedNews.push(newsMatch[1]);
        }
        
        if (titleMatch) {
            items.push({
                title: titleMatch[1] || titleMatch[2] || '',
                traffic: trafficMatch ? trafficMatch[1] : null,
                link: linkMatch ? linkMatch[1] : null,
                pubDate: pubDateMatch ? pubDateMatch[1] : null,
                relatedNews: relatedNews.slice(0, 3) // 最多 3 則
            });
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
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    
    // 處理 OPTIONS 預檢請求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // 只允許 GET 請求
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    try {
        // 取得並驗證地區參數
        let geo = (req.query.geo || DEFAULT_GEO).toUpperCase();
        if (!SUPPORTED_GEOS.includes(geo)) {
            geo = DEFAULT_GEO;
        }
        
        // 構建 Google Trends RSS URL
        const rssUrl = `https://trends.google.com/trending/rss?geo=${geo}`;
        
        // 抓取 RSS Feed
        const response = await fetch(rssUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; TrendsDashboard/2.0)',
                'Accept': 'application/rss+xml, application/xml, text/xml'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Google Trends 回應錯誤: ${response.status}`);
        }
        
        const xmlText = await response.text();
        const items = parseRSStoJSON(xmlText);
        
        // 回傳結構化 JSON
        return res.status(200).json({
            success: true,
            geo: geo,
            count: items.length,
            fetchedAt: new Date().toISOString(),
            items: items
        });
        
    } catch (error) {
        console.error('Trending API Error:', error.message);
        return res.status(500).json({
            success: false,
            error: '無法獲取熱門搜尋資料',
            message: error.message
        });
    }
}
