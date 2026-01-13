
import { useEffect, useRef, useState } from 'react';
import styles from './SnakeGame.module.css';
import { submitScore } from '../api/leaderboard';

const SIZE = 20;
const WIDTH = 400;
const HEIGHT = 400;
const COLS = WIDTH / SIZE;
const ROWS = HEIGHT / SIZE;

type Point = { x: number; y: number };
type GameStatus = 'idle' | 'running' | 'paused' | 'over';

const OPPOSITE = (a: Point, b: Point) => a.x + b.x === 0 && a.y + b.y === 0;

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
  const [score, setScore] = useState(0);

  // ✅ 用 status 替代 running，避免“暂停=结束”
  const [status, setStatus] = useState<GameStatus>('idle');

  // ✅ 玩家名
  const [playerName, setPlayerName] = useState('Player');

  const dirRef = useRef<Point>({ x: 1, y: 0 });
  const dirQueue = useRef<Point[]>([]);

  // ✅ 提交锁：防止重复/意外提交
  const hasSubmittedRef = useRef(false);     // 已提交标记
  const submitLockRef = useRef(false);       // 正在提交（in-flight lock）
  const lastSubmitAtRef = useRef(0);         // 防抖时间戳（可选但稳）

  // ✅ 让事件处理器拿到最新 status（避免闭包旧值）
  const statusRef = useRef<GameStatus>(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  /* ===== 键盘输入：方向键 + WASD + Space 暂停/继续 ===== */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // 如果焦点在输入框/可编辑区域，避免影响打字（按需可删）
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      // Space：允许在非输入时切换暂停/继续
      if (e.code === 'Space' && !isTyping) {
        e.preventDefault();

        const s = statusRef.current;
        if (s === 'running') setStatus('paused');
        else if (s === 'paused') setStatus('running');
        // idle/over 按空格不做事（也可改成开始游戏）
        return;
      }

      // 正在输入就不接收方向控制
      if (isTyping) return;

      // 只有 running 才接收方向输入
      if (statusRef.current !== 'running') return;

      const key = e.key.startsWith('Arrow') ? e.key : e.key.toLowerCase();

      const map: Record<string, Point> = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        w: { x: 0, y: -1 },
        s: { x: 0, y: 1 },
        a: { x: -1, y: 0 },
        d: { x: 1, y: 0 },
      };

      const next = map[key];
      if (!next) return;

      // 防止方向键滚动页面
      if (key.startsWith('Arrow')) e.preventDefault();

      const last = dirQueue.current.at(-1) ?? dirRef.current;
      if (OPPOSITE(last, next)) return;

      dirQueue.current.push(next);
    };

    // passive: false 才能对 Arrow/Space preventDefault 生效
    window.addEventListener('keydown', onKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  /* ===== 游戏循环：只在 status==='running' 时跑 ===== */
  useEffect(() => {
    if (status !== 'running') return;

    const timer = setInterval(() => {
      // 如果期间被暂停/结束，直接不动（双保险）
      if (statusRef.current !== 'running') return;

      if (dirQueue.current.length) {
        dirRef.current = dirQueue.current.shift()!;
      }


        setSnake(prev => {
        const head = {
            x: prev[0].x + dirRef.current.x,
            y: prev[0].y + dirRef.current.y,
        };

        // Game Over：撞墙（真正结束）
        if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS) {
            setStatus('over');
            return prev;
        }

        // ✅ 先判断这一回合是否会吃到食物
        const willEat = head.x === food.x && head.y === food.y;

        // ✅ 撞到自己：标准判定
        // - 如果 willEat：身体不会缩短，任何撞到 prev 都算死
        // - 如果不会吃：尾巴会移走，所以允许“走到尾巴那一格”
        const bodyToCheck = willEat ? prev : prev.slice(0, -1);

        if (bodyToCheck.some(p => p.x === head.x && p.y === head.y)) {
            setStatus('over');
            return prev;
        }

        const next = [head, ...prev];

        if (willEat) {
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
  }, [status, food]);

  /* ===== Game Over：只在 status==='over' 时提交分数（只一次 + 锁 + 防抖） ===== */
  useEffect(() => {
    if (status !== 'over') return;
    if (score <= 0) return;
    if (hasSubmittedRef.current) return;

    // ✅ 防抖：避免极端情况下瞬间多次触发（比如热更新/重复渲染）
    const now = Date.now();
    if (now - lastSubmitAtRef.current < 600) return;
    lastSubmitAtRef.current = now;

    // ✅ in-flight 锁：防止 submitScore 是 async 时重复发起请求
    if (submitLockRef.current) return;
    submitLockRef.current = true;

    const name = playerName.trim() || 'Player';

    (async () => {
      try {
        await submitScore(name, score);
        hasSubmittedRef.current = true;
      } catch (err) {
        // 失败时允许重试（不把 hasSubmittedRef 置 true）
        console.error('submitScore failed:', err);
      } finally {
        submitLockRef.current = false;
      }
    })();
  }, [status, score, playerName]);

  /* ===== Canvas 渲染 ===== */
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // 食物
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(food.x * SIZE, food.y * SIZE, SIZE, SIZE);

    // 蛇
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

    // ✅ 暂停遮罩提示（可选）
    if (status === 'paused') {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 28px system-ui, -apple-system, Segoe UI, Roboto';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Paused', WIDTH / 2, HEIGHT / 2);
    }
  }, [snake, food, status]);

  /* ===== 控制：开始/重开 ===== */
  const startGame = () => {
    // ✅ 清理提交锁
    hasSubmittedRef.current = false;
    submitLockRef.current = false;
    lastSubmitAtRef.current = 0;

    setSnake([{ x: 10, y: 10 }]);
    setFood({ x: 5, y: 5 });
    setScore(0);

    dirRef.current = { x: 1, y: 0 };
    dirQueue.current = [];

    setStatus('running');
  };

  const isRunning = status === 'running';
  const isPaused = status === 'paused';

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>🐍 Snake Game</h2>

      <div className={styles.info}>
        <span>Score: {score}</span>
        <button onClick={startGame}>
          {isRunning || isPaused ? 'Restart' : 'Start'}
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
        ↑ ↓ ← → / WASD 操作 | Space 暂停/继续
      </div>
    </div>
  );
}
