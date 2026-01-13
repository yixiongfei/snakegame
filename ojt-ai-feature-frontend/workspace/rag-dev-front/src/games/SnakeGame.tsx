import { useEffect, useRef, useState } from 'react';
import styles from './SnakeGame.module.css';
import { submitScore } from '../api/leaderboard';

const SIZE = 20;
const WIDTH = 400;
const HEIGHT = 400;
const COLS = WIDTH / SIZE;
const ROWS = HEIGHT / SIZE;

type Point = { x: number; y: number };

const OPPOSITE = (a: Point, b: Point) =>
    a.x + b.x === 0 && a.y + b.y === 0;

/* ===== 渲染工具 ===== */
function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

function lerpColor(
    c1: [number, number, number],
    c2: [number, number, number],
    t: number
) {
    return `rgb(
        ${Math.round(lerp(c1[0], c2[0], t))},
        ${Math.round(lerp(c1[1], c2[1], t))},
        ${Math.round(lerp(c1[2], c2[2], t))}
    )`;
}

function drawRoundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
}

export default function SnakeGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);

    const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
    const [food, setFood] = useState<Point>({ x: 5, y: 5 });
    const [running, setRunning] = useState(false);
    const [score, setScore] = useState(0);

    // ✅ 玩家名
    const [playerName, setPlayerName] = useState('Player');

    const dirRef = useRef<Point>({ x: 1, y: 0 });
    const dirQueue = useRef<Point[]>([]);
    const hasSubmittedRef = useRef(false);

    /* ===== 键盘输入 ===== */
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (!running) return;

            const map: Record<string, Point> = {
                ArrowUp: { x: 0, y: -1 },
                ArrowDown: { x: 0, y: 1 },
                ArrowLeft: { x: -1, y: 0 },
                ArrowRight: { x: 1, y: 0 },
            };

            const next = map[e.key];
            if (!next) return;

            const last = dirQueue.current.at(-1) ?? dirRef.current;
            if (OPPOSITE(last, next)) return;

            dirQueue.current.push(next);
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [running]);

    /* ===== 游戏循环 ===== */
    useEffect(() => {
        if (!running) return;

        const timer = setInterval(() => {
            if (dirQueue.current.length) {
                dirRef.current = dirQueue.current.shift()!;
            }

            setSnake(prev => {
                const head = {
                    x: prev[0].x + dirRef.current.x,
                    y: prev[0].y + dirRef.current.y,
                };

                // Game Over：撞墙
                if (
                    head.x < 0 ||
                    head.y < 0 ||
                    head.x >= COLS ||
                    head.y >= ROWS
                ) {
                    setRunning(false);
                    return prev;
                }

                const next = [head, ...prev];

                if (head.x === food.x && head.y === food.y) {
                    setScore(s => s + 1);
                    setFood({
                        x: Math.floor(Math.random() * COLS),
                        y: Math.floor(Math.random() * ROWS),
                    });
                } else {
                    next.pop();
                }

                return next;
            });
        }, 120);

        return () => clearInterval(timer);
    }, [running, food]);

    /* ===== Game Over：提交分数（只一次） ===== */
    useEffect(() => {
        if (!running && score > 0 && !hasSubmittedRef.current) {
            hasSubmittedRef.current = true;
            submitScore(playerName.trim() || 'Player', score);
        }
    }, [running, score, playerName]);


    /* ===== Canvas 渲染 ===== */
    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(
            food.x * SIZE,
            food.y * SIZE,
            SIZE,
            SIZE
        );

        const headColor: [number, number, number] = [34, 197, 94];
        const tailColor: [number, number, number] = [16, 185, 129];

        snake.forEach((p, i) => {
            const x = p.x * SIZE;
            const y = p.y * SIZE;
            const t = i / Math.max(snake.length - 1, 1);

            ctx.fillStyle = lerpColor(headColor, tailColor, t);

            if (i === 0) {
                drawRoundRect(ctx, x, y, SIZE, SIZE, 6);
            } else {
                ctx.fillRect(x, y, SIZE, SIZE);
            }
        });
    }, [snake, food]);

    /* ===== 控制 ===== */
    const startGame = () => {
        hasSubmittedRef.current = false;
        setSnake([{ x: 10, y: 10 }]);
        setFood({ x: 5, y: 5 });
        setScore(0);
        dirRef.current = { x: 1, y: 0 };
        dirQueue.current = [];
        setRunning(true);
    };

    return (
        <div className={styles.card}>
            <h2 className={styles.title}>🐍 Snake Game</h2>

            <div className={styles.info}>
                <span>Score: {score}</span>
                <button onClick={startGame}>
                    {running ? 'Restart' : 'Start'}
                </button>
            </div>

            {/* ✅ 玩家名输入 */}
            <div className={styles.nameBox}>
                <input
                    ref={nameInputRef}
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                    placeholder="Player name"
                    maxLength={12}
                />
            </div>

            <canvas
                ref={canvasRef}
                width={WIDTH}
                height={HEIGHT}
                className={styles.canvas}
            />

            <div className={styles.tip}>
                ↑ ↓ ← → キーで操作
            </div>
        </div>
    );
}
