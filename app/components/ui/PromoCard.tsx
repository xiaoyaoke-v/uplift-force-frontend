import React from 'react';

interface PromoCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

/**
 * 推广卡片组件，竖向居中展示图标、标题和描述
 */
export default function PromoCard({ icon, title, description }: PromoCardProps) {
  return (
    <div className="!bg-white/5 !text-gray-300 p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center !border-none transform transition-all duration-300 hover:scale-[1.03] hover:!shadow-purple-500/50 hover:!shadow-lg">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
} 