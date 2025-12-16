/**
 * Express Router: Google Search Console API Proxy
 * 
 * @description 代理 Google Search Console API 請求
 * @endpoint GET /api/gsc?keyword=xxx&domain=xxx
 */

module.exports = async function handler(req, res) {
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    try {
        const { keyword, domain, token } = req.query;
        
        if (!keyword || !domain) {
            return res.status(400).json({
                success: false,
                error: '缺少必要參數: keyword 和 domain'
            });
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                error: '缺少存取權杖',
                needsAuth: true
            });
        }

        // 計算日期範圍（過去 7 天）
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        const siteUrl = domain.includes('://') ? domain : `sc-domain:${domain}`;
        const apiUrl = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                dimensions: ['query', 'page'],
                dimensionFilterGroups: [{
                    filters: [{
                        dimension: 'query',
                        operator: 'contains',
                        expression: keyword
                    }]
                }],
                rowLimit: 10
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('GSC API Error:', errorText);
            
            if (response.status === 401) {
                return res.status(401).json({
                    success: false,
                    error: '存取權杖已過期或無效',
                    needsAuth: true
                });
            }
            
            if (response.status === 403) {
                return res.status(403).json({
                    success: false,
                    error: '無權存取此網站資料，請確認網站已在 Search Console 驗證'
                });
            }

            throw new Error(`GSC API Error: ${response.status}`);
        }

        const data = await response.json();
        
        // 處理結果
        const results = [];
        if (data.rows && data.rows.length > 0) {
            data.rows.forEach(row => {
                results.push({
                    keyword: row.keys[0],
                    url: row.keys[1],
                    position: Math.round(row.position),
                    clicks: row.clicks,
                    impressions: row.impressions,
                    ctr: (row.ctr * 100).toFixed(2) + '%'
                });
            });
        }

        res.json({
            success: true,
            keyword: keyword,
            domain: domain,
            dataRange: {
                start: startDate.toISOString().split('T')[0],
                end: endDate.toISOString().split('T')[0]
            },
            results: results,
            source: 'gsc',
            checkedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('GSC Proxy Error:', error.message);
        res.status(500).json({
            success: false,
            error: '查詢失敗',
            message: error.message
        });
    }
};
