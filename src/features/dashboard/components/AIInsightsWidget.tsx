import React, { useMemo } from 'react';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Zap,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { useAIStore } from '../../../store/useAIStore';
import { useCurrencyStore } from '../../../store/currencyStore';
import { FinancialContext, generateFinancialAuditReport, generateCashFlowForecast } from '../../../lib/aiService';
import { formatCurrency, formatPercent } from '../../../utils/formatters';
import { Link } from 'react-router-dom';

interface AIInsightsWidgetProps {
  financialContext: FinancialContext;
}

export const AIInsightsWidget: React.FC<AIInsightsWidgetProps> = ({ financialContext }) => {
  const { toggleOpen } = useAIStore();
  const { baseCurrency } = useCurrencyStore();

  const audit = useMemo(() => generateFinancialAuditReport(financialContext), [financialContext]);
  const forecast = useMemo(() => generateCashFlowForecast(financialContext), [financialContext]);

  const gradeColors = {
    'A+': 'from-emerald-400 to-teal-500 text-emerald-950 border-emerald-400',
    A: 'from-emerald-500 to-green-500 text-emerald-950 border-emerald-400',
    B: 'from-blue-500 to-indigo-500 text-white border-blue-400',
    C: 'from-amber-500 to-orange-500 text-slate-950 border-amber-400',
    D: 'from-rose-500 to-red-600 text-white border-rose-400',
  };

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-400 p-[1px] flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Autonomous AI Financial Health
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                Real-time
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Predictive burn-rate analysis & anomaly detection
            </p>
          </div>
        </div>

        {/* Health Score Pill */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">Health Score</div>
            <div className="text-sm font-extrabold text-white">
              {audit.score}<span className="text-xs text-slate-500">/100</span>
            </div>
          </div>
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
              gradeColors[audit.grade]
            } flex items-center justify-center font-black text-lg shadow-md border`}
          >
            {audit.grade}
          </div>
        </div>
      </div>

      {/* Grid: 3 AI Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {/* 1. Health Status & Headline */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI Diagnosis</span>
            </div>
            <h4 className="text-xs font-bold text-white leading-snug">
              {audit.headline}
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
              {audit.strengths[0] || audit.summary}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Optimization Goal:</span>
            <span className="text-emerald-400 font-bold">+{formatCurrency(audit.projectedSavings, baseCurrency)}/mo</span>
          </div>
        </div>

        {/* 2. Cash Flow Forecast & Burn Rate */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              <span>Projected Month-End</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-base font-extrabold ${forecast.isPositivePacing ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(forecast.projectedNetSavings, baseCurrency)}
              </span>
              <span className="text-[10px] text-slate-500">net cushion</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Current burn rate: <strong className="text-slate-200">{formatCurrency(forecast.dailyBurnRate, baseCurrency)}/day</strong> with {financialContext.daysRemainingInMonth} days left.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Pacing status:</span>
            <span className={`font-semibold ${forecast.isPositivePacing ? 'text-emerald-400' : 'text-amber-400'}`}>
              {forecast.isPositivePacing ? 'On Track' : 'Caution'}
            </span>
          </div>
        </div>

        {/* 3. Anomalies & Recommendations */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1.5">
              {audit.risks.length > 0 ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>{audit.risks.length > 0 ? 'Active AI Alerts' : 'No Anomalies'}</span>
            </div>
            <p className="text-[11px] text-slate-300 line-clamp-2">
              {audit.risks[0] || audit.recommendations[0] || 'All spending indicators operating within normal parameters.'}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
            <button
              onClick={toggleOpen}
              className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              <span>Consult AI Copilot</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
