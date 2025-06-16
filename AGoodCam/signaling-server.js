/**
 * AGoodCam 信令伺服器
 * 使用Node.js和Socket.IO實現
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const cors = require('cors');

// 配置
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// 創建Express應用
const app = express();
app.use(cors({ origin: CORS_ORIGIN }));

// 創建HTTP服務器
const server = http.createServer(app);

// 配置Socket.IO
const io = socketIO(server, {
    cors: {
        origin: CORS_ORIGIN,
        methods: ['GET', 'POST']
    }
});

// 服務器狀態頁面
app.get('/status', (req, res) => {
    res.sendFile(path.join(__dirname, 'signaling-status.html'));
});

// 根路徑下返回首頁
app.get('/', (req, res) => {
    res.redirect('/index.php');
});

// 用戶管理
const connectedUsers = new Map(); // 儲存連接的用戶: socketId => { userId, status, peerId }
const waitingUsers = new Set();   // 等待配對的用戶: socketId

// 生成隨機ID
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// 用戶配對
function pairUsers() {
    if (waitingUsers.size < 2) return;
    
    const waitingArray = Array.from(waitingUsers);
    
    // 隨機選擇兩個用戶進行配對
    const user1Index = Math.floor(Math.random() * waitingArray.length);
    let user2Index;
    do {
        user2Index = Math.floor(Math.random() * waitingArray.length);
    } while (user1Index === user2Index);
    
    const socketId1 = waitingArray[user1Index];
    const socketId2 = waitingArray[user2Index];
    
    // 從等待列表移除
    waitingUsers.delete(socketId1);
    waitingUsers.delete(socketId2);
    
    // 更新用戶狀態
    const user1 = connectedUsers.get(socketId1);
    const user2 = connectedUsers.get(socketId2);
    
    if (!user1 || !user2) return;
    
    user1.status = 'paired';
    user1.peerId = socketId2;
    
    user2.status = 'paired';
    user2.peerId = socketId1;
    
    // 通知兩用戶已配對
    io.to(socketId1).emit('paired', {
        peerId: socketId2,
        initiator: true
    });
    
    io.to(socketId2).emit('paired', {
        peerId: socketId1,
        initiator: false
    });
    
    console.log(`配對用戶: ${user1.userId} <-> ${user2.userId}`);
}

// 統計信息
let totalConnections = 0;
let totalPairings = 0;
let peakConcurrentUsers = 0;

// Socket.IO連接處理
io.on('connection', (socket) => {
    // 從查詢參數獲取用戶ID
    const userId = socket.handshake.query.userId || generateId();
    totalConnections++;
    
    // 儲存用戶信息
    connectedUsers.set(socket.id, {
        userId,
        status: 'connected',
        peerId: null,
        connectedAt: new Date()
    });
    
    console.log(`用戶連接: ${userId} (${socket.id})`);
    
    // 更新統計信息
    const currentUsers = connectedUsers.size;
    if (currentUsers > peakConcurrentUsers) {
        peakConcurrentUsers = currentUsers;
    }
    
    // 廣播更新的統計信息
    io.emit('stats', {
        totalConnections,
        currentUsers,
        totalPairings,
        peakConcurrentUsers,
        waitingUsers: waitingUsers.size
    });
    
    // 用戶準備配對
    socket.on('ready', () => {
        const user = connectedUsers.get(socket.id);
        if (!user) return;
        
        // 如果用戶已經在配對中，先斷開舊的配對
        if (user.status === 'paired' && user.peerId) {
            const peerSocket = io.sockets.sockets.get(user.peerId);
            if (peerSocket) {
                peerSocket.emit('peer-disconnected');
                
                const peer = connectedUsers.get(user.peerId);
                if (peer) {
                    peer.status = 'connected';
                    peer.peerId = null;
                }
            }
        }
        
        // 更新用戶狀態為等待
        user.status = 'waiting';
        user.peerId = null;
        
        // 添加到等待列表
        waitingUsers.add(socket.id);
        
        console.log(`用戶等待配對: ${userId} (${socket.id})`);
        
        // 嘗試配對用戶
        pairUsers();
    });
    
    // 轉發提議
    socket.on('offer', (data) => {
        if (!data || !data.to || !data.offer) return;
        
        const user = connectedUsers.get(socket.id);
        const peer = connectedUsers.get(data.to);
        
        if (!user || !peer || peer.peerId !== socket.id) return;
        
        console.log(`轉發提議: ${user.userId} -> ${peer.userId}`);
        io.to(data.to).emit('offer', data.offer);
    });
    
    // 轉發回應
    socket.on('answer', (data) => {
        if (!data || !data.to || !data.answer) return;
        
        const user = connectedUsers.get(socket.id);
        const peer = connectedUsers.get(data.to);
        
        if (!user || !peer || peer.peerId !== socket.id) return;
        
        console.log(`轉發回應: ${user.userId} -> ${peer.userId}`);
        io.to(data.to).emit('answer', data.answer);
    });
    
    // 轉發ICE候選
    socket.on('ice-candidate', (data) => {
        if (!data || !data.to || !data.candidate) return;
        
        const user = connectedUsers.get(socket.id);
        const peer = connectedUsers.get(data.to);
        
        if (!user || !peer || peer.peerId !== socket.id) return;
        
        io.to(data.to).emit('ice-candidate', data.candidate);
    });
    
    // 轉發聊天訊息
    socket.on('chat-message', (data) => {
        if (!data || !data.to || !data.message) return;
        
        const user = connectedUsers.get(socket.id);
        const peer = connectedUsers.get(data.to);
        
        if (!user || !peer || peer.peerId !== socket.id) return;
        
        io.to(data.to).emit('chat-message', data.message);
    });
    
    // 用戶離開當前配對
    socket.on('leave', (data) => {
        if (!data || !data.to) return;
        
        const user = connectedUsers.get(socket.id);
        const peer = connectedUsers.get(data.to);
        
        if (!user || !peer || peer.peerId !== socket.id) return;
        
        console.log(`用戶離開配對: ${user.userId} -> ${peer.userId}`);
        
        // 通知對方
        io.to(data.to).emit('peer-disconnected');
        
        // 更新兩個用戶的狀態
        user.status = 'connected';
        user.peerId = null;
        
        peer.status = 'connected';
        peer.peerId = null;
    });
    
    // 用戶斷開連接
    socket.on('disconnect', () => {
        const user = connectedUsers.get(socket.id);
        if (!user) return;
        
        console.log(`用戶斷開連接: ${user.userId} (${socket.id})`);
        
        // 如果用戶在配對中，通知對方
        if (user.status === 'paired' && user.peerId) {
            io.to(user.peerId).emit('peer-disconnected');
            
            const peer = connectedUsers.get(user.peerId);
            if (peer) {
                peer.status = 'connected';
                peer.peerId = null;
            }
        }
        
        // 從等待列表移除
        waitingUsers.delete(socket.id);
        
        // 從連接用戶列表移除
        connectedUsers.delete(socket.id);
        
        // 廣播更新的統計信息
        io.emit('stats', {
            totalConnections,
            currentUsers: connectedUsers.size,
            totalPairings,
            peakConcurrentUsers,
            waitingUsers: waitingUsers.size
        });
    });
});

// 啟動服務器
server.listen(PORT, () => {
    console.log(`AGoodCam信令伺服器運行於端口 ${PORT}`);
}); 