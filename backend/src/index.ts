import express from 'express';
import leaderboard from './routes/leaderboard';

const app = express();

app.use(express.json());

app.use('/api/leaderboard', leaderboard);

app.listen(3000, () => {
    console.log('Leaderboard API running at http://localhost:3000');
});
