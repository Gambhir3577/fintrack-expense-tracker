// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isSpeechSupported,
  isSpeechSynthesisSupported,
  cleanVoiceCommand,
  speakText,
  stopSpeaking,
} from '../utils/nativeVoice';

describe('nativeVoice utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('cleanVoiceCommand', () => {
    it('returns empty string for empty input', () => {
      expect(cleanVoiceCommand('')).toBe('');
      expect(cleanVoiceCommand('   ')).toBe('');
    });

    it('capitalizes the first character', () => {
      expect(cleanVoiceCommand('paid for lunch')).toBe('Paid for lunch');
    });

    it('normalizes rupees suffix to ₹ currency symbol', () => {
      expect(cleanVoiceCommand('paid 500 rupees for groceries')).toBe('Paid ₹500 for groceries');
      expect(cleanVoiceCommand('paid 1250 rs for dinner')).toBe('Paid ₹1250 for dinner');
      expect(cleanVoiceCommand('sent 300 inr to rahul')).toBe('Sent ₹300 to rahul');
    });

    it('normalizes rupees prefix to ₹ currency symbol', () => {
      expect(cleanVoiceCommand('spent rupees 750 at starbucks')).toBe('Spent ₹750 at starbucks');
      expect(cleanVoiceCommand('rs 450 for coffee')).toBe('₹450 for coffee');
    });

    it('normalizes dollar and euro mentions', () => {
      expect(cleanVoiceCommand('paid 40 dollars for subscription')).toBe('Paid $40 for subscription');
      expect(cleanVoiceCommand('bought coffee for 15 euros')).toBe('Bought coffee for €15');
    });
  });

  describe('isSpeechSupported & isSpeechSynthesisSupported', () => {
    it('returns a boolean value without crashing in test environment', () => {
      expect(typeof isSpeechSupported()).toBe('boolean');
      expect(typeof isSpeechSynthesisSupported()).toBe('boolean');
    });
  });

  describe('speakText and stopSpeaking', () => {
    it('executes stopSpeaking without throwing an error', () => {
      expect(() => stopSpeaking()).not.toThrow();
    });

    it('safely handles speakText when speechSynthesis is mocked', () => {
      const mockCancel = vi.fn();
      const mockSpeak = vi.fn();

      const originalSynthesis = window.speechSynthesis;
      const originalUtterance = (window as any).SpeechSynthesisUtterance;

      Object.defineProperty(window, 'speechSynthesis', {
        value: {
          cancel: mockCancel,
          speak: mockSpeak,
        },
        writable: true,
        configurable: true,
      });

      Object.defineProperty(window, 'SpeechSynthesisUtterance', {
        value: class {
          text: string;
          lang = 'en-US';
          rate = 1;
          pitch = 1;
          constructor(text: string) {
            this.text = text;
          }
        },
        writable: true,
        configurable: true,
      });

      speakText('**Hello world** _forecast_');
      expect(mockCancel).toHaveBeenCalled();
      expect(mockSpeak).toHaveBeenCalled();

      // Restore
      Object.defineProperty(window, 'speechSynthesis', {
        value: originalSynthesis,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, 'SpeechSynthesisUtterance', {
        value: originalUtterance,
        writable: true,
        configurable: true,
      });
    });
  });
});
