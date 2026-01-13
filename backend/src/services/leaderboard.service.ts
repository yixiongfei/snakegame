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

    // 修改 SQL 逻辑：按名字分组，取每组最高分，然后排序
    const [rows] = await pool.execute(
        `
        SELECT name, MAX(score) as score
        FROM leaderboard
        GROUP BY name
        ORDER BY
            MAX(score) DESC
        LIMIT ${safeLimit}
        `
    );

    return rows;
}
