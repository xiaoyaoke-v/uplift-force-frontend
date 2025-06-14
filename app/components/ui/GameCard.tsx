import React from 'react';
import type { Game } from '@/types';

/**
 * 游戏卡片组件，竖向居中展示图片和文字
 */
export default function GameCard({ game }: { game: Game }) {
  return (
    <div className="flex flex-col items-center justify-center w-full gap-4">
      <img
        src={game.imagePath}
        alt={game.name}
        className="w-24 h-24 min-w-24 min-h-24 object-cover rounded-2xl shadow-lg mx-auto"
      />
      <h3 className="text-2xl font-bold text-white text-center w-full">{game.name}</h3>
    </div>
  );
} 