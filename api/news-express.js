/**
 * Express Router: Google News RSS Proxy
 */

const LANGUAGE_CONFIG = {
    TW: { hl: 'zh-TW', gl: 'TW', ceid: 'TW:zh-Hant' },
    US: { hl: 'en-US', gl: 'US', ceid: 'US:en' },
    JP: { hl: 'ja', gl: 'JP', ceid: 'JP:ja' },
    KR: { hl: 'ko', gl: 'KR', ceid: 'KR:ko' },
    CN: { hl: 'zh-CN', gl: 'CN', ceid: 'CN:zh-Hans' }
};

const DEFAULT_REGION = 'TW';
const MAX_ITEMS = 10;

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

module.exports = async function handler(req, res) {
    res.setHeader('Cache-Control', 'public, max-age=600');
    
    try {
        const query = req.query.q;
        if (!query || query.trim() === '') {
            return res.status(400).json({
                success: false,
                error: '缺少必要參數: q (搜尋關鍵字)'
            });
        }
        
        const region = (req.query.region || DEFAULT_REGION).toUpperCase();
        const config = LANGUAGE_CONFIG[region] || LANGUAGE_CONFIG[DEFAULT_REGION];
        
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
        
        res.json({
            success: true,
            query: query,
            region: region,
            count: items.length,
            fetchedAt: new Date().toISOString(),
            items: items
        });
        
    } catch (error) {
        console.error('News API Error:', error.message);
        res.status(500).json({
            success: false,
            error: '無法獲取新聞資料',
            message: error.message
        });
    }
};
