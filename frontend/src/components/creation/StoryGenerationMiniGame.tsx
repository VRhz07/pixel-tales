import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useThemeStore } from '../../stores/themeStore';
import soundService from '../../services/soundService';

interface StoryGenerationMiniGameProps {
  storyIdea: string;
}

export interface ObstacleConfig {
  url: string;
  frames: number;
  framesY?: number;
  isFloating?: boolean;
  scale?: number;
  yOffset?: number;
  isDiagonal?: boolean;
}

export interface ThemeConfig {
  heroUrl: string;
  bgUrl: string;
  obstacleUrl?: string;
  obstacles?: ObstacleConfig[];
  frames: number;
  framesY?: number;
  obsFrames?: number;
  obsFramesY?: number;
  groundOffset?: number;
}

const getThemeForIdea = (idea: string): ThemeConfig => {
  const text = idea.toLowerCase();
  
  if (text.includes('space') || text.includes('alien') || text.includes('star') || text.includes('planet')) {
    return {
      heroUrl: '/sprites/rocket.png',
      bgUrl: '/sprites/space_bg.png',
      obstacles: [
        { url: '/sprites/space_obstacle_alien.png', frames: 4, framesY: 1, isFloating: false, scale: 1.2, yOffset: 20 },
        { url: '/sprites/space_obstacle_ufo.png', frames: 4, framesY: 1, isFloating: true, scale: 1.1 },
        { url: '/sprites/space_obstacle_meteor.png', frames: 4, framesY: 1, isFloating: true, isDiagonal: true, scale: 1.3 }
      ],
      frames: 4,
      framesY: 2,
      groundOffset: 35
    };
  }
  
  if (text.includes('ocean') || text.includes('sea') || text.includes('water') || text.includes('fish') || text.includes('pirate')) {
    return {
      heroUrl: '/sprites/mermaid.png',
      bgUrl: '/sprites/ocean_bg.png',
      obstacles: [
        { url: '/sprites/ocean_obstacle_kraken.png', frames: 4, framesY: 1, isFloating: false, scale: 1.4, yOffset: 8 },
        { url: '/sprites/ocean_obstacle_shark.png', frames: 4, framesY: 1, isFloating: true, scale: 1.5, yOffset: 25 },
        { url: '/sprites/ocean_obstacle_submarine.png', frames: 4, framesY: 1, isFloating: true, scale: 1.8, yOffset: 35 }
      ],
      frames: 4,
      framesY: 1,
      groundOffset: 20
    };
  }
  
  if (text.includes('magic') || text.includes('dragon') || text.includes('castle') || text.includes('knight') || text.includes('fantasy')) {
    return {
      heroUrl: '/sprites/wizard.png',
      bgUrl: '/sprites/magic_bg.png',
      obstacles: [
        { url: '/sprites/magic_obstacle_monster.png', frames: 4, framesY: 1, isFloating: false, scale: 1.3 },
        { url: '/sprites/magic_obstacle_bat.png', frames: 4, framesY: 1, isFloating: true, scale: 0.9 },
        { url: '/sprites/magic_obstacle_witch.png', frames: 4, framesY: 1, isFloating: true, scale: 1.1 }
      ],
      frames: 4,
      framesY: 1,
      groundOffset: 10
    };
  }
  
  if (text.includes('jungle') || text.includes('forest') || text.includes('animal') || text.includes('dinosaur')) {
    return {
      heroUrl: '/sprites/explorer.png',
      bgUrl: '/sprites/jungle_bg.png',
      obstacles: [
        { url: '/sprites/jungle_obstacle_boar.png', frames: 4, framesY: 1, isFloating: false, scale: 1.2 },
        { url: '/sprites/jungle_obstacle_snake.png', frames: 4, framesY: 1, isFloating: false, scale: 0.9 },
        { url: '/sprites/jungle_obstacle_trex.png', frames: 4, framesY: 1, isFloating: false, scale: 1.7, yOffset: 12 },
        { url: '/sprites/jungle_obstacle_eagle.png', frames: 4, framesY: 1, isFloating: true, scale: 1.2 }
      ],
      frames: 4,
      framesY: 1,
      groundOffset: 5
    };
  }

  // Default theme - Deterministically random based on input
  const defaultThemes: ThemeConfig[] = [
    { 
      heroUrl: '/sprites/rocket.png', 
      bgUrl: '/sprites/space_bg.png', 
      obstacles: [
        { url: '/sprites/space_obstacle_alien.png', frames: 4, framesY: 1, isFloating: false, scale: 1.2, yOffset: 20 },
        { url: '/sprites/space_obstacle_ufo.png', frames: 4, framesY: 1, isFloating: true, scale: 1.1 },
        { url: '/sprites/space_obstacle_meteor.png', frames: 4, framesY: 1, isFloating: true, isDiagonal: true, scale: 1.3 }
      ],
      frames: 4, 
      framesY: 2, 
      groundOffset: 35 
    },
    { 
      heroUrl: '/sprites/mermaid.png', 
      bgUrl: '/sprites/ocean_bg.png', 
      obstacles: [
        { url: '/sprites/ocean_obstacle_kraken.png', frames: 4, framesY: 1, isFloating: false, scale: 1.4, yOffset: 8 },
        { url: '/sprites/ocean_obstacle_shark.png', frames: 4, framesY: 1, isFloating: true, scale: 1.5, yOffset: 25 },
        { url: '/sprites/ocean_obstacle_submarine.png', frames: 4, framesY: 1, isFloating: true, scale: 1.8, yOffset: 35 }
      ],
      frames: 4, 
      framesY: 1, 
      groundOffset: 20 
    },
    { 
      heroUrl: '/sprites/wizard.png', 
      bgUrl: '/sprites/magic_bg.png', 
      obstacles: [
        { url: '/sprites/magic_obstacle_monster.png', frames: 4, framesY: 1, isFloating: false, scale: 1.3 },
        { url: '/sprites/magic_obstacle_bat.png', frames: 4, framesY: 1, isFloating: true, scale: 0.9 },
        { url: '/sprites/magic_obstacle_witch.png', frames: 4, framesY: 1, isFloating: true, scale: 1.1 }
      ],
      frames: 4, 
      framesY: 1, 
      groundOffset: 10 
    },
    { 
      heroUrl: '/sprites/explorer.png', 
      bgUrl: '/sprites/jungle_bg.png', 
      obstacles: [
        { url: '/sprites/jungle_obstacle_boar.png', frames: 4, framesY: 1, isFloating: false, scale: 1.2 },
        { url: '/sprites/jungle_obstacle_snake.png', frames: 4, framesY: 1, isFloating: false, scale: 0.9 },
        { url: '/sprites/jungle_obstacle_trex.png', frames: 4, framesY: 1, isFloating: false, scale: 1.7, yOffset: 12 },
        { url: '/sprites/jungle_obstacle_eagle.png', frames: 4, framesY: 1, isFloating: true, scale: 1.2 }
      ],
      frames: 4, 
      framesY: 1, 
      groundOffset: 5 
    }
  ];
  
  return defaultThemes[idea.length % 4];
};

export const StoryGenerationMiniGame: React.FC<StoryGenerationMiniGameProps> = ({ storyIdea }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const { isDarkMode } = useThemeStore();
  
  const gameState = useRef({
    heroY: 120,
    heroVelocity: 0,
    gravity: 0.8,
    jumpStrength: -12,
    isJumping: false,
    obstacles: [] as { x: number; y: number; frame: number; typeIdx?: number }[],
    score: 0,
    speed: 5,
    frameCount: 0,
    isGameOver: false,
    bgX: 0
  });

  const imagesRef = useRef<{ 
    hero?: HTMLImageElement; 
    bg?: HTMLImageElement; 
    obstacle?: HTMLImageElement;
    obstacleArray?: HTMLImageElement[];
  }>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('pixel_tales_minigame_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    const theme = getThemeForIdea(storyIdea);
    let loadedCount = 0;
    
    const hasMultipleObstacles = !!theme.obstacles && theme.obstacles.length > 0;
    const toLoad = 2 + (hasMultipleObstacles ? theme.obstacles!.length : (theme.obstacleUrl ? 1 : 0));
    
    setImagesLoaded(false);

    const checkDone = () => {
      loadedCount++;
      if (loadedCount === toLoad) setImagesLoaded(true);
    };

    const imgHero = new Image(); imgHero.src = theme.heroUrl; imgHero.onload = checkDone; imgHero.onerror = checkDone;
    const imgBg = new Image(); imgBg.src = theme.bgUrl; imgBg.onload = checkDone; imgBg.onerror = checkDone;

    const newImagesRef: any = { hero: imgHero, bg: imgBg };
    
    if (hasMultipleObstacles) {
      newImagesRef.obstacleArray = [];
      theme.obstacles!.forEach((obsConfig, idx) => {
        const img = new Image();
        img.src = obsConfig.url;
        img.onload = checkDone;
        img.onerror = checkDone;
        newImagesRef.obstacleArray[idx] = img;
      });
    } else if (theme.obstacleUrl) {
      const imgObs = new Image(); imgObs.src = theme.obstacleUrl; imgObs.onload = checkDone; imgObs.onerror = checkDone;
      newImagesRef.obstacle = imgObs;
    } else {
      checkDone();
    }

    imagesRef.current = newImagesRef;
  }, [storyIdea]);

  const jump = useCallback((e?: React.PointerEvent | React.TouchEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (gameState.current.isGameOver) {
      gameState.current = {
        ...gameState.current,
        heroY: 120,
        heroVelocity: 0,
        obstacles: [],
        score: 0,
        speed: 5,
        isGameOver: false
      };
      setIsGameOver(false);
      setScore(0);
      if (scoreRef.current) {
        scoreRef.current.innerText = `Score: 0 | High: ${highScore}`;
      }
      return;
    }

    if (!gameState.current.isJumping) {
      gameState.current.heroVelocity = gameState.current.jumpStrength;
      gameState.current.isJumping = true;
      soundService.playSound('swipe');
    }
  }, [highScore]);

  useEffect(() => {
    if (!imagesLoaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.imageSmoothingEnabled = false;

    let animationId: number;
    const theme = getThemeForIdea(storyIdea);
    const imgs = imagesRef.current;
    
    const heroDisplayH = 80;
    const obsDisplayH = 64;
    const groundY = canvas.height - (theme.groundOffset || 15);
    const heroBaseY = groundY - heroDisplayH;

    const gameLoop = () => {
      const state = gameState.current;

      if (imgs.bg && imgs.bg.width > 0) {
        state.bgX -= state.speed * 0.2;
        if (state.bgX <= -canvas.width) state.bgX = 0;
        ctx.drawImage(imgs.bg, state.bgX, 0, canvas.width, canvas.height);
        ctx.drawImage(imgs.bg, state.bgX + canvas.width, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = isDarkMode ? '#1F2937' : '#8B5CF6';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      if (!state.isGameOver) {
        state.heroVelocity += state.gravity;
        state.heroY += state.heroVelocity;

        if (state.heroY >= heroBaseY) {
          state.heroY = heroBaseY;
          state.heroVelocity = 0;
          state.isJumping = false;
        }

        // Spawn obstacles (Dino run style)
        if (state.frameCount % Math.max(60, 120 - Math.floor(state.speed * 5)) === 0) {
          let isAirObstacle = Math.random() < 0.3;
          let spawnY = isAirObstacle 
            ? groundY - heroDisplayH - obsDisplayH - 10 
            : groundY - obsDisplayH;
          let totalObsFrames = (theme.obsFrames || 2) * (theme.obsFramesY || 1);
          let typeIdx = undefined;
          
          if (theme.obstacles && theme.obstacles.length > 0) {
             typeIdx = Math.floor(Math.random() * theme.obstacles.length);
             const config = theme.obstacles[typeIdx];
             isAirObstacle = !!config.isFloating;
             const scale = config.scale || 1;
             const yOffset = config.yOffset || 0;
             const currentObsDisplayH = obsDisplayH * scale;
             
             if (config.isDiagonal) {
               spawnY = Math.random() * 20 - 10; // Spawns near top, aligned for perfect intercept
             } else if (isAirObstacle) {
               if (Math.random() > 0.5) {
                 spawnY = groundY - heroDisplayH - currentObsDisplayH + 5 + yOffset;
               } else {
                 spawnY = groundY - currentObsDisplayH - 25 + yOffset;
               }
             } else {
               spawnY = groundY - currentObsDisplayH + yOffset;
             }
             totalObsFrames = (config.frames || 1) * (config.framesY || 1);
          }
            
          state.obstacles.push({
            x: canvas.width,
            y: spawnY,
            frame: typeIdx !== undefined ? Math.floor(Math.random() * totalObsFrames) : Math.floor(Math.random() * totalObsFrames),
            typeIdx
          });
        }

        state.score += 1;
        if (state.score % 500 === 0) state.speed += 0.5;
      }

      let heroDisplayW = heroDisplayH;
      if (imgs.hero && imgs.hero.width > 0) {
        const frameW = imgs.hero.width / theme.frames;
        const frameH = imgs.hero.height / (theme.framesY || 1);
        heroDisplayW = (frameW / frameH) * heroDisplayH;
        
        const currentFrame = state.isJumping ? 0 : Math.floor((state.frameCount / 8) % theme.frames);
        
        ctx.drawImage(
          imgs.hero,
          currentFrame * frameW, 0,
          frameW, frameH,
          50, state.heroY, heroDisplayW, heroDisplayH
        );
      } else {
        ctx.fillStyle = 'red';
        ctx.fillRect(50, state.heroY, heroDisplayW, heroDisplayH);
      }

      for (let i = state.obstacles.length - 1; i >= 0; i--) {
        const obs = state.obstacles[i];
        if (!state.isGameOver) {
          obs.x -= state.speed;
          if (obs.typeIdx !== undefined && theme.obstacles) {
            const obsConfig = theme.obstacles[obs.typeIdx];
            if (obsConfig.isDiagonal) {
              obs.y += state.speed * 0.25; // Perfect trajectory to hit hero center
            }
          }
        }

        let currentObsDisplayH = obsDisplayH;
        let obsDisplayW = currentObsDisplayH;
        if (obs.typeIdx !== undefined && theme.obstacles && imgs.obstacleArray && imgs.obstacleArray[obs.typeIdx] && imgs.obstacleArray[obs.typeIdx].width > 0) {
          const obsConfig = theme.obstacles[obs.typeIdx];
          const img = imgs.obstacleArray[obs.typeIdx];
          
          currentObsDisplayH = obsDisplayH * (obsConfig.scale || 1);
          const obsFramesX = obsConfig.frames || 1;
          const obsFramesY = obsConfig.framesY || 1;
          const obsFrameW = img.width / obsFramesX;
          const obsFrameH = img.height / obsFramesY;
          obsDisplayW = (obsFrameW / obsFrameH) * currentObsDisplayH;
          
          const currentObsFrame = (Math.floor(state.frameCount / 8) + obs.frame) % obsFramesX;
          
          const srcX = (currentObsFrame % obsFramesX) * obsFrameW;
          const srcY = Math.floor(currentObsFrame / obsFramesX) * obsFrameH;
          
          ctx.drawImage(
            img,
            srcX, srcY,
            obsFrameW, obsFrameH,
            obs.x, obs.y, obsDisplayW, currentObsDisplayH
          );
        } else if (imgs.obstacle && imgs.obstacle.width > 0) {
          const obsFramesX = theme.obsFrames || 2;
          const obsFramesY = theme.obsFramesY || 1;
          const obsFrameW = imgs.obstacle.width / obsFramesX;
          const obsFrameH = imgs.obstacle.height / obsFramesY;
          obsDisplayW = (obsFrameW / obsFrameH) * currentObsDisplayH;
          
          const srcX = (obs.frame % obsFramesX) * obsFrameW;
          const srcY = Math.floor(obs.frame / obsFramesX) * obsFrameH;
          
          ctx.drawImage(
            imgs.obstacle,
            srcX, srcY,
            obsFrameW, obsFrameH,
            obs.x, obs.y, obsDisplayW, currentObsDisplayH
          );
        } else {
          ctx.fillStyle = 'black';
          ctx.fillRect(obs.x, obs.y, obsDisplayW, currentObsDisplayH);
        }

        // Collision detection - using circular distance for better accuracy on varying sprites
        const heroCenterX = 50 + heroDisplayW / 2;
        const heroCenterY = state.heroY + heroDisplayH / 2;
        const obsCenterX = obs.x + obsDisplayW / 2;
        const obsCenterY = obs.y + currentObsDisplayH / 2;

        const dx = heroCenterX - obsCenterX;
        const dy = heroCenterY - obsCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Dynamic radius based on the average size of the sprites minus some padding
        const hitRadius = ((Math.min(heroDisplayW, heroDisplayH) + Math.min(obsDisplayW, currentObsDisplayH)) / 2) * 0.6;

        if (!state.isGameOver && distance < hitRadius) {
          state.isGameOver = true;
          setIsGameOver(true);
          soundService.playErrorWithHaptic();
          
          const finalScore = Math.floor(state.score / 10);
          if (finalScore > highScore) {
            setHighScore(finalScore);
            localStorage.setItem('pixel_tales_minigame_highscore', finalScore.toString());
          }
        }

        // Remove offscreen
        if (obs.x < -60) {
          state.obstacles.splice(i, 1);
        }
      }

      if (!state.isGameOver && state.score % 10 === 0) {
        const newScore = Math.floor(state.score / 10);
        if (scoreRef.current) {
          scoreRef.current.innerText = `Score: ${newScore} | High: ${highScore}`;
        }
      }

      state.frameCount++;
      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [storyIdea, isDarkMode, highScore, imagesLoaded]);

  return (
    <div 
      style={{ 
        width: '100%', 
        maxWidth: '400px', 
        margin: '0 auto',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: `2px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
        cursor: 'pointer',
        position: 'relative',
        background: '#000',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none'
      }}
      onPointerDown={jump}
    >
      <style>{`
        .minigame-force-white {
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
          text-shadow: 2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000 !important;
          opacity: 1 !important;
        }
      `}</style>

      {!imagesLoaded && (
        <div className="minigame-force-white" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 'bold' }}>
          Loading Magic...
        </div>
      )}

      <div ref={scoreRef} className="minigame-force-white" style={{
        position: 'absolute',
        top: '10px',
        left: '15px',
        fontWeight: 'bold',
        zIndex: 10,
        pointerEvents: 'none',
        fontSize: '16px'
      }}>
        Score: {score} | High: {highScore}
      </div>

      {isGameOver && (
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20
        }}>
          <h3 className="minigame-force-white" style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>CRASH!</h3>
          <p className="minigame-force-white" style={{ marginBottom: '16px', fontWeight: 'bold' }}>Tap to try again</p>
        </div>
      )}

      <canvas 
        ref={canvasRef}
        width={400}
        height={200}
        style={{ display: 'block', width: '100%', height: 'auto', touchAction: 'none' }}
      />
      
      <div style={{
        padding: '8px',
        textAlign: 'center',
        background: isDarkMode ? '#1F2937' : '#F3F4F6',
        fontSize: '12px',
        color: isDarkMode ? '#9CA3AF' : '#4B5563',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        Tap or Click anywhere to jump!
      </div>
    </div>
  );
};
