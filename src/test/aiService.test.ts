import { describe, it, expect } from 'vitest';
import {
  parseNaturalLanguageTransaction,
  generateFinancialAuditReport,
  generateCashFlowForecast,
  FinancialContext,
} from '../lib/aiService';
import { Category } from '../types';

const mockCategories: Category[] = [
  { id: 'cat-food', name: 'Food & Dining', icon: 'UtensilsCrossed', color: '#10B981', type: 'expense', isDefault: true },
  { id: 'cat-groceries', name: 'Groceries', icon: 'ShoppingCart', color: '#06B6D4', type: 'expense', isDefault: true },
  { id: 'cat-transport', name: 'Transportation', icon: 'Car', color: '#8B5CF6', type: 'expense', isDefault: true },
  { id: 'cat-housing', name: 'Housing & Rent', icon: 'Home', color: '#F59E0B', type: 'expense', isDefault: true },
  { id: 'cat-salary', name: 'Salary', icon: 'Briefcase', color: '#10B981', type: 'income', isDefault: true },
];

describe('AI Financial Intelligence Service', () => {
  describe('Natural Language Transaction Parsing', () => {
    it('correctly parses expense with INR symbol and grocery keyword', () => {
      const parsed = parseNaturalLanguageTransaction(
        'Paid ₹1,450 for groceries at Blinkit today',
        mockCategories,
        'INR'
      );

      expect(parsed).not.toBeNull();
      expect(parsed?.amount).toBe(1450);
      expect(parsed?.type).toBe('expense');
      expect(parsed?.categoryId).toBe('cat-groceries');
      expect(parsed?.categoryName).toBe('Groceries');
    });

    it('correctly parses income salary and sets income type', () => {
      const parsed = parseNaturalLanguageTransaction(
        'Credited salary ₹1,25,000 from company',
        mockCategories,
        'INR'
      );

      expect(parsed).not.toBeNull();
      expect(parsed?.amount).toBe(125000);
      expect(parsed?.type).toBe('income');
      expect(parsed?.categoryId).toBe('cat-salary');
    });

    it('correctly detects transport keyword and relative yesterday date', () => {
      const parsed = parseNaturalLanguageTransaction(
        'Spent 350 rs on Uber ride yesterday',
        mockCategories,
        'INR'
      );

      expect(parsed).not.toBeNull();
      expect(parsed?.amount).toBe(350);
      expect(parsed?.type).toBe('expense');
      expect(parsed?.categoryId).toBe('cat-transport');
    });

    it('returns null for unparseable input with no amount', () => {
      const parsed = parseNaturalLanguageTransaction('Hello how are you doing?', mockCategories, 'INR');
      expect(parsed).toBeNull();
    });
  });

  describe('Financial Audit & Scoring', () => {
    it('generates high score and Grade A for high savings rate and no overspending', () => {
      const mockContext: FinancialContext = {
        netBalance: 350000,
        monthlyIncome: 125000,
        monthlyExpense: 45000,
        savingsRate: 64,
        baseCurrency: 'INR',
        topExpenseCategories: [
          { category: mockCategories[0], amount: 25000, percentage: 55 },
          { category: mockCategories[1], amount: 15000, percentage: 33 },
        ],
        overBudgetCategories: [],
        upcomingRecurring: [],
        daysRemainingInMonth: 12,
        recentTransactions: [],
        categories: mockCategories,
      };

      const audit = generateFinancialAuditReport(mockContext);
      expect(audit.score).toBeGreaterThanOrEqual(80);
      expect(['A+', 'A']).toContain(audit.grade);
      expect(audit.strengths.length).toBeGreaterThan(0);
      expect(audit.projectedSavings).toBeGreaterThan(0);
    });

    it('flags deficit and reduces score when expenses exceed income', () => {
      const mockContext: FinancialContext = {
        netBalance: 10000,
        monthlyIncome: 50000,
        monthlyExpense: 65000,
        savingsRate: 0,
        baseCurrency: 'INR',
        topExpenseCategories: [
          { category: mockCategories[0], amount: 40000, percentage: 61 },
        ],
        overBudgetCategories: [
          { category: mockCategories[0], spent: 40000, limit: 25000, excess: 15000 },
        ],
        upcomingRecurring: [],
        daysRemainingInMonth: 15,
        recentTransactions: [],
        categories: mockCategories,
      };

      const audit = generateFinancialAuditReport(mockContext);
      expect(audit.score).toBeLessThan(60);
      expect(audit.risks.length).toBeGreaterThan(0);
    });
  });

  describe('Cash Flow Forecasting', () => {
    it('computes daily burn rate and projected month expense accurately', () => {
      const mockContext: FinancialContext = {
        netBalance: 100000,
        monthlyIncome: 100000,
        monthlyExpense: 30000,
        savingsRate: 70,
        baseCurrency: 'INR',
        topExpenseCategories: [],
        overBudgetCategories: [],
        upcomingRecurring: [],
        daysRemainingInMonth: 10,
        recentTransactions: [],
        categories: mockCategories,
      };

      const forecast = generateCashFlowForecast(mockContext);
      expect(forecast.dailyBurnRate).toBeGreaterThan(0);
      expect(forecast.totalProjectedMonthExpense).toBeGreaterThan(mockContext.monthlyExpense);
      expect(typeof forecast.isPositivePacing).toBe('boolean');
    });
  });
});
