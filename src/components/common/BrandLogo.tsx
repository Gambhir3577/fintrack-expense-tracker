import React from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  clickable?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showBadge = true,
  clickable = true,
  className = '',
}) => {
  const iconDimensions = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  }[size];

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-3xl',
  }[size];

  const content = (
    <div className={`flex items-center gap-2.5 group ${className}`}>
      
      {/* 🔮 Creative Quantum Nexus Prism SVG Emblem */}
      <div className={`relative ${iconDimensions} shrink-0 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3`}>
        
        {/* Ambient Glow Aura */}
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 rounded-xl blur-md opacity-40 group-hover:opacity-75 transition-opacity duration-300" />
        
        {/* Crisp Vector Emblem */}
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative w-full h-full drop-shadow-lg"
        >
          <defs>
            <linearGradient id="ft-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="50%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>

            <linearGradient id="ft-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#0EA5E9" />
            </linearGradient>

            <linearGradient id="ft-inner" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.4" />
            </linearGradient>

            <filter id="ft-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Squircle Container */}
          <rect width="48" height="48" rx="13" fill="#090D16" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" />
          
          {/* Subtle Grid Accent */}
          <path d="M4 24H44M24 4V44" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

          {/* Isometric Diamond / Prism Facets */}
          {/* Top Left Facet */}
          <path
            d="M24 8L38 18L24 26L10 18Z"
            fill="url(#ft-grad-1)"
            opacity="0.95"
          />

          {/* Bottom Left Facet */}
          <path
            d="M10 18L24 26V40L10 32Z"
            fill="url(#ft-grad-2)"
            opacity="0.8"
          />

          {/* Bottom Right Facet */}
          <path
            d="M38 18L24 26V40L38 32Z"
            fill="url(#ft-grad-1)"
            opacity="0.65"
          />

          {/* Central Growth Wave / Dynamic Wealth Vector */}
          <path
            d="M16 23L22 19L27 24L33 16"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#ft-glow)"
          />

          {/* Glowing Peak Vertex Pulse */}
          <circle cx="33" cy="16" r="2.5" fill="#34D399" />
          <circle cx="33" cy="16" r="4.5" stroke="#34D399" strokeWidth="1" opacity="0.6" />
        </svg>
      </div>

      {/* Brand Typography & Badge */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-extrabold tracking-tight text-white ${titleSizes} font-heading`}>
            Fin<span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Track</span>
          </span>
          
          {showBadge && (
            <span className="text-[9px] uppercase font-mono font-black px-1.5 py-0.5 rounded-md bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-300 border border-emerald-500/40 tracking-wider shadow-sm">
              PRO
            </span>
          )}
        </div>
        
        {size === 'lg' || size === 'xl' ? (
          <span className="text-[11px] font-medium text-slate-400 tracking-tight mt-0.5">
            AI-Powered Wealth & Expense Intelligence
          </span>
        ) : null}
      </div>

    </div>
  );

  if (clickable) {
    return (
      <Link to="/" className="inline-block focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
};
