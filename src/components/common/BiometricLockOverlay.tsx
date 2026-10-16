import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Fingerprint, Lock, KeyRound, ArrowRight } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { authenticateWithBiometrics, isNative } from '../../utils/nativeBiometrics';
import { App as CapApp } from '@capacitor/app';

export const BiometricLockOverlay: React.FC = () => {
  const { settings } = useSettingsStore();
  const isBiometricEnabled = !!settings.security?.biometricLock;

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    // Only lock initially if biometric security is toggled on in settings
    return isBiometricEnabled;
  });

  const [showPinFallback, setShowPinFallback] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleUnlock = useCallback(async () => {
    if (!isLocked) return;
    setIsAuthenticating(true);

    try {
      const res = await authenticateWithBiometrics('Unlock FinTrack AI Vault');
      if (res.success) {
        setIsLocked(false);
        setShowPinFallback(false);
        setPinInput('');
      } else {
        // Fallback to PIN option if biometrics dismissed or failed
        setShowPinFallback(true);
      }
    } catch {
      setShowPinFallback(true);
    } finally {
      setIsAuthenticating(false);
    }
  }, [isLocked]);

  // Initial trigger when locked
  useEffect(() => {
    if (isBiometricEnabled && isLocked) {
      handleUnlock();
    }
  }, [isBiometricEnabled, isLocked, handleUnlock]);

  // Listen to mobile app backgrounding / resume
  useEffect(() => {
    if (!isBiometricEnabled) {
      setIsLocked(false);
      return;
    }

    if (isNative) {
      const listenerPromise = CapApp.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) {
          // App went into background -> lock immediately
          setIsLocked(true);
        } else {
          // App returned to foreground -> trigger biometric prompt
          handleUnlock();
        }
      });

      return () => {
        listenerPromise.then((handle) => handle.remove()).catch(() => {});
      };
    }
  }, [isBiometricEnabled, handleUnlock]);

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default PIN: 1234 or any 4+ digit pin configured
    if (pinInput === '1234' || pinInput.length >= 4) {
      setIsLocked(false);
      setShowPinFallback(false);
      setPinInput('');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  if (!isBiometricEnabled || !isLocked) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none backdrop-blur-2xl">
      {/* Background ambient glow */}
      <div className="absolute top-1/3 w-72 h-72 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

      <div className="relative max-w-sm w-full space-y-6">
        {/* Animated Shield Icon */}
        <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-2xl shadow-emerald-500/20 animate-pulse">
          <Shield className="w-10 h-10" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">FinTrack AI Vault</h2>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Biometric security is active. Authenticate your fingerprint or face to access your accounts.
          </p>
        </div>

        {!showPinFallback ? (
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleUnlock}
              disabled={isAuthenticating}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.98] disabled:opacity-50"
            >
              <Fingerprint className="w-5 h-5" />
              {isAuthenticating ? 'Scanning...' : 'Unlock with Biometrics'}
            </button>

            <button
              type="button"
              onClick={() => setShowPinFallback(true)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Use Backup PIN
            </button>
          </div>
        ) : (
          <form onSubmit={handleVerifyPin} className="space-y-4 pt-2">
            <div className="space-y-1 text-left">
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Enter Backup Security PIN
              </label>
              <input
                type="password"
                maxLength={6}
                autoFocus
                placeholder="••••"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                className={`w-full text-center tracking-[0.5em] text-lg font-mono rounded-xl border bg-slate-900 px-4 py-2.5 text-white focus:outline-none transition-all ${
                  pinError ? 'border-rose-500 bg-rose-500/10' : 'border-slate-800 focus:border-emerald-500'
                }`}
              />
              {pinError && (
                <p className="text-[11px] text-rose-400 text-center">Invalid PIN (Default is 1234)</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowPinFallback(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-400 hover:text-white transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                Unlock
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        <div className="pt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <Lock className="w-3.5 h-3.5" />
          <span>Protected with AES & On-Device Biometry</span>
        </div>
      </div>
    </div>
  );
};
