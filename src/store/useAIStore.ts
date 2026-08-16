import { create } from 'zustand';
import { AIMessage, AIKeyConfig, FinancialContext, ParsedTransactionDraft, processAIQuery } from '../lib/aiService';
import { useTransactionStore } from './useTransactionStore';
import { useSettingsStore } from './useSettingsStore';
import confetti from 'canvas-confetti';

interface AIState {
  isOpen: boolean;
  messages: AIMessage[];
  isThinking: boolean;
  keyConfig: AIKeyConfig;

  setIsOpen: (isOpen: boolean) => void;
  toggleOpen: () => void;
  sendMessage: (content: string, context: FinancialContext) => Promise<void>;
  confirmTransactionDraft: (draft: ParsedTransactionDraft) => Promise<void>;
  clearChat: () => void;
  setKeyConfig: (config: Partial<AIKeyConfig>) => void;
}

const STORAGE_KEY_AI = 'fintrack_ai_config';

function getStoredAIConfig(): AIKeyConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_AI);
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return { provider: 'local', apiKey: '' };
}

const initialWelcomeMessage: AIMessage = {
  id: 'welcome-1',
  sender: 'assistant',
  content: `👋 Hi! I'm your **FinTrack AI Financial Intelligence Copilot**.\n\nI can analyze your spending, diagnose budget health, forecast cash flow, or record entries from simple phrases like: *"Paid ₹1,200 for groceries at Blinkit today"*.`,
  timestamp: new Date().toISOString(),
};

export const useAIStore = create<AIState>((set, get) => ({
  isOpen: false,
  messages: [initialWelcomeMessage],
  isThinking: false,
  keyConfig: getStoredAIConfig(),

  setIsOpen: (isOpen) => set({ isOpen }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

  sendMessage: async (content: string, context: FinancialContext) => {
    if (!content.trim()) return;

    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isThinking: true,
    }));

    try {
      const reply = await processAIQuery(content, context, get().keyConfig);
      set((state) => ({
        messages: [...state.messages, reply],
        isThinking: false,
      }));
    } catch (err) {
      console.error('AI processing error:', err);
      const errorMsg: AIMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        content: `I ran into an issue analyzing that request. Please try again!`,
        timestamp: new Date().toISOString(),
      };
      set((state) => ({
        messages: [...state.messages, errorMsg],
        isThinking: false,
      }));
    }
  },

  confirmTransactionDraft: async (draft: ParsedTransactionDraft) => {
    try {
      await useTransactionStore.getState().addTransaction({
        description: draft.description,
        amount: draft.amount,
        type: draft.type,
        categoryId: draft.categoryId,
        date: draft.date,
        isRecurring: false,
      });

      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
      useSettingsStore.getState().showToast(`Transaction recorded: ${draft.description}`, 'success');

      const successMsg: AIMessage = {
        id: `sys-${Date.now()}`,
        sender: 'assistant',
        content: `✅ Successfully recorded **${draft.description}** (${draft.type === 'income' ? '+' : '-'}${draft.amount}) to your local vault on ${draft.date}!`,
        timestamp: new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages, successMsg],
      }));
    } catch (e) {
      console.error(e);
      useSettingsStore.getState().showToast('Failed to add transaction', 'error');
    }
  },

  clearChat: () => {
    set({ messages: [initialWelcomeMessage] });
  },

  setKeyConfig: (updates) => {
    set((state) => {
      const updated = { ...state.keyConfig, ...updates };
      localStorage.setItem(STORAGE_KEY_AI, JSON.stringify(updated));
      return { keyConfig: updated };
    });
  },
}));
