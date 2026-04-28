import React, { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
import MainScene from './scenes/MainScene';

const SimulationCanvas: React.FC = () => {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameRef.current,
      width: '100%',
      height: '100%',
      backgroundColor: '#0f172a', // slate-900
      scene: [MainScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    const game = new Phaser.Game(config);

    return () => {
      game.destroy(true);
    };
  }, []);

  return <div ref={gameRef} className="w-full h-full" />;
};

export default SimulationCanvas;
