import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';
import { AnimatedCounter } from './AnimatedCounter';

interface StatCardProps {
  title: string;
  value: string;
  rawNumericValue?: number;
  currencyPrefix?: string;
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
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  rawNumericValue,
  currencyPrefix,
  subtitle,
  trend,
  icon: Icon,
  iconColor = 'text-emerald-400',
  iconBgColor = 'bg-emerald-500/10 border-emerald-500/20',
  gradientBorder = false,
  className = '',
}) => {
  let isGood = true;

  if (trend && trend.value !== 0) {
    const isUp = trend.value > 0;
    const isPositiveGood = trend.isPositiveGood !== undefined ? trend.isPositiveGood : true;
    isGood = isPositiveGood ? isUp : !isUp;
  }

  return (
    <div
      className={clsx(
        'group relative overflow-hidden rounded-2xl p-5 sm:p-6 transition-all duration-300',
        'bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 shadow-xl shadow-slate-950/20',
        'hover:-translate-y-1 hover:border-slate-700/90 hover:shadow-2xl hover:shadow-emerald-500/5',
        gradientBorder && 'border-emerald-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-emerald-950/20',
        className
      )}
    >
      {/* Decorative ambient corner flare */}
      <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-500/5 blur-2xl group-hover:bg-emerald-500/15 transition-all duration-500 pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white group-hover:text-emerald-300 transition-colors">
            {rawNumericValue !== undefined ? (
              <AnimatedCounter
                value={rawNumericValue}
                prefix={currencyPrefix}
                decimals={rawNumericValue % 1 !== 0 ? 2 : 0}
              />
            ) : (
              value
            )}
          </h3>
        </div>
        <div className={clsx('p-3 rounded-2xl border shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm', iconBgColor, iconColor)}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {(trend || subtitle) && (
        <div className="relative z-10 mt-4 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={clsx(
                'inline-flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded-full border shadow-sm transition-transform duration-200 group-hover:scale-105',
                isGood
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
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
          <span className="text-slate-400 truncate font-medium">
            {trend?.label || subtitle}
          </span>
        </div>
      )}
    </div>
  );
};
