import { useEffect, useState } from 'react';
import { fetchLeaderboard } from '../api/leaderboard';
import styles from './Leaderboard.module.css';

type LeaderboardRecord = {
    name: string;
    score: number;
};

export default function Leaderboard() {
    const [list, setList] = useState<LeaderboardRecord[]>([]);

    useEffect(() => {
        const load = async () => {
            const data = await fetchLeaderboard();
            setList(data);
        };

        load();
        const t = setInterval(load, 3000);
        return () => clearInterval(t);
    }, []);

    return (
        <div className={styles.board}>
            <h3>🏆 排名</h3>
            {list.map((r, i) => (
                <div key={i} className={styles.row}>
                    <span>{i + 1}. {r.name}</span>
                    <b>{r.score}</b>
                </div>
            ))}
        </div>
    );
}
