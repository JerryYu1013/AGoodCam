<?php
session_start();

// 由於點擊按鈕即表示同意，已移除年齡和條款的伺服器端檢查

// 生成唯一的用戶ID用於匹配
if (!isset($_SESSION['user_id'])) {
    $_SESSION['user_id'] = uniqid('user_');
}

$user_id = $_SESSION['user_id'];

// --- IP地理位置查詢結束 ---

?>

<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/webp" href="imgs/icon.webp">
    <title>AGoodCam - 聊天中</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/chat.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .header-logo-link {
            text-decoration: none;
            display: block; /* 讓連結佔據整行 */
            margin-bottom: 5px; /* 在標題和狀態之間添加一些間距 */
        }
        .header-logo-link h1 {
            background: linear-gradient(90deg, #1a73e8, #4a90e2);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            transition: all 0.3s ease;
            display: inline-block; /* 保持漸變效果 */
            margin: 0;
            padding: 0;
            font-size: 1.8rem;
        }

        .header-logo-link:hover h1 {
            filter: brightness(1.1);
        }

        /* 更新：移除 chat-header 的 Flexbox 佈局 */
        .chat-header {
            padding: 15px 20px;
            border-bottom: 0;
            display: flex;
            flex-direction: column;
        }

        .online-status {
            display: flex;
            align-items: center;
            font-size: 0.9rem;
            color: #555;
            margin-top: 5px;
        }

        .online-status .status-dot {
            width: 8px;
            height: 8px;
            background-color: #bbb; /* 連接前預設灰色 */
            border-radius: 50%;
            margin-right: 6px;
            transition: background-color 0.3s ease;
            animation: pulse 2s infinite; /* 恢復脈動動畫 */
        }

        .online-status.connected .status-dot {
             background-color: #28a745; /* 連接後變綠色 */
        }

        @keyframes pulse {
            0% { opacity: 0.5; }
            50% { opacity: 1; }
            100% { opacity: 0.5; }
        }

        /* End button icon flip */
        #end-btn i.fa-phone-slash {
            transform: scaleX(-1);
        }

    </style>
</head>
<body>
    <div class="chat-container">
        <header class="chat-header">
            <a href="/" class="header-logo-link">
                <h1>AGoodCam</h1>
            </a>
            <div class="online-status">
                <span class="status-dot"></span>
                <span id="connection-status">等待連接...</span>
            </div>
        </header>
        
        <main class="chat-main">
            <div class="azar-video-container">
                <!-- 主視訊區（對方） -->
                <div class="main-video-wrapper">
                    <video id="remote-video" autoplay playsinline></video>
                    <div class="peer-info">
                        <div class="video-label">對方</div>
                    </div>
                </div>
                
                <!-- 小視訊區（自己） -->
                <div class="self-video-wrapper">
                    <video id="local-video" autoplay muted playsinline></video>
                    <div class="resize-handle"></div>
                    <div class="self-info">
                    <div class="video-label">您</div>
                    </div>
                </div>
                
                <!-- 等待配對動畫 -->
                <div id="waiting-message">
                    <div class="waiting-animation"></div>
                    <div>正在尋找聊天對象...</div>
                </div>
                
                <!-- 配對中脈衝動畫 -->
                <div class="pairing-animation" style="display: none;">
                    <div class="pulse-circles">
                        <div class="pulse-circle"></div>
                        <div class="pulse-circle"></div>
                        <div class="pulse-circle"></div>
                    </div>
                    <div class="searching-text">尋找聊天對象中...</div>
                </div>
                
                <!-- 底部控制欄 -->
                <div class="bottom-controls">
                    <div class="controls-wrapper">
                        <button id="flip-camera-btn" class="control-btn">
                            <i class="fas fa-camera-rotate"></i>
                        </button>
                        <button id="toggle-video-btn" class="control-btn">
                            <i class="fas fa-video"></i>
                        </button>
                        <button id="toggle-audio-btn" class="control-btn">
                            <i class="fas fa-microphone"></i>
                        </button>
                        <button id="end-btn" class="control-btn main-btn">
                            <i class="fas fa-phone-slash"></i>
                        </button>
                        <button id="skip-btn" class="control-btn">
                            <i class="fas fa-forward"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- 聊天泡泡按鈕 -->
            <div class="chat-bubble" id="chat-bubble">
                <i class="fas fa-comment"></i>
                <div class="chat-notification" style="display: none;">1</div>
            </div>
            
            <!-- 新的聊天視窗 -->
            <div class="text-chat">
                <div class="chat-header-bar" id="chat-header-bar">
                    <h3>即時聊天</h3>
                    <button class="chat-toggle-btn" id="chat-toggle-btn">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>
                <div id="chat-messages" class="messages-area"></div>
                <div class="input-area">
                    <input type="text" id="message-input" placeholder="輸入訊息..." disabled>
                    <button id="send-btn" disabled><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        </main>
    </div>

    <!-- 使用者ID隱藏傳遞 -->
    <input type="hidden" id="user-id" value="<?php echo $user_id; ?>">
    
    <!-- 載入所需的JavaScript檔案 -->
    <script src="https://cdn.jsdelivr.net/npm/socket.io-client@4/dist/socket.io.min.js"></script>
    <script src="js/webrtc.js"></script>
    <script src="js/chat.js"></script>
    
    <footer>
        <p>&copy; <?php echo date("Y"); ?> AGoodCam. All Rights Reserved.</p>
        <div class="footer-links">
            <a href="terms.php">使用條款</a> | 
            <a href="privacy.php">隱私政策</a> | 
            <a href="about.php">關於我們</a> | 
            <a href="contact.php">聯絡我們</a>
        </div>
    </footer>
</body>
</html> 