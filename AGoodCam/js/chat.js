/**
 * AGoodCam 聊天頁面輔助腳本
 * 處理非WebRTC相關的功能
 */

document.addEventListener('DOMContentLoaded', function() {
    // 檢測設備類型
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // 在控制按鈕上添加工具提示
    setupToolTips();
    
    // 設置可拖動和可調整大小的本地視訊窗口
    setupDraggableResizableSelfVideo();
    
    // 設置工具提示
    function setupToolTips() {
        const buttons = document.querySelectorAll('button[title]');
        buttons.forEach(button => {
            const title = button.getAttribute('title');
            if (!title) return;
            
            // 在游標懸浮時顯示提示
            button.addEventListener('mouseenter', function(e) {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = title;
                
                document.body.appendChild(tooltip);
                
                // 定位提示
                const rect = button.getBoundingClientRect();
                tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
                tooltip.style.top = rect.bottom + 10 + 'px';
                
                // 存儲提示元素的引用
                button.tooltip = tooltip;
            });
            
            // 游標離開時移除提示
            button.addEventListener('mouseleave', function() {
                if (button.tooltip) {
                    button.tooltip.remove();
                    button.tooltip = null;
                }
            });
        });
    }
    
    // 雙擊切換全屏
    const videoContainer = document.querySelector('.azar-video-container');
    if (videoContainer) {
        // 添加雙擊檢測
        let lastTap = 0;
        videoContainer.addEventListener('click', function(e) {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < 300 && tapLength > 0) {
                // 雙擊檢測到，切換全屏
                toggleFullScreen(videoContainer);
                e.preventDefault();
            }
            
            lastTap = currentTime;
        });
    }
    
    // 切換全屏函數
    function toggleFullScreen(element) {
        if (!document.fullscreenElement &&
            !document.mozFullScreenElement &&
            !document.webkitFullscreenElement &&
            !document.msFullscreenElement) {
            // 進入全屏
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
            }
        } else {
            // 退出全屏
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    }
    
    // 防止頁面離開時意外關閉
    window.addEventListener('beforeunload', function(e) {
        const confirmationMessage = '您確定要離開聊天頁面嗎？這將中斷當前的視訊聊天。';
        e.returnValue = confirmationMessage;
        return confirmationMessage;
    });
    
    // 處理頁面可見性變化
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden') {
            // 頁面隱藏時處理，例如通知對方或暫停視訊
            console.log('頁面隱藏');
        } else {
            // 頁面再次可見時處理
            console.log('頁面可見');
        }
    });
    
    // 添加系統主題檢測和跟隨
    function setupSystemThemeDetection() {
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        function applyTheme(isDarkMode) {
            if (isDarkMode) {
                document.body.classList.add('dark-mode');
                console.log('系統主題變化: 切換到暗色模式');
            } else {
                document.body.classList.remove('dark-mode');
                console.log('系統主題變化: 切換到亮色模式');
            }
        }

        // 檢測系統主題變化
        darkModeQuery.addEventListener('change', (e) => {
            applyTheme(e.matches);
        });
        
        // 初始加載時應用主題
        applyTheme(darkModeQuery.matches);
    }
    
    setupSystemThemeDetection();
    
    // 自動聚焦訊息輸入框
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.addEventListener('focus', function() {
            // 當輸入框獲得焦點時，添加一個類來高亮顯示
            this.parentElement.classList.add('focus');
        });
        
        messageInput.addEventListener('blur', function() {
            // 當輸入框失去焦點時，移除高亮類
            this.parentElement.classList.remove('focus');
        });
    }
    
    // 連接狀態顯示動畫
    const animateStatus = function() {
        const statusSpan = document.getElementById('connection-status');
        if (statusSpan && statusSpan.textContent.includes('等待') || statusSpan.textContent.includes('尋找')) {
            let dots = statusSpan.getAttribute('data-dots') || 0;
            dots = (parseInt(dots) + 1) % 4;
            
            let text = statusSpan.textContent.replace(/\.+$/, '');
            text += '.'.repeat(dots);
            
            statusSpan.textContent = text;
            statusSpan.setAttribute('data-dots', dots);
        }
    };
    
    // 添加CSS樣式
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .tooltip {
                position: absolute;
                background-color: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 5px 10px;
                border-radius: 5px;
                font-size: 12px;
                z-index: 9999;
                pointer-events: none;
                opacity: 0;
                animation: tooltip-fade 0.3s ease forwards;
            }
            
            @keyframes tooltip-fade {
                to { opacity: 1; }
            }
            
            .system-message {
                background-color: rgba(50, 50, 50, 0.7);
                color: #ddd;
                text-align: center;
                font-style: italic;
                padding: 8px 12px;
                margin: 10px auto;
                border-radius: 15px;
                max-width: 90%;
            }
        `;
        document.head.appendChild(style);
    }
    
    // 添加自定義樣式
    addStyles();
    
    // 每秒更新狀態動畫
    setInterval(animateStatus, 500);
    
    // 設置可拖動和可調整大小的函數
    function setupDraggableResizableSelfVideo() {
        const selfVideoWrapper = document.querySelector('.self-video-wrapper');
        if (!selfVideoWrapper) return;

        let isDragging = false;
        let isResizing = false;
        let startX, startY, initialX, initialY, initialWidth, initialHeight;
        let initialDistance = null;
        let currentScale = 1; // 初始化為 1

        // 創建調整大小控制點 (如果不存在)
        let resizeHandle = selfVideoWrapper.querySelector('.resize-handle');
        if (!resizeHandle) {
            resizeHandle = document.createElement('div');
            resizeHandle.className = 'resize-handle';
            selfVideoWrapper.appendChild(resizeHandle);
        }

        // --- 電腦版拖曳和調整大小 --- 
        
        // 拖曳 - 游標按下
        selfVideoWrapper.addEventListener('mousedown', function(e) {
            // 如果點擊的是調整大小控制點，則不觸發拖曳
            if (e.target === resizeHandle) return;
            
            e.preventDefault();
            isDragging = true;
            selfVideoWrapper.classList.add('dragging');
            startX = e.clientX;
            startY = e.clientY;
            
            // 獲取當前應用的縮放比例
            const transformStyle = window.getComputedStyle(selfVideoWrapper).transform;
            if (transformStyle && transformStyle !== 'none') {
                try {
                    const matrix = new DOMMatrix(transformStyle);
                    currentScale = matrix.m11; // 或 matrix.a
                } catch (err) {
                    console.error("無法解析 transform 矩陣:", err);
                    currentScale = 1;
                }
            } else {
                currentScale = 1;
            }
            
            const style = window.getComputedStyle(selfVideoWrapper);
            initialX = parseInt(style.right, 10) || 0;
            initialY = parseInt(style.top, 10) || 0;
            
            // 移除過渡效果以實現流暢拖曳
            selfVideoWrapper.style.transition = 'none';
            
            console.log(`[Desktop] Drag Start: initialX=${initialX}, initialY=${initialY}, scale=${currentScale}`);
        });

        // 調整大小 - 游標按下
        resizeHandle.addEventListener('mousedown', function(e) {
            e.preventDefault();
            e.stopPropagation(); // 阻止冒泡觸發拖曳
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            initialWidth = selfVideoWrapper.offsetWidth;
            initialHeight = selfVideoWrapper.offsetHeight;
            
            // 暫時移除縮放以便調整實際尺寸
            const transformStyle = window.getComputedStyle(selfVideoWrapper).transform;
            if (transformStyle && transformStyle !== 'none') {
                try {
                    const matrix = new DOMMatrix(transformStyle);
                    currentScale = matrix.m11;
                } catch (err) {
                    currentScale = 1;
                }
            }
            
            // 移除 transform，以便基於 width/height 調整
            selfVideoWrapper.style.transform = 'none'; 
            selfVideoWrapper.style.transition = 'none';
            
            console.log(`[Desktop] Resize Start: initialW=${initialWidth}, initialH=${initialHeight}`);
        });

        // 游標移動 (處理拖曳和調整大小)
        document.addEventListener('mousemove', function(e) {
            if (isDragging) {
                const deltaX = startX - e.clientX;
                const deltaY = e.clientY - startY;
                let newRight = initialX + deltaX;
                let newTop = initialY + deltaY;

                // 使用與觸控相同的邊界檢測函數
                const boundaries = calculateVisualBoundaries(selfVideoWrapper, currentScale);
                newRight = Math.max(boundaries.minRight, Math.min(newRight, boundaries.maxRight));
                newTop = Math.max(boundaries.minTop, Math.min(newTop, boundaries.maxTop));

                selfVideoWrapper.style.right = `${newRight}px`;
                selfVideoWrapper.style.top = `${newTop}px`;
            }

            if (isResizing) {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                
                // 允許自由調整大小
                let newWidth = initialWidth + deltaX;
                let newHeight = initialHeight + deltaY;

                // 添加最小和最大尺寸限制
                const minWidth = 100;
                const minHeight = 100;
                const maxWidth = window.innerWidth * 0.8;
                const maxHeight = window.innerHeight * 0.8;
                
                newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
                newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));

                selfVideoWrapper.style.width = `${newWidth}px`;
                // 可選：保持寬高比例
                // selfVideoWrapper.style.height = `${newWidth * (initialHeight / initialWidth)}px`;
                selfVideoWrapper.style.height = `${newHeight}px`;
            }
        });

        // 游標釋放
        document.addEventListener('mouseup', function() {
            if (isDragging) {
                isDragging = false;
                selfVideoWrapper.classList.remove('dragging');
                selfVideoWrapper.style.transition = 'box-shadow 0.3s ease, transform 0.1s ease';
                console.log('[Desktop] Drag End');
            }
            
            if (isResizing) {
                isResizing = false;
                
                // 恢復之前的 transform scale
                if (currentScale !== 1) {
                    selfVideoWrapper.style.transform = `scale(${currentScale})`;
                }
                
                selfVideoWrapper.style.transition = 'box-shadow 0.3s ease, transform 0.1s ease';
                console.log(`[Desktop] Resize End: scale=${currentScale}`);
            }
        });

        // --- 手機版拖曳和縮放 --- 

        // 觸摸開始
        selfVideoWrapper.addEventListener('touchstart', function(e) {
            // 獲取當前應用的縮放比例
            const transformStyle = window.getComputedStyle(selfVideoWrapper).transform;
            if (transformStyle && transformStyle !== 'none') {
                try {
                    const matrix = new DOMMatrix(transformStyle);
                    currentScale = matrix.m11; // 或 matrix.a
                } catch (err) {
                    console.error("無法解析 transform 矩陣:", err);
                    currentScale = 1;
                }
            } else {
                currentScale = 1;
            }
            
            if (e.touches.length === 1 && !isResizing) {
                isDragging = true;
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                const style = window.getComputedStyle(selfVideoWrapper);
                initialX = parseInt(style.right, 10) || 0;
                initialY = parseInt(style.top, 10) || 0;
                initialDistance = null;
                selfVideoWrapper.style.transition = 'none'; 
                console.log(`[Mobile] TouchStart Drag: initialX=${initialX}, initialY=${initialY}, currentScale=${currentScale}`);
            } else if (e.touches.length === 2) {
                isDragging = false; 
                e.preventDefault();
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                initialDistance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
                selfVideoWrapper.style.transition = 'transform 0.1s ease'; 
                console.log(`[Mobile] TouchStart Zoom: initialDistance=${initialDistance}, currentScale=${currentScale}`);
            }
        });

        // 觸摸移動
        document.addEventListener('touchmove', function(e) {
            if (isDragging && e.touches.length === 1) {
                // 單指拖曳
                e.preventDefault();
                const currentX = e.touches[0].clientX;
                const currentY = e.touches[0].clientY;
                const deltaX = startX - currentX; // right 增加量
                const deltaY = currentY - startY; // top 增加量
                let newRight = initialX + deltaX;
                let newTop = initialY + deltaY;

                // 使用改進後的邊界檢測
                const boundaries = calculateVisualBoundaries(selfVideoWrapper, currentScale);
                newRight = Math.max(boundaries.minRight, Math.min(newRight, boundaries.maxRight));
                newTop = Math.max(boundaries.minTop, Math.min(newTop, boundaries.maxTop));

                selfVideoWrapper.style.right = `${newRight}px`;
                selfVideoWrapper.style.top = `${newTop}px`;
            } else if (initialDistance !== null && e.touches.length === 2) {
                // 雙指縮放
                e.preventDefault();
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const currentDistance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
                let scale = (currentDistance / initialDistance) * currentScale;
                scale = Math.max(0.5, Math.min(scale, 3)); 
                selfVideoWrapper.style.transform = `scale(${scale})`;
            }
        });

        // 觸摸結束
        document.addEventListener('touchend', function(e) {
            if (isDragging) {
                isDragging = false;
                selfVideoWrapper.style.transition = 'box-shadow 0.3s ease, transform 0.1s ease'; 
                console.log('[Mobile] TouchEnd Drag');
            }
            if (initialDistance !== null) {
                // 保存最終縮放比例
                const transformStyle = window.getComputedStyle(selfVideoWrapper).transform;
                if (transformStyle && transformStyle !== 'none') {
                     try {
                        const matrix = new DOMMatrix(transformStyle);
                        currentScale = matrix.m11; 
                     } catch (err) {
                         console.error("無法解析 transform 矩陣:", err);
                         currentScale = 1;
                     }
                } else {
                    currentScale = 1;
                }
                initialDistance = null;
                selfVideoWrapper.style.transition = 'box-shadow 0.3s ease, transform 0.1s ease'; 
                console.log(`[Mobile] TouchEnd Zoom: final currentScale=${currentScale}`);
            }
        });
        
        // 計算視覺邊界 (考慮 transform: scale)
        function calculateVisualBoundaries(element, scale) {
            const container = document.querySelector('.azar-video-container'); 
            if (!container) return { minTop: 0, maxTop: 0, minRight: 0, maxRight: 0 };
            
            const containerRect = container.getBoundingClientRect();
            const layoutWidth = element.offsetWidth;
            const layoutHeight = element.offsetHeight;
            
            // 計算縮放後的視覺尺寸
            const visualWidth = layoutWidth * scale;
            const visualHeight = layoutHeight * scale;

            // 限制拖曳邊界，確保視訊視窗不會完全移出容器
            const minTop = 0;
            const maxTop = containerRect.height - visualHeight * 0.3; // 允許部分移出底部
            const minRight = 0;
            const maxRight = containerRect.width - visualWidth * 0.3; // 允許部分移出左側

            return {
                minTop: Math.max(0, minTop),
                maxTop: Math.max(0, maxTop),
                minRight: Math.max(0, minRight),
                maxRight: Math.max(0, maxRight)
            };
        }
        
        // 添加滾輪縮放支持
        selfVideoWrapper.addEventListener('wheel', function(e) {
            e.preventDefault();
            
            // 獲取當前縮放比例
            const transformStyle = window.getComputedStyle(selfVideoWrapper).transform;
            if (transformStyle && transformStyle !== 'none') {
                try {
                    const matrix = new DOMMatrix(transformStyle);
                    currentScale = matrix.m11;
                } catch (err) {
                    currentScale = 1;
                }
            }
            
            // 根據滾輪方向調整縮放
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            let newScale = currentScale + delta;
            newScale = Math.max(0.5, Math.min(newScale, 3));
            
            // 應用新的縮放比例
            selfVideoWrapper.style.transform = `scale(${newScale})`;
            currentScale = newScale;
            
            console.log(`[Desktop] Wheel Zoom: scale=${currentScale}`);
        }, { passive: false });
    }
}); 
