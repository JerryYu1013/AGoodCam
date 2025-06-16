# AGoodCam 匿名視訊聊天平台

<p align="center">
  <a href="https://a.oo.gd" target="_blank">
    <img src="https://raw.githubusercontent.com/JerryYu1013/AGoodCam/refs/heads/main/AGoodCam/imgs/banner.webp" alt="AGoodCam 橫幅" hight="160"/>
  </a>
</p>

一個類似 Omegle 的開源匿名視訊聊天平台，讓你與世界各地的隨機陌生人進行一對一的視訊聊天。

[AGoodCam 匿名視訊聊天平台](https://a.oo.gd)

---

## 簡介

### 🌟 功能簡介

- **匿名一對一視訊聊天**  
- **隨機用戶匹配**  
- **即時文字聊天**  
- **視訊 / 音訊切換**  
- **一鍵跳過當前聊天對象**  
- **響應式設計，適配各種設備**  

---

## 使用說明

### 1. 進入配對 
- 閱讀並同意我們的條款與政策後點擊「開始聊天」按鈕。

### 2. 等待配對 
- 系統將為你自動隨機配對一名使用者。

### 3. 開始聊天 
- 可以使用功能列中所有功能。
- 可以使用即時文字聊天功能。

### 4. 跳過使用者 
- 如遇到不良用戶，請使用「跳過」功能。
- 點擊功能列中的橘色按鈕來跳過使用者。

### 5. 結束聊天 
- 若想結束聊天，請使用「掛斷」功能。
- 點擊功能列中的紅色按鈕來結束聊天。

---

## 技術細節

### 前端技術
- **HTML/CSS**：用於頁面結構和樣式設計。
- **JavaScript/WebRTC**：多媒體處理與點對點視訊。
- **Font Awesome**：用於圖標顯示。

### 後端技術
- **PHP**：處理邏輯和頁面更新。
- **Node.js**：信令伺服器部署。
- **Socket.IO**： 低延遲雙向通訊。
 
---

## 部署指南

### 1. 前端部署（PHP）
- 確保伺服器支援 **PHP 7.4+**。
- 將專案所有 PHP 檔案與目錄上傳至網站根目錄。
- 檔案結構範例如下：
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

- 編輯 `js/webrtc.js`，將信令伺服器 URL 改為你的實際網址：
   ```js
   socket = io('https://你的信令伺服器網址', {
       query: {
           userId: userId
       }
   });
   ```

### 2. 信令伺服器部署（Node.js）
- 安裝 Node.js 14+。
- 上傳下列檔案到你的伺服器：
   ```
   signaling-server.js
   signaling-status.html
   package.json
   ```

- 安裝依賴：
   ```bash
   npm install
   ```

- 啟動信令伺服器：
   ```bash
   npm start
   ```

- 使用 PM2 後台運行（可選）：
   ```bash
   npm install -g pm2
   pm2 start signaling-server.js --name agoodcam-signaling
   ```

### 3. 配置 HTTPS（必要）
- WebRTC 在生產環境需透過 HTTPS 運作。建議方式：
1. 使用 Let's Encrypt 取得免費 SSL 憑證。  
2. 配置 Apache/Nginx SSL。  
3. 使用反向代理時，確保 WebSocket 也走 HTTPS。  

---

## 自定義

- 視覺樣式：編輯 `css/style.css` 與 `css/chat.css`。  
- 文字內容：修改相關 `.php` 檔案。  
- WebRTC 參數：調整 `js/webrtc.js`。  

---

有任何問題或建議，請隨時聯繫我！ 🎉
