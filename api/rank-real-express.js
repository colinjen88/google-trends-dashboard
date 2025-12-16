/**
 * Express Router: Real Google Search Rank Checker
 * 
 * @description 使用 Puppeteer 無頭瀏覽器爬取真實 Google 搜尋排名
 * @endpoint GET /api/rank-real?q=keyword&domain=example.com
 * 
 * ⚠️ 注意：
 * - 需要在 VPS 安裝 puppeteer: npm install puppeteer
 * - 大量請求可能被 Google 暫時封鎖，請適度使用
 */

let puppeteer;
try {
    puppeteer = require('puppeteer');
} catch (e) {
    console.warn('Puppeteer not installed. Run: npm install puppeteer');
}

// 快取（避免重複請求）
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 小時

/**
 * 搜尋 Google 並找出排名
 */
async function searchGoogle(keyword, domain, gl = 'tw') {
    if (!puppeteer) {
        throw new Error('Puppeteer 未安裝，請執行: npm install puppeteer');
    }

    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-features=IsolateOrigins,site-per-process',
            '--incognito'  // 無痕模式
        ]
    });

    try {
        const page = await browser.newPage();
        
        // 設定語言和地區
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'zh-TW,zh;q=0.9'
        });
        
        // 模擬真實使用者
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        // 前往 Google 搜尋
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&gl=${gl}&hl=zh-TW&num=100`;
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        // 等待搜尋結果載入
        await page.waitForSelector('#search', { timeout: 10000 });

        // 提取搜尋結果
        const results = await page.evaluate(() => {
            const items = [];
            // Google 搜尋結果選擇器
            const resultElements = document.querySelectorAll('#search .g');
            
            resultElements.forEach((el, index) => {
                const linkEl = el.querySelector('a[href^="http"]');
                const titleEl = el.querySelector('h3');
                
                if (linkEl && titleEl) {
                    items.push({
                        position: index + 1,
                        url: linkEl.href,
                        title: titleEl.textContent,
                        domain: new URL(linkEl.href).hostname
                    });
                }
            });
            
            return items;
        });

        // 尋找目標網域
        const cleanDomain = domain.replace(/^www\./, '').toLowerCase();
        let foundResult = null;
        
        for (const result of results) {
            const resultDomain = result.domain.replace(/^www\./, '').toLowerCase();
            if (resultDomain.includes(cleanDomain) || cleanDomain.includes(resultDomain)) {
                foundResult = result;
                break;
            }
        }

        return {
            success: true,
            keyword: keyword,
            domain: domain,
            rank: foundResult ? foundResult.position : null,
            url: foundResult ? foundResult.url : null,
            title: foundResult ? foundResult.title : null,
            totalResults: results.length,
            source: 'puppeteer',
            note: foundResult ? null : `前 ${results.length} 名未找到`
        };

    } finally {
        await browser.close();
    }
}

module.exports = async function handler(req, res) {
    // 允許 CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { q: keyword, domain, gl = 'tw' } = req.query;

        if (!keyword || !domain) {
            return res.status(400).json({
                success: false,
                error: '缺少必要參數: q (關鍵字) 和 domain (網域)'
            });
        }

        // 檢查快取
        const cacheKey = `${keyword}:${domain}:${gl}`;
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return res.json({ ...cached.data, cached: true });
        }

        // 執行搜尋
        const result = await searchGoogle(keyword, domain, gl);
        
        // 儲存快取
        cache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });

        res.json({
            ...result,
            checkedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Rank Check Error:', error.message);
        
        // 給出有用的錯誤資訊
        let errorMessage = error.message;
        if (error.message.includes('Puppeteer')) {
            errorMessage = 'Puppeteer 未安裝。請在 VPS 執行: npm install puppeteer';
        } else if (error.message.includes('timeout')) {
            errorMessage = 'Google 搜尋逾時，請稍後再試';
        }

        res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
};
