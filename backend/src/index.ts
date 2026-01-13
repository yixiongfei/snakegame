import express from 'express';
import leaderboard from './routes/leaderboard';

const app = express();
const DEFAULT_PORT = process.env.PORT || 3000;

app.use(express.json());

// 模拟在线人数统计
// 在实际生产环境中，通常使用 WebSocket 或 Redis 统计
// 这里使用一个简单的内存计数器模拟
let onlineCount = Math.floor(Math.random() * 10) + 5; // 初始随机人数
setInterval(() => {
    // 模拟人数波动
    const change = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
    onlineCount = Math.max(1, onlineCount + change);
}, 10000);

app.get('/api/online-count', (req, res) => {
    res.json({ count: onlineCount });
});

app.use('/api/leaderboard', leaderboard);

const server = app.listen(DEFAULT_PORT, () => {
    console.log(`Leaderboard API running at http://localhost:${DEFAULT_PORT}`);
});

// 错误处理
server.on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`Error: Port ${DEFAULT_PORT} is already in use.`);
        console.log('Please try setting a different port using the PORT environment variable.');
        process.exit(1);
    } else {
        console.error(e);
    }
});
