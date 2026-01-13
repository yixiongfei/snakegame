import express from 'express';
import leaderboard from './routes/leaderboard';

const app = express();
const DEFAULT_PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api/leaderboard', leaderboard);

const server = app.listen(DEFAULT_PORT, () => {
    console.log(`Leaderboard API running at http://localhost:${DEFAULT_PORT}`);
});

// 错误处理：如果端口被占用，尝试使用其他端口或给出清晰提示
server.on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`Error: Port ${DEFAULT_PORT} is already in use.`);
        console.log('Please try setting a different port using the PORT environment variable.');
        console.log('Example: set PORT=3005 && npm start (Windows) or PORT=3005 npm start (Linux/Mac)');
        process.exit(1);
    } else {
        console.error(e);
    }
});
