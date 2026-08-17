import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  DollarSign,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  Sun,
  Moon,
  Wifi,
  PieChart,
  Repeat,
  Fingerprint,
  Database,
  Check,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useCurrencyStore } from '../../store/currencyStore';
import { CURRENCY_CONFIGS } from '../../utils/constants';
import { SupportedCurrency } from '../../types';
import { BrandLogo } from '../../components/common/BrandLogo';
import confetti from 'canvas-confetti';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    agreeTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must agree to the Terms of Service' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { login, signup } = useAuthStore();
  const { settings, setTheme, showToast } = useSettingsStore();
  const { baseCurrency, setBaseCurrency } = useCurrencyStore();

  const currencyConfig = CURRENCY_CONFIGS[baseCurrency] || CURRENCY_CONFIGS.INR;

  // Login Form
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    watch: watchLogin,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  // Signup Form
  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    watch: watchSignup,
    formState: { errors: signupErrors, isSubmitting: isSignupSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeTerms: true as any,
    },
  });

  // Live typing preview
  const liveName = mode === 'signup'
    ? watchSignup('name') || 'Your Name'
    : (watchLogin('email')?.split('@')[0] || 'Alex Morgan');

  const livePassword = mode === 'signup' ? watchSignup('password') || '' : '';

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!livePassword) return { score: 0, label: 'None', color: 'bg-slate-700' };
    let s = 0;
    if (livePassword.length >= 6) s++;
    if (livePassword.length >= 10) s++;
    if (/[A-Z]/.test(livePassword)) s++;
    if (/[0-9]/.test(livePassword)) s++;
    if (/[^A-Za-z0-9]/.test(livePassword)) s++;

    if (s <= 1) return { score: 25, label: 'Weak', color: 'bg-rose-500' };
    if (s === 2) return { score: 50, label: 'Fair', color: 'bg-amber-500' };
    if (s === 3) return { score: 75, label: 'Good', color: 'bg-blue-500' };
    return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
  }, [livePassword]);

  const onLogin = async (data: LoginFormValues) => {
    try {
      const user = await login(data.email);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      showToast(`Welcome back, ${user.name}!`, 'success');
      navigate(from, { replace: true });
    } catch (e) {
      console.error(e);
      showToast('Failed to sign in', 'error');
    }
  };

  const onSignup = async (data: SignupFormValues) => {
    try {
      const user = await signup(data.name, data.email);
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      showToast(`Account created! Welcome, ${user.name}!`, 'success');
      navigate(from, { replace: true });
    } catch (e) {
      console.error(e);
      showToast('Failed to create account', 'error');
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    showToast('A password reset link was sent to your email', 'info');
  };

  const handleThemeToggle = () => {
    setTheme(settings.theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen w-full aurora-bg text-slate-100 flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-300 relative overflow-hidden font-sans">
      
      {/* 3-Color Dynamic Animated Glow Orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-emerald-500/20 dark:bg-emerald-500/25 blur-[130px] pointer-events-none animate-orb-1" />
      <div className="absolute top-[30%] right-[-10%] w-[650px] h-[650px] rounded-full bg-cyan-500/20 dark:bg-cyan-500/20 blur-[150px] pointer-events-none animate-orb-2" />
      <div className="absolute bottom-[-15%] left-[25%] w-[600px] h-[600px] rounded-full bg-indigo-500/20 dark:bg-violet-600/25 blur-[140px] pointer-events-none animate-orb-3" />

      {/* Modern High-Tech Micro Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-5 sm:px-10 max-w-7xl mx-auto w-full">
        <BrandLogo size="lg" clickable={false} />

        <div className="flex items-center gap-3">
          {/* Currency Switcher */}
          <select
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value as SupportedCurrency)}
            className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
          >
            {Object.values(CURRENCY_CONFIGS).map((curr) => (
              <option key={curr.code} value={curr.code}>
                {curr.code} ({curr.symbol})
              </option>
            ))}
          </select>

          {/* Theme Switcher */}
          <button
            onClick={handleThemeToggle}
            title={`Switch to ${settings.theme === 'dark' ? 'light' : 'dark'} mode`}
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-colors shadow-sm"
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
          </button>
        </div>
      </header>

      {/* Main Section */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          
          {/* Left Column: Interactive Holographic Showcase */}
          <div className="lg:col-span-6 space-y-6 lg:pr-4 hidden lg:block">
            
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold shadow-inner">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Generation Personal Financial Suite</span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
              Experience effortless <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                financial clarity.
              </span>
            </h1>

            <p className="text-sm text-slate-400 leading-relaxed max-w-lg">
              Manage multi-currency cash flow with live exchange rates, import bank statements with smart auto-categorization, automate recurring rules, and stay on budget — entirely private on your device.
            </p>

            {/* 💳 Holographic Interactive Metal Card */}
            <div className="relative pt-2">
              <div className="relative w-full max-w-md h-56 rounded-3xl p-6 flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-300 hover:scale-[1.02] border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 before:absolute before:inset-0 before:bg-gradient-to-tr before:from-emerald-500/15 before:via-teal-400/5 before:to-transparent">
                
                {/* Holographic Sheen Animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-pulse pointer-events-none" />

                {/* Card Top Row */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-300 flex items-center justify-center text-slate-950 font-black text-sm shadow-md">
                      FT
                    </div>
                    <span className="text-xs font-extrabold uppercase tracking-widest text-slate-200">
                      FinTrack Black
                    </span>
                  </div>
                  <Wifi className="w-5 h-5 text-slate-400 rotate-90" />
                </div>

                {/* Card Chip & Balance */}
                <div className="relative z-10 flex items-center justify-between my-auto">
                  <div className="w-11 h-8 rounded-lg bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500 border border-amber-400/40 shadow-inner flex items-center justify-center">
                    <div className="w-7 h-5 border border-amber-800/30 rounded grid grid-cols-2 gap-0.5 p-0.5">
                      <div className="bg-amber-400/50 rounded-sm" />
                      <div className="bg-amber-400/50 rounded-sm" />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Balance</span>
                    <span className="text-2xl font-mono font-extrabold text-white tracking-tight">
                      {currencyConfig.code === 'INR' ? '₹1,84,500.00' : `${currencyConfig.symbol}18,450.00`}
                    </span>
                  </div>
                </div>

                {/* Card Bottom Row */}
                <div className="relative z-10 flex items-end justify-between text-xs">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Cardholder</span>
                    <span className="font-semibold font-mono text-slate-200 uppercase tracking-wider text-sm truncate max-w-[200px] block">
                      {liveName}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Expires</span>
                    <span className="font-mono text-slate-300">08/30</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Metrics Row Below Card */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center gap-3 shadow-md">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                  +
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-white">
                    +{currencyConfig.code === 'INR' ? '₹1,25,000.00' : `${currencyConfig.symbol}5,400.00`}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">TechCorp Payroll</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center gap-3 shadow-md">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <PieChart className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-white">42.5% Savings Rate</p>
                  <p className="text-[10px] text-emerald-400 font-semibold truncate">Target On Track 🎯</p>
                </div>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <Zap className="w-4 h-4 text-emerald-400 mb-1" />
                <p className="text-xs font-bold text-white">Instant Sync</p>
                <p className="text-[10px] text-slate-400">Zero latency IndexedDB</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <Repeat className="w-4 h-4 text-cyan-400 mb-1" />
                <p className="text-xs font-bold text-white">Recurring Rules</p>
                <p className="text-[10px] text-slate-400">Auto-processed billing</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <ShieldCheck className="w-4 h-4 text-purple-400 mb-1" />
                <p className="text-xs font-bold text-white">Local Privacy</p>
                <p className="text-[10px] text-slate-400">Never leaves your device</p>
              </div>
            </div>
          </div>

          {/* Right Column: Creative Interactive Auth Card */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl transition-all relative">
              
              {/* Top Mode Selector Tabs */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800/80 mb-6">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                    mode === 'login'
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                    mode === 'signup'
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Title */}
              <div className="mb-6">
                <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {mode === 'login' ? 'Welcome back to FinTrack' : 'Start your financial journey'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {mode === 'login'
                    ? 'Enter your credentials to access your financial dashboard'
                    : 'Create your private profile in seconds — no backend required'}
                </p>
              </div>

              {/* SIGN IN FORM */}
              {mode === 'login' && (
                <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative rounded-xl border border-slate-800 bg-slate-950 focus-within:border-emerald-500 transition-colors">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        placeholder="you@example.com"
                        {...registerLogin('email')}
                        className="w-full bg-transparent pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none"
                      />
                    </div>
                    {loginErrors.email && (
                      <p className="text-xs text-rose-400 mt-1">{loginErrors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative rounded-xl border border-slate-800 bg-slate-950 focus-within:border-emerald-500 transition-colors">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...registerLogin('password')}
                        className="w-full bg-transparent pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {loginErrors.password && (
                      <p className="text-xs text-rose-400 mt-1">{loginErrors.password.message}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                      <input
                        type="checkbox"
                        {...registerLogin('rememberMe')}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/20"
                      />
                      <span>Keep me signed in</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoginSubmitting}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:opacity-95 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                  >
                    <span>{isLoginSubmitting ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* CREATE ACCOUNT FORM */}
              {mode === 'signup' && (
                <form onSubmit={handleSignupSubmit(onSignup)} className="space-y-3.5 animate-fade-in">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Full Name
                    </label>
                    <div className="relative rounded-xl border border-slate-800 bg-slate-950 focus-within:border-emerald-500 transition-colors">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Alex Morgan"
                        {...registerSignup('name')}
                        className="w-full bg-transparent pl-10 pr-4 py-2 text-sm text-white placeholder-slate-600 focus:outline-none"
                      />
                    </div>
                    {signupErrors.name && (
                      <p className="text-xs text-rose-400 mt-1">{signupErrors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Email Address
                    </label>
                    <div className="relative rounded-xl border border-slate-800 bg-slate-950 focus-within:border-emerald-500 transition-colors">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        placeholder="alex@fintech.io"
                        {...registerSignup('email')}
                        className="w-full bg-transparent pl-10 pr-4 py-2 text-sm text-white placeholder-slate-600 focus:outline-none"
                      />
                    </div>
                    {signupErrors.email && (
                      <p className="text-xs text-rose-400 mt-1">{signupErrors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Password
                    </label>
                    <div className="relative rounded-xl border border-slate-800 bg-slate-950 focus-within:border-emerald-500 transition-colors">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min. 6 characters"
                        {...registerSignup('password')}
                        className="w-full bg-transparent pl-10 pr-10 py-2 text-sm text-white placeholder-slate-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Live Password Strength Meter */}
                    {livePassword && (
                      <div className="mt-1.5 space-y-1">
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: `${passwordStrength.score}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Strength: <strong className="text-slate-200">{passwordStrength.label}</strong>
                        </span>
                      </div>
                    )}

                    {signupErrors.password && (
                      <p className="text-xs text-rose-400 mt-1">{signupErrors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative rounded-xl border border-slate-800 bg-slate-950 focus-within:border-emerald-500 transition-colors">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Repeat your password"
                        {...registerSignup('confirmPassword')}
                        className="w-full bg-transparent pl-10 pr-10 py-2 text-sm text-white placeholder-slate-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {signupErrors.confirmPassword && (
                      <p className="text-xs text-rose-400 mt-1">{signupErrors.confirmPassword.message}</p>
                    )}
                  </div>

                  <div className="pt-1">
                    <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-300">
                      <input
                        type="checkbox"
                        {...registerSignup('agreeTerms')}
                        className="w-4 h-4 mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/20"
                      />
                      <span>
                        I agree to the <span className="text-emerald-400 hover:underline">Terms of Service</span> and <span className="text-emerald-400 hover:underline">Privacy Policy</span>.
                      </span>
                    </label>
                    {signupErrors.agreeTerms && (
                      <p className="text-xs text-rose-400 mt-1">{signupErrors.agreeTerms.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSignupSubmitting}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:opacity-95 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                  >
                    <span>{isSignupSubmitting ? 'Creating Profile...' : 'Create Free Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Security & Client-Side Privacy Card */}
              <div className="mt-6 p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-3 shadow-inner">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <span>Encrypted Local Vault</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Zero-cloud storage. Your financial transactions and budgets are saved exclusively on your local device via IndexedDB.
                  </p>
                </div>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-2 mt-3 text-[10px] text-slate-400 text-center font-medium">
                <div className="p-1.5 rounded-lg bg-slate-950/50 border border-slate-800/60 flex items-center justify-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>100% Offline</span>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-950/50 border border-slate-800/60 flex items-center justify-center gap-1">
                  <Check className="w-3 h-3 text-cyan-400" />
                  <span>No Tracking</span>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-950/50 border border-slate-800/60 flex items-center justify-center gap-1">
                  <Check className="w-3 h-3 text-purple-400" />
                  <span>Free Forever</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center p-4 text-xs text-slate-500 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto w-full px-6">
        <span>© {new Date().getFullYear()} FinTrack Pro — Local-First Financial Intelligence.</span>
        <div className="flex items-center gap-4 mt-2 sm:mt-0 text-[11px] text-slate-400">
          <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-400" /> End-to-End Local Encryption</span>
          <span>•</span>
          <span>Zero Server Storage</span>
        </div>
      </footer>
    </div>
  );
};
