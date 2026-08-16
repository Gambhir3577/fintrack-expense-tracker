import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: {
    value: number; // e.g. 12.5%
    label?: string; // e.g. 'vs last month'
    isPositiveGood?: boolean; // For expenses, down is good!
  };
  icon: LucideIcon;
  iconColor?: string; // Hex or tailwind class
  iconBgColor?: string;
  gradientBorder?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  iconColor = 'text-emerald-400',
  iconBgColor = 'bg-emerald-500/10 border-emerald-500/20',
  gradientBorder = false,
}) => {
  let trendType: 'positive' | 'negative' | 'neutral' = 'neutral';
  let isGood = true;

  if (trend && trend.value !== 0) {
    trendType = trend.value > 0 ? 'positive' : 'negative';
    const isUp = trend.value > 0;
    const isPositiveGood = trend.isPositiveGood !== undefined ? trend.isPositiveGood : true;
    isGood = isPositiveGood ? isUp : !isUp;
  }

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:translate-y-[-2px]',
        'bg-slate-900/70 dark:bg-slate-900/80 border border-slate-800/80 shadow-lg shadow-slate-950/20 hover:border-slate-700/80',
        gradientBorder && 'before:absolute before:inset-0 before:p-[1px] before:rounded-2xl before:bg-gradient-to-br before:from-emerald-500/30 before:to-transparent before:-z-10'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{value}</h3>
        </div>
        <div className={clsx('p-3 rounded-xl border shrink-0', iconBgColor, iconColor)}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {(trend || subtitle) && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={clsx(
                'inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full border',
                isGood
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              )}
            >
              {trend.value > 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : trend.value < 0 ? (
                <TrendingDown className="w-3.5 h-3.5" />
              ) : (
                <Minus className="w-3.5 h-3.5" />
              )}
              {Math.abs(trend.value).toFixed(1)}%
            </span>
          )}
          <span className="text-slate-400 truncate">
            {trend?.label || subtitle}
          </span>
        </div>
      )}
    </div>
  );
};
