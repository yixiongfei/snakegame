export async function fetchLeaderboard() {
    const res = await fetch('/api/leaderboard');
    return res.json();
}

export async function submitScore(name: string, score: number) {
    await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, score }),
    });
}
