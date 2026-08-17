import { describe, it, expect } from 'vitest';
import { useSplitBillStore } from '../store/useSplitBillStore';
import { SplitGroup } from '../types';

describe('Split the Bill Settlement Engine', () => {
  it('calculates equal settlement debts correctly with UPI link generation', () => {
    const mockGroup: SplitGroup = {
      id: 'split-test',
      title: 'Dinner at Social',
      totalAmount: 3000,
      currency: 'INR',
      paidByMemberId: 'mem-1',
      members: [
        { id: 'mem-1', name: 'Gambhir', upiId: 'gambhir@paytm' },
        { id: 'mem-2', name: 'Alex' },
        { id: 'mem-3', name: 'Rahul' },
      ],
      splits: [
        { memberId: 'mem-1', amount: 1000 },
        { memberId: 'mem-2', amount: 1000 },
        { memberId: 'mem-3', amount: 1000 },
      ],
      settled: false,
      date: '2026-08-17',
      createdAt: '2026-08-17T00:00:00Z',
      updatedAt: '2026-08-17T00:00:00Z',
    };

    const debts = useSplitBillStore.getState().calculateSettlements(mockGroup);

    expect(debts.length).toBe(2);
    expect(debts[0].from.name).toBe('Alex');
    expect(debts[0].to.name).toBe('Gambhir');
    expect(debts[0].amount).toBe(1000);
    expect(debts[0].upiLink).toContain('upi://pay');
    expect(debts[0].upiLink).toContain('pa=gambhir%40paytm');
  });
});
