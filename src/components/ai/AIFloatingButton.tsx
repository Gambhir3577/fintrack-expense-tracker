import React from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { useAIStore } from '../../store/useAIStore';

export const AIFloatingButton: React.FC = () => {
  const { isOpen, toggleOpen } = useAIStore();

  if (isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 animate-fade-in group">
      <button
        onClick={toggleOpen}
        title="Open AI Financial Copilot"
        className="relative flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all duration-200"
      >
        {/* Glowing aura ping */}
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border-2 border-slate-950" />
        </span>

        <div className="p-1 rounded-lg bg-slate-950/20">
          <Bot className="w-5 h-5 stroke-[2.2]" />
        </div>

        <span className="tracking-tight hidden sm:inline">AI Copilot</span>
        <Sparkles className="w-3.5 h-3.5 opacity-80" />
      </button>
    </div>
  );
};
