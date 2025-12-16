# Hostinger VPS 部署指南

本指南說明如何將 Google Trends Dashboard 2.0 部署到 Hostinger VPS。

## 前置需求

- Hostinger VPS (Ubuntu 20.04 或更新版本)
- SSH 存取權限
- 域名（選配）

## 步驟 1：連接到 VPS

```bash
ssh root@your-vps-ip
```

## 步驟 2：安裝 Node.js

```bash
# 更新系統
apt update && apt upgrade -y

# 安裝 Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# 驗證安裝
node -v
npm -v
```

## 步驟 3：安裝 PM2（程序管理器）

```bash
npm install -g pm2
```

## 步驟 4：安裝 Nginx（反向代理）

```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

## 步驟 5：複製專案到 VPS

### 方法 A：使用 Git（推薦）

```bash
# 安裝 Git
apt install -y git

# 複製專案
cd /var/www
git clone https://github.com/colinjen88/google-trends-dashboard.git
cd google-trends-dashboard
```

### 方法 B：使用 SFTP

使用 FileZilla 或 WinSCP 將專案檔案上傳到 `/var/www/google-trends-dashboard/`

## 步驟 6：安裝依賴並啟動

```bash
cd /var/www/google-trends-dashboard

# 安裝生產依賴
npm install --production

# 🔥 安裝 Puppeteer（用於真實排名檢測）
npm install puppeteer

# 安裝 Puppeteer 所需的系統依賴
apt install -y chromium-browser
# 或使用以下命令安裝所有依賴
apt install -y ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils

# 使用 PM2 啟動
pm2 start ecosystem.config.json

# 設定開機自動啟動
pm2 startup
pm2 save
```

> 💡 安裝 Puppeteer 後，排名追蹤功能將使用無頭瀏覽器爬取 Google 搜尋結果，獲得真實排名！

## 步驟 7：設定 Nginx 反向代理

```bash
nano /etc/nginx/sites-available/trends-dashboard
```

貼上以下內容：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替換為您的域名或 IP

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

啟用網站設定：

```bash
ln -s /etc/nginx/sites-available/trends-dashboard /etc/nginx/sites-enabled/
nginx -t  # 測試設定
systemctl reload nginx
```

## 步驟 8：設定 SSL（HTTPS）

```bash
# 安裝 Certbot
apt install -y certbot python3-certbot-nginx

# 取得 SSL 證書
certbot --nginx -d your-domain.com
```

## 步驟 9：設定防火牆

```bash
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable
```

## 環境變數設定（選配）

如需使用 SerpApi 真實排名檢查：

```bash
# 編輯環境變數
nano /var/www/google-trends-dashboard/.env
```

```
SERPAPI_KEY=your_serpapi_api_key
```

更新 PM2 配置以載入 .env：

```bash
pm2 restart trends-dashboard --update-env
```

## 常用管理命令

```bash
# 查看狀態
pm2 status

# 查看日誌
pm2 logs trends-dashboard

# 重新啟動
pm2 restart trends-dashboard

# 停止
pm2 stop trends-dashboard

# 更新程式碼
cd /var/www/google-trends-dashboard
git pull
npm install --production
pm2 restart trends-dashboard
```

## 故障排除

### 應用程式無法啟動

```bash
# 查看錯誤日誌
pm2 logs trends-dashboard --err

# 手動測試
cd /var/www/google-trends-dashboard
node server.js
```

### Nginx 502 錯誤

1. 確認 Node.js 應用程式正在運行：`pm2 status`
2. 確認 Port 正確：應用程式應在 3000 端口
3. 檢查 Nginx 日誌：`tail -f /var/log/nginx/error.log`

### 無法連接

1. 確認防火牆設定：`ufw status`
2. 確認 Hostinger 控制面板的防火牆規則
3. 確認 DNS 指向正確

## 完成

您的 Google Trends Dashboard 2.0 現已部署完成！

訪問：
- HTTP: `http://your-domain.com`
- HTTPS: `https://your-domain.com`
