import React, { useMemo } from 'react';
import {
  Trophy,
  Flame,
  Sparkles,
  Award,
  ChevronRight,
  TrendingUp,
  Target,
  ShieldCheck,
} from 'lucide-react';
import { FinancialContext } from '../../../lib/aiService';
import { useCurrencyStore } from '../../../store/currencyStore';
import { formatCurrency, formatPercent } from '../../../utils/formatters';
import confetti from 'canvas-confetti';

interface FinancialMilestoneWidgetProps {
  financialContext: FinancialContext;
  transactionCount: number;
}

export const FinancialMilestoneWidget: React.FC<FinancialMilestoneWidgetProps> = ({
  financialContext,
  transactionCount,
}) => {
  const { baseCurrency } = useCurrencyStore();

  // Gamified Level Calculation
  const { level, title, progressPercent, nextTarget, streakDays } = useMemo(() => {
    let score = 0;
    // XP from transaction volume
    score += Math.min(40, transactionCount * 2);
    // XP from positive savings rate
    if (financialContext.savingsRate >= 30) score += 30;
    else if (financialContext.savingsRate >= 15) score += 20;
    else if (financialContext.savingsRate > 0) score += 10;
    // XP from positive net balance
    if (financialContext.netBalance > 0) score += 20;
    // XP from disciplined budget control
    if (financialContext.overBudgetCategories.length === 0) score += 10;

    let lvl = 1;
    let rankTitle = 'Budget Starter';
    let target = 'Log 15 transactions & maintain >20% savings';

    if (score >= 90) {
      lvl = 5;
      rankTitle = 'Financial Sovereign';
      target = 'Maintain >50% savings rate for 3 consecutive months';
    } else if (score >= 70) {
      lvl = 4;
      rankTitle = 'FinTrack Master';
      target = 'Build emergency fund covering >6 months';
    } else if (score >= 45) {
      lvl = 3;
      rankTitle = 'Wealth Builder';
      target = 'Keep all monthly category budgets under 85%';
    } else if (score >= 25) {
      lvl = 2;
      rankTitle = 'Cash Flow Saver';
      target = 'Reach positive net savings rate of >20%';
    }

    const prog = Math.min(100, Math.max(15, (score % 25) * 4 || 65));
    const streak = Math.max(3, Math.min(30, Math.floor(transactionCount / 2) + 5));

    return {
      level: lvl,
      title: rankTitle,
      progressPercent: prog,
      nextTarget: target,
      streakDays: streak,
    };
  }, [transactionCount, financialContext]);

  const handleCelebrate = () => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#10B981', '#06B6D4', '#6366F1', '#EC4899', '#F59E0B'],
    });
  };

  // SVG circular radius
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-indigo-950/30 border border-slate-800 p-5 shadow-xl backdrop-blur-xl group hover:border-indigo-500/30 transition-all duration-300">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-all" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Level Ring & Title */}
        <div className="flex items-center gap-4">
          {/* Animated SVG Progress Ring */}
          <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
              {/* Background circle */}
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="6"
                fill="transparent"
              />
              {/* Animated Progress circle */}
              <circle
                cx="40"
                cy="40"
                r={radius}
                stroke="url(#milestoneGradient)"
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="milestoneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="50%" stopColor="#06B6D4" />
                  <stop offset="100%" stopColor="#6366F1" />
                </linearGradient>
              </defs>
            </svg>

            {/* Center Trophy Icon & Level Number */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-400">LVL</span>
              <span className="text-xl font-black text-white leading-none">{level}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-extrabold text-white group-hover:text-indigo-300 transition-colors">
                {title}
              </h4>
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-extrabold uppercase">
                Tier {level}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Next Goal: <span className="text-slate-200">{nextTarget}</span>
            </p>

            {/* Level XP Bar */}
            <div className="flex items-center gap-2 mt-2">
              <div className="w-32 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-indigo-500 transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-slate-400 font-bold">{progressPercent}% XP</span>
            </div>
          </div>
        </div>

        {/* Right: Streak & Celebrate Trigger */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          {/* Tracking Streak Badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-bold shadow-sm">
            <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
            <div>
              <div className="text-[10px] text-amber-400/80 uppercase tracking-wider font-semibold">Streak</div>
              <div className="text-sm font-extrabold text-amber-300 leading-none">{streakDays} Days 🔥</div>
            </div>
          </div>

          <button
            onClick={handleCelebrate}
            title="Celebrate financial milestone"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-slate-950 font-extrabold text-xs shadow-md shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Celebrate</span>
          </button>
        </div>
      </div>
    </div>
  );
};
