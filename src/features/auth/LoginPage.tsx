import React, { useState } from 'react';
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
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Sun,
  Moon,
  Star,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useSettingsStore } from '../../store/useSettingsStore';
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

  const { login, signup, loginAsDemo } = useAuthStore();
  const { settings, setTheme, showToast } = useSettingsStore();

  // Login Form
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
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

  const handleDemoLogin = async (type: 'alex' | 'sarah') => {
    try {
      const user = await loginAsDemo(type);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      showToast(`Logged in as demo user ${user.name}`, 'success');
      navigate(from, { replace: true });
    } catch (e) {
      console.error(e);
      showToast('Failed demo login', 'error');
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
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-300 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-teal-500/10 blur-[150px] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="relative z-10 flex items-center justify-between p-5 sm:px-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 font-extrabold text-xl">
            <DollarSign className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">
              FinTrack
            </span>
            <span className="ml-2 text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Pro
            </span>
          </div>
        </div>

        <button
          onClick={handleThemeToggle}
          title={`Switch to ${settings.theme === 'dark' ? 'light' : 'dark'} mode`}
          className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
        >
          {settings.theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-400" />
          )}
        </button>
      </header>

      {/* Main Grid Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          
          {/* Left Column: Visual Showcase & Brand Highlights */}
          <div className="lg:col-span-6 space-y-6 lg:pr-6 hidden lg:block">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fintech-Grade Personal Expense Tracking</span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Master your money with <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                intelligent analytics.
              </span>
            </h1>

            <p className="text-base text-slate-400 leading-relaxed max-w-lg">
              Track multi-currency cash flow, auto-categorize bank statements, schedule recurring subscriptions, and manage budget goals with total privacy.
            </p>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2.5">
                  <Zap className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white mb-0.5">Local-First Speed</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Fast IndexedDB persistence with zero latency and offline support.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-2.5">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white mb-0.5">Smart Charts</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Interactive cash flow areas, category donuts & monthly comparisons.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-2.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white mb-0.5">100% Private</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Your financial data is encrypted and stays entirely on your device.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-2.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white mb-0.5">Automated Rules</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Auto-process recurring subscriptions and scheduled salary inflows.
                </p>
              </div>
            </div>

            {/* Testimonial Quote */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900/80 to-slate-950/80 border border-slate-800 flex items-center gap-4 shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="User Avatar"
                className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500/40"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1 mb-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 italic truncate">
                  "FinTrack is easily the cleanest personal finance tool I've used this year."
                </p>
                <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                  Elena Rostova — Product Designer
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Card */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="rounded-3xl bg-slate-900/85 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl transition-all">
              
              {/* Mode Tabs */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800/80 mb-6">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                    mode === 'login'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-md shadow-emerald-500/10'
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
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-md shadow-emerald-500/10'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Form Title & Subtitle */}
              <div className="mb-6">
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  {mode === 'login' ? 'Welcome back to FinTrack' : 'Start your financial journey'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {mode === 'login'
                    ? 'Enter your credentials to access your personal dashboard'
                    : 'Create your local profile in seconds — no cloud backend required'}
                </p>
              </div>

              {/* LOGIN FORM */}
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
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
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
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                  >
                    <span>{isLoginSubmitting ? 'Signing In...' : 'Sign In to FinTrack'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* SIGNUP FORM */}
              {mode === 'signup' && (
                <form onSubmit={handleSignupSubmit(onSignup)} className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative rounded-xl border border-slate-800 bg-slate-950 focus-within:border-emerald-500 transition-colors">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Alex Morgan"
                        {...registerSignup('name')}
                        className="w-full bg-transparent pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none"
                      />
                    </div>
                    {signupErrors.name && (
                      <p className="text-xs text-rose-400 mt-1">{signupErrors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative rounded-xl border border-slate-800 bg-slate-950 focus-within:border-emerald-500 transition-colors">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        placeholder="alex@fintech.io"
                        {...registerSignup('email')}
                        className="w-full bg-transparent pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none"
                      />
                    </div>
                    {signupErrors.email && (
                      <p className="text-xs text-rose-400 mt-1">{signupErrors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Create Password
                    </label>
                    <div className="relative rounded-xl border border-slate-800 bg-slate-950 focus-within:border-emerald-500 transition-colors">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min. 6 characters"
                        {...registerSignup('password')}
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
                    {signupErrors.password && (
                      <p className="text-xs text-rose-400 mt-1">{signupErrors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative rounded-xl border border-slate-800 bg-slate-950 focus-within:border-emerald-500 transition-colors">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Repeat your password"
                        {...registerSignup('confirmPassword')}
                        className="w-full bg-transparent pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none"
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
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                  >
                    <span>{isSignupSubmitting ? 'Creating Account...' : 'Create Free Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* 1-Click Quick Demo Login Divider */}
              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <span className="relative px-3 bg-slate-900 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Or instant 1-click preview
                </span>
              </div>

              {/* Quick Demo Login Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('alex')}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold transition-all hover:border-emerald-500/40"
                >
                  <img
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&auto=format&fit=crop&q=80"
                    alt="Alex"
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span>Alex Morgan (Demo)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('sarah')}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold transition-all hover:border-emerald-500/40"
                >
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&auto=format&fit=crop&q=80"
                    alt="Sarah"
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span>Sarah Jenkins (Demo)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center p-4 text-xs text-slate-500 border-t border-slate-900">
        © {new Date().getFullYear()} FinTrack Pro — Modern Local-First Personal Financial Management.
      </footer>
    </div>
  );
};
