import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Target,
  Repeat,
  UploadCloud,
  Tags,
  Settings,
  Sparkles,
  X,
  LogOut,
} from 'lucide-react';
import clsx from 'clsx';
import { loadDemoData } from '../../db/seedData';
import { useTransactionStore } from '../../store/useTransactionStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useBudgetStore } from '../../store/useBudgetStore';
import { useRecurringStore } from '../../store/useRecurringStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useAuthStore } from '../../store/useAuthStore';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
}) => {
  const navigate = useNavigate();
  const { loadTransactions } = useTransactionStore();
  const { loadCategories } = useCategoryStore();
  const { loadBudgets } = useBudgetStore();
  const { loadRules } = useRecurringStore();
  const { showToast } = useSettingsStore();
  const { user, logout, isAuthenticated } = useAuthStore();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/transactions', label: 'Transactions', icon: Receipt },
    { to: '/budgets', label: 'Budget Goals', icon: Target },
    { to: '/recurring', label: 'Recurring Rules', icon: Repeat },
    { to: '/import', label: 'Import CSV', icon: UploadCloud },
    { to: '/categories', label: 'Categories', icon: Tags },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const handleLoadDemo = async () => {
    try {
      await loadDemoData();
      await Promise.all([
        loadTransactions(),
        loadCategories(),
        loadBudgets(),
        loadRules(),
      ]);
      showToast('Loaded 90 days of sample demo data!', 'success');
      onCloseMobile();
    } catch (err) {
      console.error(err);
      showToast('Failed to load demo data', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    onCloseMobile();
    navigate('/login');
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between p-4">
      <div className="space-y-6">
        {/* Mobile Header */}
        <div className="flex items-center justify-between pb-3 md:hidden border-b border-slate-800">
          <span className="font-extrabold text-white text-base">Navigation</span>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/20 shadow-sm shadow-emerald-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3 pt-4 border-t border-slate-800/80">
        {/* User Card */}
        {isAuthenticated && user && (
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-emerald-500/40 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shrink-0 text-xs">
                  {user.name.charAt(0)}
                </div>
              )}
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Bottom Demo Card */}
        <div className="p-3 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-center shadow-lg">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h5 className="text-[11px] font-bold text-white mb-0.5">Quick Demo Data</h5>
          <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
            Populate 90 days of realistic history and budgets.
          </p>
          <button
            onClick={handleLoadDemo}
            className="w-full py-1.5 px-2 text-[11px] font-semibold rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-all"
          >
            Load Demo Dataset
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 flex-col shrink-0 border-r border-slate-800/80 bg-slate-950/60 backdrop-blur-md min-h-[calc(100vh-4rem)]">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] bg-slate-950 border-r border-slate-800 h-full shadow-2xl animate-fade-in z-10">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
