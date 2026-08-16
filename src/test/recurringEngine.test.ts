import { describe, it, expect } from 'vitest';
import {
  getNextOccurrenceDate,
  generatePendingRecurringTransactions,
  computeNextScheduledDate,
} from '../utils/recurringEngine';
import { RecurrenceRule } from '../types';

describe('Recurring Transactions Engine', () => {
  it('should advance dates accurately per recurrence frequency', () => {
    expect(getNextOccurrenceDate('2026-08-01', 'daily')).toBe('2026-08-02');
    expect(getNextOccurrenceDate('2026-08-01', 'weekly')).toBe('2026-08-08');
    expect(getNextOccurrenceDate('2026-08-01', 'monthly')).toBe('2026-09-01');
    expect(getNextOccurrenceDate('2026-08-01', 'yearly')).toBe('2027-08-01');
  });

  it('should generate all past-due recurring instances up to target date', () => {
    const rules: RecurrenceRule[] = [
      {
        id: 'r-1',
        frequency: 'monthly',
        startDate: '2026-05-01',
        lastGeneratedDate: '2026-05-01',
        isActive: true,
        template: {
          description: 'Gym Subscription',
          amount: 50,
          type: 'expense',
          categoryId: 'cat-health',
        },
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-01T00:00:00Z',
      },
    ];

    // As of August 15, should generate instances for June 1, July 1, August 1 (3 instances)
    const { newTransactions, updatedRules } = generatePendingRecurringTransactions(rules, '2026-08-15');

    expect(newTransactions).toHaveLength(3);
    expect(newTransactions[0].date).toBe('2026-06-01');
    expect(newTransactions[1].date).toBe('2026-07-01');
    expect(newTransactions[2].date).toBe('2026-08-01');
    expect(newTransactions[0].amount).toBe(50);
    expect(newTransactions[0].isRecurring).toBe(true);

    expect(updatedRules).toHaveLength(1);
    expect(updatedRules[0].lastGeneratedDate).toBe('2026-08-01');
  });

  it('should respect inactive rule status and not generate transactions', () => {
    const rules: RecurrenceRule[] = [
      {
        id: 'r-paused',
        frequency: 'monthly',
        startDate: '2026-05-01',
        isActive: false, // Paused
        template: {
          description: 'Paused Subscription',
          amount: 20,
          type: 'expense',
          categoryId: 'cat-subscriptions',
        },
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-01T00:00:00Z',
      },
    ];

    const { newTransactions } = generatePendingRecurringTransactions(rules, '2026-08-15');
    expect(newTransactions).toHaveLength(0);
  });
});
