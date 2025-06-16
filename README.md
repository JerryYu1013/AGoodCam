# AGoodCam 匿名視訊聊天平台

<p align="center">
  <a href="https://a.oo.gd" target="_blank">
    <img src="https://raw.githubusercontent.com/JerryYu1013/AGoodCam/refs/heads/main/imgs/banner.webp" alt="AGoodCam 橫幅" hight="160"/>
  </a>
</p>

一個類似 Omegle 的開源匿名視訊聊天平台，讓您與世界各地的隨機陌生人進行一對一的視訊聊天。

[AGoodCam 匿名視訊聊天平台](https://a.oo.gd)

---

## 簡介

### 🚀 功能簡介

- 匿名一對一視訊聊天  
- 隨機用戶匹配  
- 即時文字聊天  
- 視訊 / 音訊切換  
- 一鍵跳過當前聊天對象  
- 響應式設計，適配各種設備  

---

### 技術架構

- **前端**：HTML / CSS / JavaScript、WebRTC  
- **後端**：PHP、Node.js（信令伺服器）  
- **通訊協定**：Socket.IO  
- **多媒體處理**：WebRTC（點對點音視訊）  

---

## 部署指南

### 前端部署（PHP）

1. 確保伺服器支援 **PHP 7.4+**
2. 將專案所有 PHP 檔案與目錄上傳至網站根目錄
3. 檔案結構範例如下：

   ```
   /index.php
   /chat.php
   /terms.php
   /privacy.php
   /about.php
   /contact.php
   /css/
   /js/
   /imgs/
   ```

4. 編輯 `js/webrtc.js`，將信令伺服器 URL 改為你的實際網址：

   ```js
   socket = io('https://你的信令伺服器網址', {
       query: {
           userId: userId
       }
   });
   ```

---

### 信令伺服器部署（Node.js）

1. 安裝 Node.js 14+
2. 上傳下列檔案到你的伺服器：

   ```
   signaling-server.js
   signaling-status.html
   package.json
   ```

3. 安裝依賴：

   ```bash
   npm install
   ```

4. 啟動信令伺服器：

   ```bash
   npm start
   ```

5. 使用 PM2 後台運行（可選）：

   ```bash
   npm install -g pm2
   pm2 start signaling-server.js --name agoodcam-signaling
   ```

---

### 配置 HTTPS（必要）

WebRTC 在生產環境需透過 HTTPS 運作。建議方式：

1. 使用 Let's Encrypt 取得免費 SSL 憑證  
2. 配置 Apache/Nginx SSL  
3. 使用反向代理時，確保 WebSocket 也走 HTTPS  

---

## 自定義

- 視覺樣式：編輯 `css/style.css` 與 `css/chat.css`  
- 文字內容：修改相關 `.php` 檔案  
- WebRTC 參數：調整 `js/webrtc.js`  

---

## 安全建議

- 定期更新所有依賴套件  
- 監控伺服器資源使用  
- 實施請求速率限制防止濫用  
- 加入用戶舉報與內容審核機制（建議）  

---

有任何問題或建議，請隨時聯繫我！ 🎉
