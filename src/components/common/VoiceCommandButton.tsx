import React, { useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useVoiceInput } from '../../utils/nativeVoice';
import { useSettingsStore } from '../../store/useSettingsStore';

interface VoiceCommandButtonProps {
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onFinalResult?: (transcript: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  title?: string;
}

export const VoiceCommandButton: React.FC<VoiceCommandButtonProps> = ({
  onTranscript,
  onFinalResult,
  onListeningChange,
  size = 'md',
  className = '',
  disabled = false,
  title = 'Voice Command (Hold or Tap to speak)',
}) => {
  const { showToast } = useSettingsStore();

  const {
    isListening,
    isSupported,
    error,
    toggleListening,
  } = useVoiceInput({
    onTranscript,
    onFinalResult: (res) => {
      onFinalResult?.(res);
    },
    onError: (err) => {
      showToast(err, 'error');
    },
  });

  useEffect(() => {
    onListeningChange?.(isListening);
  }, [isListening, onListeningChange]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSupported) {
      showToast('Voice command is not supported on this browser. Try Chrome, Edge, or the Android app.', 'warning');
      return;
    }

    toggleListening();
  };

  const sizeClasses = {
    sm: 'p-1.5 rounded-lg text-xs',
    md: 'p-2.5 rounded-xl text-sm',
    lg: 'p-3.5 rounded-2xl text-base',
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        title={isListening ? 'Listening... click to stop' : title}
        className={`relative transition-all active:scale-95 flex items-center justify-center shrink-0 ${
          isListening
            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 ring-2 ring-rose-400 ring-offset-2 ring-offset-slate-950 animate-pulse'
            : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 border border-slate-700/80 hover:border-emerald-500/40 shadow-sm'
        } ${sizeClasses} ${className} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        {/* Pulsing visual waves when active */}
        {isListening ? (
          <>
            <span className="absolute -inset-1 rounded-xl bg-rose-500/30 animate-ping pointer-events-none" />
            <MicOff className={`${iconSizes} stroke-[2.5] text-white`} />
          </>
        ) : (
          <Mic className={`${iconSizes} stroke-[2]`} />
        )}
      </button>

      {/* Floating Listening badge when active */}
      {isListening && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-rose-500 text-[10px] font-bold text-white whitespace-nowrap shadow-md pointer-events-none animate-bounce">
          Listening...
        </span>
      )}
    </div>
  );
};
