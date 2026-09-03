import React from 'react';

interface AIWaveformProps {
  isActive?: boolean;
  className?: string;
}

export const AIWaveform: React.FC<AIWaveformProps> = ({ isActive = true, className = '' }) => {
  return (
    <div className={`flex items-center gap-[3px] h-6 px-1 ${className}`}>
      <span className={`w-1 rounded-full bg-gradient-to-t from-indigo-500 to-emerald-400 ${isActive ? 'wave-bar-1' : 'h-1.5 opacity-40'}`} />
      <span className={`w-1 rounded-full bg-gradient-to-t from-indigo-500 to-cyan-400 ${isActive ? 'wave-bar-2' : 'h-2.5 opacity-50'}`} />
      <span className={`w-1 rounded-full bg-gradient-to-t from-indigo-500 to-emerald-300 ${isActive ? 'wave-bar-3' : 'h-4 opacity-70'}`} />
      <span className={`w-1 rounded-full bg-gradient-to-t from-indigo-500 to-cyan-400 ${isActive ? 'wave-bar-4' : 'h-2.5 opacity-50'}`} />
      <span className={`w-1 rounded-full bg-gradient-to-t from-indigo-500 to-emerald-400 ${isActive ? 'wave-bar-5' : 'h-1.5 opacity-40'}`} />
    </div>
  );
};
