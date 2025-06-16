<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/webp" href="imgs/icon.webp">
    <title>AGoodCam - 聯絡我們</title>
    <link rel="stylesheet" href="css/style.css">
    <style>
        .contact-banner {
            width: 100%;
            height: auto;
            display: block;
            margin: 0 auto;
        }
    </style>
</head>
<body>
    <div class="container legal-container">
        <header>
            <h1>AGoodCam</h1>
            <p>聯絡我們</p>
        </header>
        
        <main class="legal-content">
            <section>
                <h2>聯絡資訊</h2>
                <img src="imgs/banner.webp" alt="AGoodCam Banner" class="contact-banner">
            </section>
            
            <section>
                <p>若您在使用中遇到任何問題，請發送郵件至 <a href="mailto:support@a.oo.gd">support@a.oo.gd</a>。我們會盡快回覆您。</p>
            </section>

            <section>
                <h2>外部連結</h2>
                <ul>
                    <li><a href="https://github.com/AGoodCam" target="_blank">GitHub</a></li>
                </ul>
            </section>

            <div class="legal-footer">
                <button onclick="window.location.href='/'" class="back-btn">返回首頁</button>
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
