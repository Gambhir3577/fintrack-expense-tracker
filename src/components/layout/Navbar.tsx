import React, { useState } from 'react';
import { Plus, Sun, Moon, DollarSign, Menu, LogOut, User, RefreshCw } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useCurrencyStore } from '../../store/currencyStore';
import { CURRENCY_CONFIGS } from '../../utils/constants';
import { SupportedCurrency } from '../../types';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onOpenAddModal: () => void;
  onToggleMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAddModal,
  onToggleMobileMenu,
}) => {
  const navigate = useNavigate();
  const { settings, setTheme } = useSettingsStore();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { baseCurrency, setBaseCurrency, isLoading: isCurrencyLoading, isFallback } = useCurrencyStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleThemeToggle = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-4 sm:px-6">
      {/* Left Branding / Mobile Hamburger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 md:hidden focus:outline-none"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20 font-extrabold text-lg">
            <DollarSign className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">
              FinTrack
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Pro
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Currency Selector */}
        <div className="relative flex items-center">
          <select
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value as SupportedCurrency)}
            className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/60 rounded-xl pl-2.5 pr-7 py-1.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer appearance-none"
          >
            {Object.values(CURRENCY_CONFIGS).map((curr) => (
              <option key={curr.code} value={curr.code}>
                {curr.code} ({curr.symbol})
              </option>
            ))}
          </select>
          {/* Live Status indicator */}
          <div className="absolute right-2 pointer-events-none flex items-center">
            {isCurrencyLoading ? (
              <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />
            ) : isFallback ? (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Using cached/fallback rates" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Live exchange rates active" />
            )}
          </div>
        </div>

        {/* Theme Switcher */}
        <button
          onClick={handleThemeToggle}
          title={`Switch to ${settings.theme === 'dark' ? 'light' : 'dark'} mode`}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors focus:outline-none"
        >
          {settings.theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-400" />
          )}
        </button>

        {/* Add Transaction Action */}
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden xs:inline">New Entry</span>
        </button>

        {/* User Profile Pill / Menu */}
        {isAuthenticated && user && (
          <div className="relative ml-1">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/60 transition-all focus:outline-none"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-6 h-6 rounded-full object-cover border border-emerald-500/40"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">
                  {user.name.charAt(0)}
                </div>
              )}
              <span className="hidden sm:inline text-xs font-semibold text-slate-200 truncate max-w-[100px]">
                {user.name}
              </span>
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900/95 border border-slate-800 p-2 shadow-2xl backdrop-blur-xl z-50 animate-fade-in text-xs space-y-1">
                  <div className="p-2.5 border-b border-slate-800 mb-1">
                    <p className="font-bold text-white truncate">{user.name}</p>
                    <p className="text-slate-400 text-[11px] truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <User className="w-4 h-4 text-emerald-400" />
                    <span>Account Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
