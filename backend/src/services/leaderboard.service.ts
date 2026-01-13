import { pool } from '../db/db';

export async function addRecord(name: string, score: number) {
    await pool.execute(
        `
            INSERT INTO leaderboard (name, score, is_pinned, created_at)
            VALUES (?, ?, 0, ?)
        `,
        [name, score, Date.now()]
    );
}

export async function getTop(limit = 10) {
    const safeLimit =
        Number.isInteger(limit) && limit > 0
            ? limit
            : 10;

    const [rows] = await pool.execute(
        `
        SELECT name, score
        FROM leaderboard
        ORDER BY
            is_pinned DESC,
            score DESC,
            created_at ASC
        LIMIT ${safeLimit}
        `
    );

    return rows;
}


