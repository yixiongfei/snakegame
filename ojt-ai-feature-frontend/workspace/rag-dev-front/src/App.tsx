import SnakeGame from './games/SnakeGame';
import Leaderboard from './components/Leaderboard';
import styles from './styles/layout.module.css';

export default function App() {
    return (
        <div className={styles.layout}>
            <div className={styles.container}>
                <aside className={styles.sidebar}>
                    <Leaderboard />
                </aside>
                <main className={styles.main}>
                    <SnakeGame />
                </main>
            </div>
        </div>
    );
}
