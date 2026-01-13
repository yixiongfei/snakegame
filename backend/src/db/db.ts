import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '200106',
    database: 'games',
    waitForConnections: true,
    connectionLimit: 10,
});
