import { useEffect, useState } from 'react';
import { fetchLeaderboard } from '../api/leaderboard';

type LeaderboardRecord = {
    name: string;
    score: number;
};

export default function Leaderboard() {
    const [list, setList] = useState<LeaderboardRecord[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchLeaderboard();
                setList(data);
            } catch (e) {
                console.error("Failed to fetch leaderboard", e);
            }
        };

        load();
        const t = setInterval(load, 3000);
        return () => clearInterval(t);
    }, []);

    return (
        <div style={{ color: '#e2e8f0', fontFamily: 'sans-serif' }}>
            {list.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#718096' }}>Loading rankings...</div>
            ) : (
                list.map((r, i) => (
                    <div key={i} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        padding: '8px 0', 
                        borderBottom: '1px solid #2d3748',
                        fontSize: '14px'
                    }}>
                        <span style={{ color: i < 3 ? '#f6ad55' : '#e2e8f0' }}>
                            {i + 1}. {r.name}
                        </span>
                        <b style={{ color: '#2496ed' }}>{r.score}</b>
                    </div>
                ))
            )}
        </div>
    );
}
