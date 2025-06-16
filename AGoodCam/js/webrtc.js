/**
 * AGoodCam WebRTC處理
 * 處理WebRTC連接和媒體流
 */

// WebRTC配置
const iceServers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' }
    ]
};

// 全局變量
let peerConnection = null;
let localStream = null;
let remoteStream = null;
let isConnected = false;
let isInitiator = false;
let socket = null;
let userId = null;
let peerUserId = null;
let isVideoEnabled = true;
let isAudioEnabled = true;
let isMirrored = true; // 預設鏡像
let currentCamera = 'user'; // 預設前置鏡頭
let isSearching = false; // 配對狀態
let reconnectAttempts = 0; // 重連嘗試次數
let reconnectTimeout = null; // 重連計時器
let newMessageCount = 0; // 新訊息計數
let roomId = null;
let isConnecting = false;
let isPairing = false;
let isFrontCamera = true; // 追蹤當前使用的是否為前鏡頭
let hasUserFoundMatch = false;

// 獲取DOM元素
const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const connectionStatus = document.getElementById('connection-status');
const waitingMessage = document.getElementById('waiting-message');
const pairingAnimation = document.querySelector('.pairing-animation');
const skipButton = document.getElementById('skip-btn');
const toggleVideoButton = document.getElementById('toggle-video-btn');
const toggleAudioButton = document.getElementById('toggle-audio-btn');
const endButton = document.getElementById('end-btn');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-btn');
const chatMessages = document.getElementById('chat-messages');
const flipCameraBtn = document.getElementById('flip-camera-btn');
const toggleMirrorBtn = document.getElementById('toggle-mirror-btn');
const chatBubble = document.getElementById('chat-bubble');
const chatNotification = document.querySelector('.chat-notification');
const textChat = document.querySelector('.text-chat');
const chatHeaderBar = document.getElementById('chat-header-bar');
const chatToggleBtn = document.getElementById('chat-toggle-btn');

// 從隱藏輸入獲取用戶ID
userId = document.getElementById('user-id').value;

// 初始化
function initialize() {
    console.log('初始化 WebRTC');
    setupChatInterface();
    connectSignalingServer();
    getLocalMedia();
    setupEventListeners();
}

// 設置聊天界面
function setupChatInterface() {
    // 聊天視窗切換
    chatBubble.addEventListener('click', toggleChatWindow);
    chatHeaderBar.addEventListener('click', toggleChatWindow);
    
    // 初始隱藏聊天視窗
    textChat.classList.remove('expanded');
}

// 切換聊天視窗
function toggleChatWindow() {
    const isExpanded = textChat.classList.toggle('expanded');
    
    // 更新切換按鈕圖標
    chatToggleBtn.innerHTML = isExpanded 
        ? '<i class="fas fa-chevron-down"></i>' 
        : '<i class="fas fa-chevron-up"></i>';
    
    // 顯示/隱藏聊天泡泡
    chatBubble.classList.toggle('hidden', isExpanded);
    
    // 重置新訊息通知
    if (isExpanded) {
        newMessageCount = 0;
        updateMessageNotification();
        
        // 聚焦輸入框
        if (!messageInput.disabled) {
            messageInput.focus();
        }
        
        // 確保聊天訊息區域滾動到底部
        if (chatMessages && chatMessages.scrollHeight > 0) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
}

// 連接到信令服務器
function connectSignalingServer() {
    const serverUrl = 'https://您的信令伺服器網址';
    
    // 重置重連嘗試
    reconnectAttempts = 0;
    
    // 連接信令服務器
    socket = io(serverUrl, {
        query: { userId: userId },
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
    });

    // 設置信令伺服器事件處理
    setupSignaling();

    updateStatus('正在連接到服務器...');
}

// 設置信令伺服器事件處理
function setupSignaling() {
    console.log('設定信號服務器連接');
    // 連接成功
    socket.on('connect', () => {
        console.log('已連接到信令伺服器');
        reconnectAttempts = 0;
        
        updateStatus('已連接到服務器，請求配對中...');
        
        // 清除之前的重連計時器
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }
        
        // 請求新的配對
        startPairing();
    });

    // 接收到配對請求
    socket.on('paired', (data) => {
        console.log('已配對', data);
        peerUserId = data.peerId;
        isInitiator = data.initiator;
        isSearching = false;
        
        // 隱藏配對動畫
        if (pairingAnimation) pairingAnimation.style.display = 'none';
        
        updateStatus('已找到聊天對象，建立連接中...');
        
        // 啟用聊天輸入
        enableChatInput();
        
        // 如果是發起方，創建提議
        if (isInitiator) {
            createPeerConnection();
            createOffer();
        } else {
            createPeerConnection();
        }
        
        // 如果聊天窗口沒有顯示，顯示通知
        if (!textChat.classList.contains('expanded')) {
            addMessageToChat('系統：已連接到新的聊天對象', false, true);
        }
    });

    // 接收到提議
    socket.on('offer', async (description) => {
        console.log('收到提議');
        if (!peerConnection) {
            createPeerConnection();
        }
        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(description));
            console.log('設置遠端描述');
            updateStatus('收到對方連接，準備回應...');
            await createAnswer();
        } catch (error) {
            console.error('設置提議出錯', error);
            updateStatus('連接錯誤，嘗試重新配對');
            handlePeerConnectionError();
        }
    });

    // 接收到回應
    socket.on('answer', async (description) => {
        console.log('收到回應');
        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(description));
            console.log('設置遠端描述');
            updateStatus('連接已建立');
        } catch (error) {
            console.error('設置回應出錯', error);
            updateStatus('連接錯誤，嘗試重新配對');
            handlePeerConnectionError();
        }
    });

    // 接收到ICE候選
    socket.on('ice-candidate', async (candidate) => {
        console.log('收到ICE候選');
        try {
            if (peerConnection) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                console.log('新增ICE候選');
            }
        } catch (error) {
            console.error('新增ICE候選出錯', error);
        }
    });

    // 對方中斷連接
    socket.on('peer-disconnected', () => {
        console.log('對方已中斷連接');
        updateStatus('對方已離開，重新尋找聊天對象...');
        
        // 添加系統消息
        addMessageToChat('系統：對方已離開聊天', false, true);
        
        // 關閉舊連接並開始新的配對
        cleanupAndRestartPairing();
    });

    // 接收到聊天訊息
    socket.on('chat-message', (message) => {
        console.log('收到訊息', message);
        
        // 添加到聊天視窗
        addMessageToChat(message, false);
        
        // 如果聊天視窗未打開，顯示通知
        if (!textChat.classList.contains('expanded')) {
            newMessageCount++;
            updateMessageNotification();
        }
    });

    // 遇到錯誤
    socket.on('error', (error) => {
        console.error('信令伺服器錯誤', error);
        updateStatus('發生錯誤: ' + error.message);
    });

    // 連接中斷
    socket.on('disconnect', () => {
        console.log('與信令伺服器的連接已中斷');
        updateStatus('與服務器連接已中斷，嘗試重新連接...');
        closePeerConnection();
        
        // 嘗試重新連接
        scheduleReconnect();
    });
    
    // 重新連接錯誤
    socket.on('reconnect_error', (error) => {
        console.error('重新連接錯誤', error);
        reconnectAttempts++;
        
        if (reconnectAttempts >= 5) {
            updateStatus('重新連接失敗，請刷新頁面重試');
        } else {
            updateStatus(`重新連接失敗，${5 - reconnectAttempts}次嘗試後將提示刷新`);
        }
    });
    
    // 重新連接成功
    socket.on('reconnect', (attemptNumber) => {
        console.log(`重新連接成功，嘗試次數: ${attemptNumber}`);
        updateStatus('重新連接成功，請求配對中...');
        startPairing();
    });
}

// 更新訊息通知
function updateMessageNotification() {
    if (newMessageCount > 0) {
        chatNotification.textContent = newMessageCount;
        chatNotification.style.display = 'flex';
    } else {
        chatNotification.style.display = 'none';
    }
}

// 開始配對流程
function startPairing() {
    if (isSearching) return;
    
    isSearching = true;
    
    // 顯示配對動畫
    if (pairingAnimation) {
        pairingAnimation.style.display = 'flex';
        // 確保文字是 "尋找聊天對象中..."
        const searchingText = pairingAnimation.querySelector('.searching-text');
        if (searchingText) searchingText.textContent = '尋找聊天對象中...';
    }
    waitingMessage.style.display = 'none';
    
    // 更新狀態顯示為配對中
    updateStatus('尋找聊天對象中...');
    
    // 清除聊天消息並禁用輸入
    disableChatInput();
    clearChatMessages();
    
    // 向服務器請求配對
    socket.emit('ready');
}

// 處理配對錯誤並重試
function handlePeerConnectionError() {
    // 如果連接過程中出錯，清理並重新開始
    closePeerConnection();
    disableChatInput();
    
    // 延遲一秒後重新配對
    setTimeout(() => {
        startPairing();
    }, 1000);
}

// 排程重新連接
function scheduleReconnect() {
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
    }
    
    reconnectTimeout = setTimeout(() => {
        if (!socket.connected) {
            // 如果超過嘗試次數限制，顯示刷新提示
            if (reconnectAttempts >= 5) {
                updateStatus('無法連接到服務器，請刷新頁面重試');
                return;
            }
            
            reconnectAttempts++;
            updateStatus(`嘗試重新連接 (${reconnectAttempts}/5)...`);
            
            // 嘗試重新連接
            socket.connect();
            
            // 設置下一次重連
            scheduleReconnect();
        }
    }, 3000);
}

// 獲取本地媒體流
async function getLocalMedia() {
    // 檢查並清除現有流
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }

    // 設置媒體限制 - 優先使用前置鏡頭或後置鏡頭
    const constraints = {
        audio: true,
        video: {
            facingMode: currentCamera,
            width: { ideal: 1280 },
            height: { ideal: 720 }
        }
    };

    try {
        console.log(`正在獲取本地媒體流，相機模式: ${currentCamera}`);
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // 更新前鏡頭追蹤狀態
        isFrontCamera = currentCamera === 'user';
        
        // 更新視訊元素
        if (localVideo) {
        localVideo.srcObject = localStream;
            
            // 前鏡頭已經在CSS中設置了永久鏡像效果
            // 無需在JavaScript中設置transform
        }
        
        updateStatus('已獲取鏡頭和麥克風權限');
        
        // 如果已經有peer連接，更新軌道
        if (peerConnection) {
            updatePeerConnectionTracks();
        }
        
    } catch (error) {
        console.error('獲取本地媒體流時出錯:', error);
        handleMediaError(error);
    }
}

// 處理媒體錯誤
function handleMediaError(error) {
    let errorMessage = "無法訪問鏡頭或麥克風";
    
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = "未檢測到鏡頭或麥克風設備";
    } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = "請允許訪問鏡頭和麥克風";
    } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        errorMessage = "無法滿足指定的媒體需求，嘗試使用其他相機模式";
        // 嘗試切換相機
        currentCamera = currentCamera === 'user' ? 'environment' : 'user';
        getLocalMedia();
        return;
    }
    
    // 顯示錯誤消息
    alert(errorMessage);
    
    // 顯示系統消息
    addMessage('系統', errorMessage, 'system-message');
}

// 翻轉相機（切換前後鏡頭）
function flipCamera() {
    console.log('[DEBUG] flipCamera 函數被調用');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('您的瀏覽器不支持多鏡頭功能');
        addMessage('系統', '您的瀏覽器不支持多鏡頭功能', 'system-message');
        return;
    }
    
    // 切換相機模式
    currentCamera = currentCamera === 'user' ? 'environment' : 'user';
    console.log(`[DEBUG] 切換相機到: ${currentCamera}`);
    
    // 重新獲取媒體流
    getLocalMedia();
}

// 更新對等連接中的媒體軌道
function updatePeerConnectionTracks() {
    if (!peerConnection) return;
    
    // 獲取所有發送器
    const senders = peerConnection.getSenders();
    
    // 更新音頻和視訊軌道
    localStream.getTracks().forEach(track => {
        const sender = senders.find(s => s.track && s.track.kind === track.kind);
        if (sender) {
            sender.replaceTrack(track);
        } else {
            peerConnection.addTrack(track, localStream);
        }
    });
}

// 處理斷線重連
function handleReconnection() {
    // 根據當前狀態決定是重新配對還是重新建立連接
    if (isPairing) {
        // 如果之前正在配對，重新開始配對過程
        findNewPartner();
    } else if (isConnecting && roomId) {
        // 如果之前在連接中，嘗試重新加入房間
        joinRoom(roomId);
    }
}

// 創建對等連接
function createPeerConnection() {
    try {
        peerConnection = new RTCPeerConnection(iceServers);
        console.log('創建RTCPeerConnection');
        
        // 添加本地媒體流到連接
        if (localStream) {
            localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStream);
            });
        }
        
        // 處理ICE候選
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('發送ICE候選');
                socket.emit('ice-candidate', {
                    candidate: event.candidate,
                    to: peerUserId
                });
            }
        };
        
        // 處理ICE連接狀態變化
        peerConnection.oniceconnectionstatechange = () => {
            console.log('ICE連接狀態:', peerConnection.iceConnectionState);
            
            if (peerConnection.iceConnectionState === 'failed' || 
                peerConnection.iceConnectionState === 'disconnected') {
                console.log('ICE連接失敗或斷開');
                handlePeerConnectionError();
            }
        };
        
        // 處理連接狀態變化
        peerConnection.onconnectionstatechange = () => {
            console.log('連接狀態變化:', peerConnection.connectionState);
            const onlineStatusEl = document.querySelector('.online-status');
            
            switch (peerConnection.connectionState) {
                case 'connected':
                    updateStatus('已連接到對方');
                    isConnected = true;
                    hasUserFoundMatch = true;
                    
                    // 添加連接狀態類，使狀態點變為綠色
                    if (onlineStatusEl) {
                        onlineStatusEl.classList.add('connected');
                    }
                    
                    // 隱藏配對動畫（如果存在）
                    if (pairingAnimation) {
                        pairingAnimation.style.display = 'none';
                    }
                    break;
                case 'disconnected':
                case 'failed':
                    updateStatus('連接中斷，嘗試重新配對');
                    isConnected = false;
                    
                    // 移除連接狀態類，使狀態點變回灰色
                    if (onlineStatusEl) {
                        onlineStatusEl.classList.remove('connected');
                    }
                    
                    handlePeerConnectionError();
                    break;
                case 'closed':
                    updateStatus('連接已關閉');
                    isConnected = false;
                    
                    // 移除連接狀態類，使狀態點變回灰色
                    if (onlineStatusEl) {
                        onlineStatusEl.classList.remove('connected');
                    }
                    
                    break;
            }
        };
        
        // 接收遠端流
        peerConnection.ontrack = (event) => {
            console.log('收到遠端流');
            if (event.streams && event.streams[0]) {
                remoteVideo.srcObject = event.streams[0];
                remoteStream = event.streams[0];
                
                // 隱藏等待元素和配對動畫
                waitingMessage.style.display = 'none';
                if (pairingAnimation) pairingAnimation.style.display = 'none';
            }
        };
        
    } catch (error) {
        console.error('創建PeerConnection出錯', error);
        updateStatus('建立連接時出錯，嘗試重新配對');
        handlePeerConnectionError();
    }
}

// 創建提議
async function createOffer() {
    try {
        const offer = await peerConnection.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
        });
        
        await peerConnection.setLocalDescription(offer);
        console.log('創建提議');
        updateStatus('向對方發送連接請求...');
        
        // 發送提議給對方
        socket.emit('offer', {
            offer: peerConnection.localDescription,
            to: peerUserId
        });
    } catch (error) {
        console.error('創建提議出錯', error);
        updateStatus('建立連接請求時出錯，嘗試重新配對');
        handlePeerConnectionError();
    }
}

// 創建回應
async function createAnswer() {
    try {
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        console.log('創建回應');
        updateStatus('向對方發送連接回應...');
        
        // 發送回應給對方
        socket.emit('answer', {
            answer: peerConnection.localDescription,
            to: peerUserId
        });
    } catch (error) {
        console.error('創建回應出錯', error);
        updateStatus('回應連接請求時出錯，嘗試重新配對');
        handlePeerConnectionError();
    }
}

// 斷開連接並尋找新對象
function skipPeer() {
    console.log('跳過當前對象');
    updateStatus('正在尋找新的聊天對象...');
    
    // 通知服務器和對方
    if (peerUserId) {
        socket.emit('leave', { to: peerUserId });
        
        // 添加系統訊息
        addMessageToChat('系統：您已跳過當前對話', false, true);
    }
    
    // 清理並重新配對
    cleanupAndRestartPairing();
}

// 清理現有連接並重新配對
function cleanupAndRestartPairing() {
    // 關閉現有連接
    closePeerConnection();
    disableChatInput();
    
    // 延遲一秒後開始新的配對
    setTimeout(() => {
        clearChatMessages();
        startPairing();
    }, 1000);
}

// 清除聊天訊息
function clearChatMessages() {
    const messagesArea = document.querySelector('.messages-area');
    if (messagesArea) {
        messagesArea.innerHTML = '';
    }
}

// 啟用聊天輸入
function enableChatInput() {
    messageInput.disabled = false;
    sendButton.disabled = false;
}

// 禁用聊天輸入
function disableChatInput() {
    messageInput.disabled = true;
    sendButton.disabled = true;
}

// 發送聊天訊息
function sendMessage() {
    const message = messageInput.value.trim();
    if (message && peerUserId && isConnected) {
        console.log('發送訊息', message);
        
        // 發送訊息到伺服器並中繼給對方
        socket.emit('chat-message', {
            message: message,
            to: peerUserId
        });
        
        // 將訊息添加到聊天窗口
        addMessageToChat(message, true);
        
        // 清空輸入框
        messageInput.value = '';
    }
}

// 添加訊息到聊天窗口
function addMessageToChat(message, isFromMe, isSystem = false) {
    const messageElement = document.createElement('div');
    
    if (isSystem) {
        // 系統消息樣式
        messageElement.className = 'message system-message';
    } else {
    messageElement.className = `message ${isFromMe ? 'my-message' : 'other-message'}`;
    }
    
    messageElement.textContent = message;
    
    // 添加時間戳
    const timestamp = document.createElement('div');
    timestamp.className = 'timestamp';
    const now = new Date();
    timestamp.textContent = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    messageElement.appendChild(timestamp);
    
    chatMessages.appendChild(messageElement);
    
    // 滾動到最新訊息
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 更新狀態顯示
function updateStatus(status) {
    connectionStatus.textContent = status;
    console.log('狀態更新:', status);
}

// 創建房間
async function createRoom() {
    console.log('創建新房間');
    
    if (!peerConnection) {
        initiatePeerConnection();
    }
    
    try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        console.log('創建了offer，等待answer');
        // 將offer發送到信號服務器
        // const roomWithOffer = await signallingServer.createRoom(offer);
        // roomId = roomWithOffer.id;
        
        // 模擬生成房間ID
        roomId = generateRandomRoomId();
        console.log('已創建房間:', roomId);
        
    } catch (error) {
        console.error('創建房間時出錯:', error);
    }
}

// 加入房間
async function joinRoom(roomIdToJoin) {
    console.log('嘗試加入房間:', roomIdToJoin);
    isConnecting = true;
    
    if (!peerConnection) {
        initiatePeerConnection();
    }
    
    try {
        // 從信號服務器獲取房間信息
        // const roomWithOffer = await signallingServer.joinRoom(roomIdToJoin);
        // const offer = roomWithOffer.offer;
        
        // 模擬接收offer
        const mockOffer = createMockOffer();
        
        await peerConnection.setRemoteDescription(mockOffer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        console.log('已創建answer，發送給對方');
        // 將answer發送回信號服務器
        // await signallingServer.sendAnswer(roomIdToJoin, answer);
        
        roomId = roomIdToJoin;
        
    } catch (error) {
        console.error('加入房間時出錯:', error);
        isConnecting = false;
    }
}

// 尋找新聊天匹配對象
function findNewPartner() {
    console.log('尋找新的聊天匹配對象');
    isPairing = true;
    hasUserFoundMatch = false;
    
    // 顯示配對動畫
    const pairingAnimation = document.querySelector('.pairing-animation');
    if (pairingAnimation) {
        pairingAnimation.style.display = 'flex';
    }
    
    // 隱藏遠程用戶信息
    const peerInfo = document.querySelector('.peer-info');
    if (peerInfo) {
        peerInfo.style.display = 'none';
    }
    
    // 清除遠程視訊
    const remoteVideo = document.getElementById('remote-video');
    if (remoteVideo && remoteVideo.srcObject) {
        remoteVideo.srcObject = null;
    }
    
    // 連接到配對服務
    // 模擬配對延遲
    setTimeout(() => {
        // 配對完成
        isPairing = false;
        
        // 創建新房間或加入現有房間
        if (Math.random() > 0.5) {
            createRoom();
        } else {
            const mockRoomId = generateRandomRoomId();
            joinRoom(mockRoomId);
        }
        
        // 隱藏配對動畫
        if (pairingAnimation) {
            pairingAnimation.style.display = 'none';
        }
        
        // 顯示等待連接訊息
        const waitingMessage = document.getElementById('waiting-message');
        if (waitingMessage) {
            waitingMessage.style.display = 'flex';
            waitingMessage.querySelector('p').textContent = '已找到匹配對象，正在建立連接...';
        }
    }, 2000);
}

// 關閉對等連接
function closePeerConnection() {
    if (peerConnection) {
        console.log('關閉現有對等連接');
        peerConnection.close();
        peerConnection = null;
    }
    
    // 清除遠程視訊
    const remoteVideo = document.getElementById('remote-video');
    if (remoteVideo && remoteVideo.srcObject) {
        remoteVideo.srcObject = null;
    }
    
    // 重置狀態
    roomId = null;
    isConnecting = false;
    hasUserFoundMatch = false;
}

// 結束通話
function endCall() {
    console.log('結束通話');
    
    // 通知服務器和對方
    if (peerUserId) {
        socket.emit('leave', { to: peerUserId });
    }
    
    // 關閉連接
    closePeerConnection();
    
    // 停止所有媒體流
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    
    // 斷開信令服務器連接
    if (socket) {
        socket.disconnect();
    }
    
    // 重定向到首頁
    window.location.href = '/';
}

// 添加消息到聊天
function addMessage(sender, content, className = '') {
    // 添加消息到聊天界面
    console.log(`${sender}: ${content}`);
    
    // 檢查消息容器是否存在
    const messagesArea = document.querySelector('.messages-area');
    if (!messagesArea) return;
    
    // 創建消息元素
    const messageElement = document.createElement('div');
    messageElement.className = `message ${className || (sender === '我' ? 'my-message' : 'other-message')}`;
    
    // 添加消息內容
    messageElement.innerHTML = `
        ${className !== 'system-message' ? `<strong>${sender}:</strong> ` : ''}
        ${content}
        <div class="timestamp">${new Date().toLocaleTimeString()}</div>
    `;
    
    // 添加到消息區域
    messagesArea.appendChild(messageElement);
    
    // 滾動到底部
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

// 發送文本消息
function sendTextMessage(text) {
    if (!text.trim() || !peerConnection || peerConnection.connectionState !== 'connected') return;
    
    console.log('發送文本消息:', text);
    
    // 添加消息到本地聊天界面
    addMessage('我', text, 'my-message');
}

// 切換視訊
function toggleVideo() {
    if (localStream) {
        const videoTracks = localStream.getVideoTracks();
        if (videoTracks.length > 0) {
            isVideoEnabled = !isVideoEnabled;
            videoTracks[0].enabled = isVideoEnabled;
            
            // 更新按鈕圖標
            toggleVideoButton.innerHTML = isVideoEnabled 
                ? '<i class="fas fa-video"></i>' 
                : '<i class="fas fa-video-slash"></i>';
                
            console.log('視訊' + (isVideoEnabled ? '開啟' : '關閉'));
        }
    }
}

// 切換音頻
function toggleAudio() {
    if (!localStream) return;
    
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        console.log(`音頻已${audioTrack.enabled ? '開啟' : '關閉'}`);
        
        // 更新按鈕狀態
        const toggleAudioBtn = document.getElementById('toggle-audio-btn');
        if (toggleAudioBtn) {
            toggleAudioBtn.innerHTML = audioTrack.enabled ? 
                '<i class="fas fa-microphone"></i>' : 
                '<i class="fas fa-microphone-slash"></i>';
            toggleAudioBtn.title = audioTrack.enabled ? '關閉麥克風' : '開啟麥克風';
        }
    }
}

// 模擬生成隨機房間ID
function generateRandomRoomId() {
    return Math.random().toString(36).substring(2, 9);
}

// 創建模擬Offer
function createMockOffer() {
    return {
        type: 'offer',
        sdp: 'v=0\r\no=- 5498186869896684180 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=msid-semantic: WMS\r\n'
    };
}

// 設置事件監聽
function setupEventListeners() {
    // 跳過按鈕
    skipButton.addEventListener('click', skipPeer);
    
    // 視訊切換按鈕
    toggleVideoButton.addEventListener('click', toggleVideo);
    
    // 音訊切換按鈕
    toggleAudioButton.addEventListener('click', toggleAudio);
    
    // 結束按鈕
    endButton.addEventListener('click', endCall);
    
    // 發送按鈕
    sendButton.addEventListener('click', sendMessage);
    
    // 翻轉鏡頭按鈕
    if (flipCameraBtn) {
        console.log('[DEBUG] 添加 flipCameraBtn 事件監聽器');
        flipCameraBtn.addEventListener('click', flipCamera);
    } else {
        console.warn('[DEBUG] 未找到 flipCameraBtn 元素');
    }
    
    // 輸入框回車發送
    messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });
    
    // 頁面關閉時清理
    window.addEventListener('beforeunload', () => {
        // 通知對方
        if (peerUserId) {
            socket.emit('leave', { to: peerUserId });
        }
        
        // 關閉連接
        closePeerConnection();
        
        // 停止媒體流
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
    });
}

// 導出函數供其他模塊使用
window.webrtcHandler = {
    initialize,
    getLocalMedia,
    flipCamera,
    findNewPartner,
    endCall,
    sendTextMessage,
    toggleVideo,
    toggleAudio
};

// 初始化
document.addEventListener('DOMContentLoaded', initialize); 