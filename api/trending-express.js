/**
 * Express Router: Google Trends RSS Proxy
 */

const SUPPORTED_GEOS = ['TW', 'US', 'JP', 'KR', 'CN', 'HK', 'SG'];
const DEFAULT_GEO = 'TW';

function parseRSStoJSON(xmlText) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/;
    const trafficRegex = /<ht:approx_traffic>(.*?)<\/ht:approx_traffic>/;
    const linkRegex = /<link>(.*?)<\/link>/;
    const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/;
    
    let match;
    while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemXml = match[1];
        const titleMatch = itemXml.match(titleRegex);
        const trafficMatch = itemXml.match(trafficRegex);
        const linkMatch = itemXml.match(linkRegex);
        const pubDateMatch = itemXml.match(pubDateRegex);
        
        if (titleMatch) {
            items.push({
                title: titleMatch[1] || titleMatch[2] || '',
                traffic: trafficMatch ? trafficMatch[1] : null,
                link: linkMatch ? linkMatch[1] : null,
                pubDate: pubDateMatch ? pubDateMatch[1] : null
            });
        }
    }
    return items;
}

module.exports = async function handler(req, res) {
    res.setHeader('Cache-Control', 'public, max-age=300');
    
    try {
        let geo = (req.query.geo || DEFAULT_GEO).toUpperCase();
        if (!SUPPORTED_GEOS.includes(geo)) {
            geo = DEFAULT_GEO;
        }
        
        const rssUrl = `https://trends.google.com/trending/rss?geo=${geo}`;
        
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
        
        res.json({
            success: true,
            geo: geo,
            count: items.length,
            fetchedAt: new Date().toISOString(),
            items: items
        });
        
    } catch (error) {
        console.error('Trending API Error:', error.message);
        res.status(500).json({
            success: false,
            error: '無法獲取熱門搜尋資料',
            message: error.message
        });
    }
};
