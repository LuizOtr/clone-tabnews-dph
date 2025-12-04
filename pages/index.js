'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// Estilos (CSS-in-JS para facilitar o copy-paste)
const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#1a1a1a',
        fontFamily: "'Courier New', Courier, monospace",
        color: '#ecf0f1',
        overflow: 'hidden'
    },
    canvas: {
        border: '4px solid #34495e',
        backgroundColor: '#000',
        boxShadow: '0 0 20px rgba(0,0,0,0.5)',
        transition: 'border-color 0.2s'
    },
    overlay: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: '2rem',
        borderRadius: '10px',
        border: '1px solid #2ecc71',
        minWidth: '300px'
    },
    button: {
        marginTop: '20px',
        padding: '10px 20px',
        fontSize: '18px',
        cursor: 'pointer',
        backgroundColor: '#2ecc71',
        border: 'none',
        borderRadius: '5px',
        color: '#fff',
        fontWeight: 'bold'
    },
    achievement: {
        position: 'absolute',
        top: '10%',
        backgroundColor: '#f1c40f',
        color: '#000',
        padding: '10px 20px',
        borderRadius: '5px',
        fontWeight: 'bold',
        animation: 'fadeInOut 3s forwards',
        boxShadow: '0 0 15px #f1c40f'
    },
    controls: {
        marginTop: '10px',
        fontSize: '14px',
        color: '#7f8c8d'
    }
};

export default function SnakeGame() {
    const canvasRef = useRef(null);
    
    // Estados do Jogo
    const [gameState, setGameState] = useState('START'); // START, PLAYING, GAMEOVER
    const [score, setScore] = useState(0);
    const [achievement, setAchievement] = useState(null);
    const [isTurbo, setIsTurbo] = useState(false);

    // Refs para lógica mutável (evita re-renderizações desnecessárias durante o loop)
    const snakeRef = useRef([{ x: 200, y: 200 }]);
    const foodRef = useRef({ x: 100, y: 100 });
    const directionRef = useRef('RIGHT'); // Direção atual
    const nextDirectionRef = useRef('RIGHT'); // Buffer de input para evitar bugs de virada rápida
    const speedRef = useRef(100);
    const gameLoopRef = useRef(null);
    const box = 20;

    // Função para iniciar/reiniciar
    const startGame = () => {
        snakeRef.current = [{ x: 10 * box, y: 10 * box }];
        directionRef.current = 'RIGHT';
        nextDirectionRef.current = 'RIGHT';
        setScore(0);
        setAchievement(null);
        spawnFood();
        setGameState('PLAYING');
    };

    const spawnFood = () => {
        foodRef.current = {
            x: Math.floor(Math.random() * 19 + 1) * box,
            y: Math.floor(Math.random() * 19 + 1) * box
        };
    };

    // Controle de Input
    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = e.key;

            // Movimentação
            if (key === "ArrowLeft" && directionRef.current !== "RIGHT") nextDirectionRef.current = "LEFT";
            if (key === "ArrowUp" && directionRef.current !== "DOWN") nextDirectionRef.current = "UP";
            if (key === "ArrowRight" && directionRef.current !== "LEFT") nextDirectionRef.current = "RIGHT";
            if (key === "ArrowDown" && directionRef.current !== "UP") nextDirectionRef.current = "DOWN";
            
            // Habilidade: Turbo (Barra de Espaço)
            if (key === " ") {
                speedRef.current = 40; // Muito rápido
                setIsTurbo(true);
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === " ") {
                speedRef.current = 100; // Velocidade normal
                setIsTurbo(false);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("keyup", handleKeyUp);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    // Loop Principal do Jogo
    const gameLoop = useCallback(() => {
        if (gameState !== 'PLAYING') return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        // Atualiza direção baseada no buffer (evita colisão consigo mesmo ao apertar duas teclas rápido)
        directionRef.current = nextDirectionRef.current;

        // Movimento Lógico
        let headX = snakeRef.current[0].x;
        let headY = snakeRef.current[0].y;

        if (directionRef.current === "LEFT") headX -= box;
        if (directionRef.current === "UP") headY -= box;
        if (directionRef.current === "RIGHT") headX += box;
        if (directionRef.current === "DOWN") headY += box;

        const newHead = { x: headX, y: headY };

        // Colisão (Paredes ou Corpo)
        const collision = 
            headX < 0 || headX >= canvas.width || 
            headY < 0 || headY >= canvas.height ||
            snakeRef.current.some(segment => segment.x === headX && segment.y === headY);

        if (collision) {
            setGameState('GAMEOVER');
            return;
        }

        // Comer Fruta
        if (headX === foodRef.current.x && headY === foodRef.current.y) {
            // Lógica de Pontuação e Achievement
            const newScore = score + 10;
            setScore(newScore);
            spawnFood();
            
            // UX: Notificação aos 250 pontos
            if (newScore === 250) {
                setAchievement("NÍVEL SISTEMA: 250 PONTOS ALCANÇADO!");
                setTimeout(() => setAchievement(null), 3000); // Some após 3s
            }
        } else {
            snakeRef.current.pop(); // Remove cauda se não comeu
        }

        snakeRef.current.unshift(newHead);

        // Renderização (Draw)
        // Limpa tela
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Desenha Comida
        ctx.fillStyle = "#e74c3c";
        ctx.shadowBlur = 15; // Glow effect
        ctx.shadowColor = "#e74c3c";
        ctx.fillRect(foodRef.current.x, foodRef.current.y, box, box);
        ctx.shadowBlur = 0;

        // Desenha Cobra
        snakeRef.current.forEach((segment, i) => {
            ctx.fillStyle = i === 0 ? "#2ecc71" : "#27ae60"; // Cabeça diferente do corpo
            
            // Efeito visual do Turbo
            if (speedRef.current < 100) {
                ctx.fillStyle = i === 0 ? "#f1c40f" : "#f39c12"; // Amarelo no turbo
            }

            ctx.fillRect(segment.x, segment.y, box, box);
            ctx.strokeStyle = "#1a1a1a";
            ctx.strokeRect(segment.x, segment.y, box, box);
        });

        // Loop recursivo com setTimeout para permitir velocidade variável
        gameLoopRef.current = setTimeout(gameLoop, speedRef.current);

    }, [gameState, score]);

    // Gatilho do Loop
    useEffect(() => {
        if (gameState === 'PLAYING') {
            gameLoop();
        }
        return () => clearTimeout(gameLoopRef.current);
    }, [gameState, gameLoop]); // Dependência do gameLoop atualizada

    return (
        <div style={styles.container}>
            <h1 style={{ marginBottom: '10px' }}>SYSTEM SNAKE</h1>
            
            {/* HUD de Pontuação */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                width: '400px', 
                marginBottom: '5px',
                fontSize: '1.2rem'
            }}>
                <span>SCORE: {score}</span>
                {isTurbo && <span style={{color: '#f1c40f'}}>⚡ TURBO ON</span>}
            </div>

            {/* Canvas do Jogo */}
            <canvas 
                ref={canvasRef} 
                width="400" 
                height="400"
                style={{
                    ...styles.canvas,
                    borderColor: isTurbo ? '#f1c40f' : '#34495e' // Feedback visual na borda
                }}
            />

            {/* Achievement Popup */}
            {achievement && (
                <div style={styles.achievement}>
                    🏆 {achievement}
                </div>
            )}

            {/* Menu Inicial */}
            {gameState === 'START' && (
                <div style={styles.overlay}>
                    <h2>BEM-VINDO</h2>
                    <p>Colete dados para o sistema.</p>
                    <div style={styles.controls}>Setas para mover • Espaço para Turbo</div>
                    <button style={styles.button} onClick={startGame}>INICIAR SISTEMA</button>
                </div>
            )}

            {/* Game Over Screen */}
            {gameState === 'GAMEOVER' && (
                <div style={styles.overlay}>
                    <h2 style={{color: '#e74c3c'}}>FALHA NO SISTEMA</h2>
                    <p>Pontuação Final: {score}</p>
                    {score >= 250 && <p style={{color: '#f1c40f'}}>Ranking: Senior Dev!</p>}
                    <button style={styles.button} onClick={startGame}>REINICIAR</button>
                </div>
            )}
        </div>
    );
}