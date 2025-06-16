<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/webp" href="imgs/icon.webp">
    <title>AGoodCam - 匿名視訊聊天</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>AGoodCam</h1>
            <p>匿名隨機視訊聊天平台</p>
        </header>
        
        <main>
            <div class="welcome-box">
                <h2>歡迎來到 AGoodCam</h2>
                <p>在這裡，您可以與全世界的隨機用戶進行匿名視訊聊天</p>
                
                <p class="terms-agreement">點擊下方「開始聊天」即表示您已同意我們的<a href="terms.php">使用條款</a>和<a href="privacy.php">隱私政策</a>。</p>

                <form action="chat.php" method="post">
                    <button type="submit" class="start-button">開始聊天</button>
                </form>
            </div>
            
            <div class="info-section">
                <div class="info-box">
                    <h3>如何使用</h3>
                    <ol>
                        <li>請確認您已年滿<strong>18</strong>歲</li>
                        <li>閱讀並同意使用條款和隱私政策</li>
                        <li>點擊「開始聊天」按鈕</li>
                        <li>允許瀏覽器使用您的鏡頭和麥克風</li>
                        <li>系統會自動為您匹配一位隨機用戶</li>
                    </ol>
                </div>
                
                <div class="info-box">
                    <h3>注意事項</h3>
                    <ul>
                        <li>請尊重其他用戶</li>
                        <li>禁止任何形式的不當行為</li>
                        <li>如遇到不良用戶，請使用「跳過」功能</li>
                        <li>我們不會記錄您的聊天內容</li>
                        <li>我們無法保證其他用戶不記錄與您的聊天</li>
                    </ul>
                </div>
            </div>
        </main>
        
        <footer>
            <p>&copy; <?php echo date("Y"); ?> AGoodCam. All Rights Reserved.</p>
            <div class="footer-links">
                <a href="terms.php">使用條款</a> | 
                <a href="privacy.php">隱私政策</a> | 
                <a href="about.php">關於我們</a> | 
                <a href="contact.php">聯絡我們</a>
            </div>
        </footer>
    </div>
</body>
</html> 
