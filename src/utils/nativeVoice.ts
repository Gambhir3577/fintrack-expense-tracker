import { useState, useEffect, useRef, useCallback } from 'react';

// Extend window for Web Speech API
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

/**
 * Checks if Speech Recognition is supported in the current environment
 * (Supported on Chrome, Edge, Safari, Opera, Android WebView)
 */
export function isSpeechSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Checks if Text-to-Speech (SpeechSynthesis) is supported
 */
export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance !== 'undefined';
}

/**
 * Clean and normalize spoken financial voice phrases
 * E.g. "paid five hundred rupees for lunch" -> "Paid ₹500 for lunch"
 */
export function cleanVoiceCommand(raw: string): string {
  if (!raw) return '';
  let text = raw.trim();

  // Normalize common spoken currency phrases
  text = text
    .replace(/\b(\d+)\s*(?:rupees|rupee|rs|inr)\b/gi, '₹$1')
    .replace(/\b(?:rupees|rupee|rs|inr)\s*(\d+)\b/gi, '₹$1')
    .replace(/\b(\d+)\s*(?:dollars|dollar|bucks|usd)\b/gi, '$$$1')
    .replace(/\b(?:dollars|dollar)\s*(\d+)\b/gi, '$$$1')
    .replace(/\b(\d+)\s*(?:euros|euro|eur)\b/gi, '€$1')
    .replace(/\b(?:euros|euro)\s*(\d+)\b/gi, '€$1');

  // Capitalize first letter
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Speak text out loud using browser SpeechSynthesis
 */
export function speakText(
  text: string,
  options?: {
    lang?: string;
    rate?: number;
    pitch?: number;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): void {
  if (!isSpeechSynthesisSupported()) return;

  try {
    window.speechSynthesis.cancel(); // Stop any ongoing speech

    // Clean markdown formatting before speaking (remove asterisks, hashes, backticks, emojis)
    const cleanText = text
      .replace(/[*#`_~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = options?.lang || 'en-US';
    utterance.rate = options?.rate || 1.0;
    utterance.pitch = options?.pitch || 1.0;

    if (options?.onEnd) {
      utterance.onend = options.onEnd;
    }
    if (options?.onError) {
      utterance.onerror = options.onError;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
}

/**
 * Stop any ongoing SpeechSynthesis playback
 */
export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }
}

export interface UseVoiceInputOptions {
  lang?: string;
  continuous?: boolean;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onFinalResult?: (transcript: string) => void;
  onError?: (errorMessage: string) => void;
}

export interface UseVoiceInputReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  error: string | null;
  isSpeaking: boolean;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  speak: (text: string, lang?: string) => void;
  cancelSpeaking: () => void;
  resetTranscript: () => void;
}

/**
 * React Hook for interactive speech recognition and text-to-speech
 */
export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const { lang = 'en-US', continuous = false, onTranscript, onFinalResult, onError } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isSupported = isSpeechSupported();

  // Keep callback refs fresh
  const onTranscriptRef = useRef(onTranscript);
  const onFinalResultRef = useRef(onFinalResult);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onFinalResultRef.current = onFinalResult;
    onErrorRef.current = onError;
  }, [onTranscript, onFinalResult, onError]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      const msg = 'Speech recognition is not supported in this browser. Please use Chrome, Edge, Safari, or the Android app.';
      setError(msg);
      onErrorRef.current?.(msg);
      return;
    }

    // Stop speaking if currently speaking
    stopSpeaking();
    setIsSpeaking(false);

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.lang = lang;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        setInterimTranscript('');
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const text = item[0]?.transcript || '';
          if (item.isFinal) {
            currentFinal += text;
          } else {
            currentInterim += text;
          }
        }

        if (currentInterim) {
          setInterimTranscript(currentInterim);
          onTranscriptRef.current?.(cleanVoiceCommand(currentInterim), false);
        }

        if (currentFinal) {
          const cleaned = cleanVoiceCommand(currentFinal);
          setTranscript((prev) => (prev ? `${prev} ${cleaned}` : cleaned));
          setInterimTranscript('');
          onTranscriptRef.current?.(cleaned, true);
          onFinalResultRef.current?.(cleaned);
        }
      };

      recognition.onerror = (event: any) => {
        let errorMsg = 'Voice recognition error';
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          errorMsg = 'Microphone permission denied. Please allow microphone access.';
        } else if (event.error === 'no-speech') {
          errorMsg = 'No speech detected. Please try again.';
        } else if (event.error === 'network') {
          errorMsg = 'Network error during speech recognition.';
        }
        setError(errorMsg);
        setIsListening(false);
        onErrorRef.current?.(errorMsg);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      const msg = err?.message || 'Failed to start microphone';
      setError(msg);
      setIsListening(false);
      onErrorRef.current?.(msg);
    }
  }, [isSupported, continuous, lang]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const speak = useCallback((text: string, customLang?: string) => {
    if (!isSpeechSynthesisSupported()) return;
    setIsSpeaking(true);
    speakText(text, {
      lang: customLang || lang,
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [lang]);

  const cancelSpeaking = useCallback(() => {
    stopSpeaking();
    setIsSpeaking(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
      stopSpeaking();
    };
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    isSpeaking,
    startListening,
    stopListening,
    toggleListening,
    speak,
    cancelSpeaking,
    resetTranscript,
  };
}
