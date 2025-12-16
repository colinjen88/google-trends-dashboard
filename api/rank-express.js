/**
 * Express Router: Google Search Rank Checker
 */

const DEFAULT_REGION = 'TW';

async function checkRankSimulated(keyword, domain) {
    const found = Math.random() > 0.3;
    if (found) {
        return {
            rank: Math.floor(Math.random() * 50) + 1,
            url: `https://${domain}/page-${Math.floor(Math.random() * 10)}`,
            simulated: true
        };
    }
    return { rank: null, url: null, simulated: true };
}

async function checkRankWithSerpApi(keyword, domain, gl) {
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) return null;

    try {
        const params = new URLSearchParams({
            api_key: apiKey,
            q: keyword,
            gl: gl,
            num: 100,
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

module.exports = async function handler(req, res) {
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    try {
        const { q: keyword, domain, gl = DEFAULT_REGION } = req.query;

        if (!keyword || !domain) {
            return res.status(400).json({
                success: false,
                error: '缺少必要參數: q (關鍵字) 和 domain (網域)'
            });
        }

        let result = await checkRankWithSerpApi(keyword, domain, gl);
        if (!result) {
            result = await checkRankSimulated(keyword, domain);
        }

        res.json({
            success: true,
            keyword: keyword,
            domain: domain,
            region: gl,
            ...result,
            checkedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Rank API Error:', error.message);
        res.status(500).json({
            success: false,
            error: '排名檢查失敗',
            message: error.message
        });
    }
};
