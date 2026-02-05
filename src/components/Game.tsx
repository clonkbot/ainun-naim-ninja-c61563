import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface Fruit {
  id: number;
  type: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  sliced: boolean;
  scale: number;
}

interface SlashTrail {
  id: number;
  points: { x: number; y: number }[];
  timestamp: number;
}

const FRUITS = ["🍎", "🍊", "🍋", "🍇", "🍉", "🥝", "🍑", "🍒", "🍌", "🥭"];
const BOMB = "💣";
const GRAVITY = 0.3;
const GAME_DURATION = 60;

export default function Game() {
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameOver">("idle");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [fruitsSliced, setFruitsSliced] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [slashTrails, setSlashTrails] = useState<SlashTrail[]>([]);
  const [isSlashing, setIsSlashing] = useState(false);
  const [currentTrail, setCurrentTrail] = useState<{ x: number; y: number }[]>([]);
  const [showComboPopup, setShowComboPopup] = useState(false);
  const [lives, setLives] = useState(3);

  const gameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const fruitIdRef = useRef(0);
  const trailIdRef = useRef(0);
  const comboTimerRef = useRef<NodeJS.Timeout>();
  const lastSlashTimeRef = useRef(0);

  const saveScore = useMutation(api.scores.saveScore);
  const userStats = useQuery(api.scores.getUserStats);

  const spawnFruit = useCallback(() => {
    if (!gameRef.current) return;
    const rect = gameRef.current.getBoundingClientRect();
    const isBomb = Math.random() < 0.1;
    const startX = Math.random() * rect.width * 0.6 + rect.width * 0.2;

    const fruit: Fruit = {
      id: fruitIdRef.current++,
      type: isBomb ? BOMB : FRUITS[Math.floor(Math.random() * FRUITS.length)],
      x: startX,
      y: rect.height + 50,
      vx: (Math.random() - 0.5) * 4,
      vy: -(Math.random() * 8 + 12),
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 15,
      sliced: false,
      scale: 1,
    };

    setFruits((prev) => [...prev, fruit]);
  }, []);

  const sliceFruit = useCallback((fruitId: number, isBomb: boolean) => {
    if (isBomb) {
      setLives((prev) => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          setGameState("gameOver");
        }
        return newLives;
      });
      setCombo(0);
      return;
    }

    setFruits((prev) =>
      prev.map((f) => (f.id === fruitId ? { ...f, sliced: true } : f))
    );

    const comboMultiplier = Math.min(combo + 1, 10);
    const points = 10 * comboMultiplier;
    setScore((prev) => prev + points);
    setFruitsSliced((prev) => prev + 1);
    setCombo((prev) => {
      const newCombo = prev + 1;
      setMaxCombo((max) => Math.max(max, newCombo));
      if (newCombo >= 3) {
        setShowComboPopup(true);
        setTimeout(() => setShowComboPopup(false), 500);
      }
      return newCombo;
    });

    if (comboTimerRef.current) {
      clearTimeout(comboTimerRef.current);
    }
    comboTimerRef.current = setTimeout(() => {
      setCombo(0);
    }, 1000);
  }, [combo]);

  const checkSlashCollision = useCallback(
    (trail: { x: number; y: number }[]) => {
      if (trail.length < 2) return;

      const now = Date.now();
      if (now - lastSlashTimeRef.current < 50) return;
      lastSlashTimeRef.current = now;

      const lastPoint = trail[trail.length - 1];
      const prevPoint = trail[trail.length - 2];

      setFruits((prev) =>
        prev.map((fruit) => {
          if (fruit.sliced) return fruit;

          const fruitSize = 40 * fruit.scale;
          const dx = fruit.x - lastPoint.x;
          const dy = fruit.y - lastPoint.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < fruitSize) {
            const slashDx = lastPoint.x - prevPoint.x;
            const slashDy = lastPoint.y - prevPoint.y;
            const slashSpeed = Math.sqrt(slashDx * slashDx + slashDy * slashDy);

            if (slashSpeed > 5) {
              sliceFruit(fruit.id, fruit.type === BOMB);
              return { ...fruit, sliced: true };
            }
          }
          return fruit;
        })
      );
    },
    [sliceFruit]
  );

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (gameState !== "playing") return;
    setIsSlashing(true);
    const rect = gameRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentTrail([{ x, y }]);
  }, [gameState]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isSlashing || gameState !== "playing") return;
      const rect = gameRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setCurrentTrail((prev) => {
        const newTrail = [...prev, { x, y }].slice(-20);
        checkSlashCollision(newTrail);
        return newTrail;
      });
    },
    [isSlashing, gameState, checkSlashCollision]
  );

  const handlePointerUp = useCallback(() => {
    if (currentTrail.length > 1) {
      setSlashTrails((prev) => [
        ...prev,
        { id: trailIdRef.current++, points: currentTrail, timestamp: Date.now() },
      ]);
    }
    setIsSlashing(false);
    setCurrentTrail([]);
  }, [currentTrail]);

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return;

    let lastSpawnTime = 0;
    const spawnInterval = 800;

    const gameLoop = (timestamp: number) => {
      if (timestamp - lastSpawnTime > spawnInterval) {
        spawnFruit();
        lastSpawnTime = timestamp;
      }

      setFruits((prev) =>
        prev
          .map((fruit) => ({
            ...fruit,
            x: fruit.x + fruit.vx,
            y: fruit.y + fruit.vy,
            vy: fruit.vy + GRAVITY,
            rotation: fruit.rotation + fruit.rotationSpeed,
            scale: fruit.sliced ? fruit.scale * 0.95 : fruit.scale,
          }))
          .filter((fruit) => fruit.y < (gameRef.current?.getBoundingClientRect().height ?? 800) + 100 && fruit.scale > 0.1)
      );

      setSlashTrails((prev) =>
        prev.filter((trail) => Date.now() - trail.timestamp < 200)
      );

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, spawnFruit]);

  // Timer
  useEffect(() => {
    if (gameState !== "playing") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameState("gameOver");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // Save score on game over
  useEffect(() => {
    if (gameState === "gameOver" && score > 0) {
      saveScore({ score, fruitsSliced, maxCombo });
    }
  }, [gameState, score, fruitsSliced, maxCombo, saveScore]);

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setFruitsSliced(0);
    setTimeLeft(GAME_DURATION);
    setFruits([]);
    setLives(3);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Stats Bar */}
      <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center">
          <p className="text-white/50 text-xs sm:text-sm">Score</p>
          <p className="text-2xl sm:text-3xl font-bold text-yellow-400 font-ninja">{score}</p>
        </div>
        <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center">
          <p className="text-white/50 text-xs sm:text-sm">Combo</p>
          <p className={`text-2xl sm:text-3xl font-bold font-ninja transition-all ${combo >= 3 ? "text-orange-400 scale-110" : "text-white"}`}>
            x{combo}
          </p>
        </div>
        <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center">
          <p className="text-white/50 text-xs sm:text-sm">Time</p>
          <p className={`text-2xl sm:text-3xl font-bold font-ninja ${timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-white"}`}>
            {timeLeft}s
          </p>
        </div>
        <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center">
          <p className="text-white/50 text-xs sm:text-sm">Lives</p>
          <p className="text-2xl sm:text-3xl">{"❤️".repeat(lives)}{"🖤".repeat(3 - lives)}</p>
        </div>
      </div>

      {/* Game Area */}
      <div
        ref={gameRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="relative w-full aspect-[4/3] bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950 rounded-2xl border-2 border-white/20 overflow-hidden cursor-crosshair touch-none select-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)
          `,
        }}
      >
        {/* Dojo background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.1) 40px, rgba(255,255,255,0.1) 41px),
                              repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.1) 40px, rgba(255,255,255,0.1) 41px)`
          }} />
        </div>

        {/* Slash trails */}
        <svg className="absolute inset-0 pointer-events-none">
          {slashTrails.map((trail) => (
            <path
              key={trail.id}
              d={`M ${trail.points.map((p) => `${p.x},${p.y}`).join(" L ")}`}
              stroke="url(#slashGradient)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-fade-out"
            />
          ))}
          {isSlashing && currentTrail.length > 1 && (
            <path
              d={`M ${currentTrail.map((p) => `${p.x},${p.y}`).join(" L ")}`}
              stroke="url(#slashGradient)"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
            />
          )}
          <defs>
            <linearGradient id="slashGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="50%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>

        {/* Fruits */}
        {fruits.map((fruit) => (
          <div
            key={fruit.id}
            className={`absolute text-4xl sm:text-5xl transition-opacity ${fruit.sliced ? "opacity-30" : ""}`}
            style={{
              left: fruit.x,
              top: fruit.y,
              transform: `translate(-50%, -50%) rotate(${fruit.rotation}deg) scale(${fruit.scale})`,
              filter: fruit.type === BOMB ? "drop-shadow(0 0 10px rgba(255, 0, 0, 0.5))" : "drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))",
            }}
          >
            {fruit.sliced ? (
              <span className="relative">
                <span className="absolute opacity-50 transform -translate-x-2 -translate-y-1">{fruit.type}</span>
                <span className="absolute opacity-50 transform translate-x-2 translate-y-1">{fruit.type}</span>
              </span>
            ) : (
              fruit.type
            )}
          </div>
        ))}

        {/* Combo popup */}
        {showComboPopup && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl sm:text-6xl font-ninja text-yellow-400 animate-combo-popup drop-shadow-glow">
            {combo}x COMBO!
          </div>
        )}

        {/* Idle/Game Over overlay */}
        {gameState !== "playing" && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center p-6 md:p-8">
              {gameState === "idle" ? (
                <>
                  <div className="text-5xl sm:text-7xl mb-4 animate-bounce-slow">🗡️</div>
                  <h2 className="font-ninja text-3xl sm:text-4xl text-white mb-4">Ready to Slice?</h2>
                  <p className="text-white/60 mb-6 text-sm sm:text-base">Swipe to slice fruits, avoid bombs!</p>
                  {userStats && (
                    <div className="mb-6 grid grid-cols-2 gap-2 sm:gap-4 text-sm">
                      <div className="bg-white/10 rounded-lg p-2 sm:p-3">
                        <p className="text-white/50 text-xs">High Score</p>
                        <p className="text-yellow-400 font-bold">{userStats.highestScore}</p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-2 sm:p-3">
                        <p className="text-white/50 text-xs">Games Played</p>
                        <p className="text-white font-bold">{userStats.totalGamesPlayed}</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-5xl sm:text-7xl mb-4">🎮</div>
                  <h2 className="font-ninja text-3xl sm:text-4xl text-white mb-4">Game Over!</h2>
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 text-sm">
                    <div className="bg-white/10 rounded-lg p-2 sm:p-3">
                      <p className="text-white/50 text-xs">Score</p>
                      <p className="text-yellow-400 font-bold text-lg sm:text-xl">{score}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-2 sm:p-3">
                      <p className="text-white/50 text-xs">Fruits</p>
                      <p className="text-green-400 font-bold text-lg sm:text-xl">{fruitsSliced}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-2 sm:p-3">
                      <p className="text-white/50 text-xs">Max Combo</p>
                      <p className="text-orange-400 font-bold text-lg sm:text-xl">x{maxCombo}</p>
                    </div>
                  </div>
                </>
              )}
              <button
                onClick={startGame}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white font-bold text-lg sm:text-xl rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transform hover:scale-105 transition-all"
              >
                {gameState === "idle" ? "Start Game" : "Play Again"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-white/40 text-xs sm:text-sm">
        💡 Swipe across fruits to slice them! Avoid 💣 bombs!
      </div>
    </div>
  );
}
