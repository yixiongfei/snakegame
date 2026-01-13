import { Router } from 'express';
import { addRecord, getTop } from '../services/leaderboard.service';
import { isValidRecord } from '../utils/validate';

const router = Router();

/* 获取排行榜 */
router.get('/', async (req, res) => {
    try {
        const limit = Number(req.query.limit ?? 10);
        const list = await getTop(limit);
        res.json(list);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch leaderboard' });
    }
});

/* 提交分数 */
router.post('/', async (req, res) => {
    try {
        const { name, score } = req.body;

        if (!isValidRecord(name, score)) {
            return res.status(400).json({ message: 'Invalid payload' });
        }

        await addRecord(name, score);
        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to submit score' });
    }
});

export default router;
