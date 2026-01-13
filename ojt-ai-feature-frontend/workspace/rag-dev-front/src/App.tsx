import { useState, useRef, useEffect } from 'react';
import SnakeGame from './games/SnakeGame';
import Leaderboard from './components/Leaderboard';
import styles from './styles/layout.module.css';

// 模拟 DockerDocs 组件内容 (因为原项目是 React，而用户提供的是 Vue)
// 在实际项目中，如果需要混合使用 Vue 和 React，通常需要特殊的配置。
// 这里我将 DockerDocs 的逻辑转化为 React 组件以保持项目一致性。
const DockerDocs = () => {
    const docLibrary = [
        {
            category: "Infrastructure & Networking",
            title: "High-Availability Network Architecture",
            lead: "A comprehensive guide to designing resilient, low-latency container networks for Japanese data centers (Tokyo/Osaka).",
            sections: [
                {
                    h2: "Understanding the CNM Lifecycle",
                    content: `
                        <p>The Container Network Model (CNM) manages the lifecycle of container connectivity. In a production environment like <b>JP-East-1</b>, simply using the default bridge is insufficient. You must understand the interaction between Sandbox, Endpoint, and Network.</p>
                        <p>Sandbox contains the configuration of a container's network stack. This includes management of the container's interfaces, routing tables, and DNS settings.</p>
                    `,
                    callout: "Avoid IP address conflicts by explicitly defining subnet ranges in your network create commands."
                },
                {
                    h2: "Cross-Region Overlay Implementation",
                    content: `
                        <p>For services spanning multiple availability zones, <b>Overlay Networks</b> are mandatory. They use VXLAN encapsulation to create a L2 layer on top of L3 infrastructure. This allows containers on different hosts to communicate as if they were on the same local switch.</p>
                    `,
                    codeHeader: "Creating a Scalable Overlay Network",
                    code: "$ docker network create --driver overlay \\\n  --attachable \\\n  --subnet 10.0.10.0/24 \\\n  --opt encrypted \\\n  production_mesh"
                }
            ]
        }
    ];

    const [currentDoc] = useState(docLibrary[0]);

    return (
        <div className="docs-container" style={{ padding: '40px', color: '#333', lineHeight: '1.7', width: '100%', boxSizing: 'border-box', textAlign: 'left' }}>
            <nav className="breadcrumb" style={{ fontSize: '13px', color: '#888', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Docs &gt; Docker Engine &gt; User Guide &gt; {currentDoc.category}
            </nav>
            
            <header className="main-header" style={{ borderBottom: '2px solid #2496ed', marginBottom: '40px', paddingBottom: '25px' }}>
                <h1 style={{ fontSize: '3rem', color: '#1d2b36', margin: '0', lineHeight: '1.1' }}>{currentDoc.title}</h1>
                <p className="lead" style={{ fontSize: '1.3rem', color: '#555', marginTop: '15px', fontWeight: '300' }}>{currentDoc.lead}</p>
            </header>

            <div className="docs-body">
                {currentDoc.sections.map((section, index) => (
                    <section key={index} style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '1.9rem', marginTop: '50px', color: '#2496ed', display: 'flex', alignItems: 'center' }}>
                            <span style={{ display: 'inline-block', width: '4px', height: '24px', background: '#2496ed', marginRight: '12px', borderRadius: '2px' }}></span>
                            {index + 1}. {section.h2}
                        </h2>
                        <div dangerouslySetInnerHTML={{ __html: section.content }} style={{ fontSize: '1.05rem', margin: '18px 0' }}></div>
                        
                        {section.code && (
                            <>
                                <div className="code-header" style={{ background: '#2d3748', color: '#a0aec0', padding: '8px 16px', fontSize: '11px', borderRadius: '6px 6px 0 0', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                                    {section.codeHeader || 'Technical Implementation'}
                                </div>
                                <pre className="code-block" style={{ background: '#1a202c', color: '#e2e8f0', padding: '24px', borderRadius: '0 0 6px 6px', fontFamily: 'Courier New, Courier, monospace', overflowX: 'auto', marginBottom: '30px', lineHeight: '1.5', fontSize: '0.95rem' }}>
                                    <code>{section.code}</code>
                                </pre>
                            </>
                        )}

                        {section.callout && (
                            <div className="info-callout" style={{ background: '#f0f7ff', borderLeft: '5px solid #2496ed', padding: '20px', margin: '30px 0', borderRadius: '0 8px 8px 0', fontSize: '1rem', color: '#2c5282' }}>
                                <strong>Pro Tip:</strong> {section.callout}
                            </div>
                        )}
                    </section>
                ))}
            </div>
        </div>
    );
};

export default function App() {
    const [isMin, setIsMin] = useState(true);
    const [scale, setScale] = useState(0.6);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [onlineCount, setOnlineCount] = useState(0);

    // 获取在线人数
    useEffect(() => {
        const fetchOnline = async () => {
            try {
                const res = await fetch('/api/online-count');
                const data = await res.json();
                setOnlineCount(data.count);
            } catch (e) {
                console.error("Failed to fetch online count", e);
            }
        };
        fetchOnline();
        const timer = setInterval(fetchOnline, 15000);
        return () => clearInterval(timer);
    }, []);

    // 添加全局 ESC 键监听
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsMin(prev => !prev);
                setShowLeaderboard(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className={styles.appWrapper} style={{ 
            height: '100vh', 
            display: 'flex', 
            flexDirection: 'column', 
            background: '#fff',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Top Navigation */}
            <header style={{ 
                height: '50px', 
                background: '#2496ed', 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '0 20px',
                zIndex: 100
            }}>
                <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>🐳 Docker Documentation</span>
                    <nav style={{ display: 'flex', gap: '15px' }}>
                        <a href="#" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>Guides</a>
                        <a href="#" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.9rem' }}>Reference</a>
                    </nav>
                </div>
            </header>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar */}
                <aside style={{ 
                    width: '240px', 
                    background: '#f7f8f9', 
                    borderRight: '1px solid #dbe2e8',
                    padding: '20px'
                }}>
                    <div style={{ background: '#fff', border: '1px solid #cbd5e0', padding: '8px', borderRadius: '4px', fontSize: '13px', color: '#718096', marginBottom: '20px' }}>Search docs...</div>
                    <div style={{ padding: '8px 0', color: '#2496ed', fontWeight: 'bold', fontSize: '14px' }}>Core Concepts</div>
                    <div style={{ padding: '8px 0', color: '#4a5568', fontSize: '14px' }}>Installation</div>
                    <div style={{ padding: '8px 0', color: '#4a5568', fontSize: '14px' }}>Docker Engine</div>
                </aside>

                {/* Main Content - DockerDocs */}
                <main style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>
                    <DockerDocs />
                </main>
            </div>

            {/* Docker Style Bottom Bar (Docker Desktop Style) */}
            <footer style={{ 
                height: '40px', 
                background: '#1d2b36', 
                display: 'flex', 
                alignItems: 'center', 
                padding: '0 15px',
                color: '#fff',
                fontSize: '12px',
                justifyContent: 'space-between',
                zIndex: 100
            }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <div 
                        onClick={() => setShowLeaderboard(!showLeaderboard)}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: showLeaderboard ? '#2496ed' : '#fff' }}
                    >
                        <span>📊 Leaderboard</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ color: '#48bb78' }}>●</span> Engine Running
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: '10px' }}>
                        <span style={{ color: '#3182ce' }}>👥</span> Online: {onlineCount}
                    </div>
                </div>
                <div>v4.26.1</div>
            </footer>

            {/* Leaderboard Overlay (Click from Docker Bar) */}
            {showLeaderboard && (
                <div style={{ 
                    position: 'absolute', 
                    bottom: '45px', 
                    left: '15px', 
                    width: '300px', 
                    maxHeight: '400px', 
                    background: '#1a202c', 
                    borderRadius: '8px', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    zIndex: 200,
                    padding: '15px',
                    overflowY: 'auto',
                    border: '1px solid #2d3748'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', color: '#2496ed' }}>🏆 Rankings</h3>
                        <button onClick={() => setShowLeaderboard(false)} style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer' }}>✕</button>
                    </div>
                    <Leaderboard />
                </div>
            )}

            {/* Snake Game Widget (Bottom Right) */}
            <div style={{ 
                position: 'absolute', 
                bottom: '50px', 
                right: '20px', 
                zIndex: 150,
                transition: 'all 0.3s ease',
                transform: isMin ? 'translateY(0)' : 'translateY(0)',
            }}>
                <div style={{ 
                    background: '#020617', 
                    borderRadius: '12px', 
                    border: '1px solid #2496ed',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    overflow: 'hidden',
                    width: isMin ? '200px' : `${480 * scale}px`,
                }}>
                    <div 
                        onClick={() => setIsMin(!isMin)}
                        style={{ 
                            background: '#2496ed', 
                            padding: '8px 12px', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            cursor: 'pointer',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}
                    >
                        <span>🐍 Snake Diagnostic</span>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {!isMin && (
                                <div onClick={(e) => {
                                    e.stopPropagation();
                                    setScale(prev => Math.min(prev + 0.1, 1.2));
                                }} style={{ cursor: 'pointer' }}>＋</div>
                            )}
                            {!isMin && (
                                <div onClick={(e) => {
                                    e.stopPropagation();
                                    setScale(prev => Math.max(prev - 0.1, 0.4));
                                }} style={{ cursor: 'pointer' }}>－</div>
                            )}
                            <span>{isMin ? '▲' : '▼'}</span>
                        </div>
                    </div>
                    
                    {!isMin && (
                        <div style={{ 
                            padding: '10px', 
                            transform: `scale(${scale})`, 
                            transformOrigin: 'top left',
                            width: '460px', // Original width
                            height: '600px' // Approximate original height
                        }}>
                            <SnakeGame />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
