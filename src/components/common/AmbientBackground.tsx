import React from 'react';

export const AmbientBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Orb 1: Emerald glow top left */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/15 blur-[100px] animate-orb-1" />

      {/* Orb 2: Cyan / Blue glow top right */}
      <div className="absolute top-1/4 -right-32 w-[28rem] h-[28rem] rounded-full bg-cyan-500/15 blur-[120px] animate-orb-2" />

      {/* Orb 3: Indigo / Violet glow bottom center */}
      <div className="absolute bottom-10 left-1/3 w-[32rem] h-[32rem] rounded-full bg-indigo-500/15 blur-[130px] animate-orb-3" />

      {/* Orb 4: Rose / Pink accent glow */}
      <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-rose-500/10 blur-[100px] animate-orb-4" />

      {/* Subtle grid pattern for high-tech financial look */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }}
      />
    </div>
  );
};
