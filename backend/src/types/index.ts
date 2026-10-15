import { Request } from 'express';

export interface AuthUserPayload {
  id: string;
  email: string;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

export interface SyncPushPayload {
  transactions?: Array<{
    id: string;
    date: string;
    description: string;
    amount: number | string;
    type: string;
    categoryId: string;
    isRecurring: boolean;
    recurringRuleId?: string | null;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
  }>;
  categories?: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    type: string;
    budgetLimit?: number | string | null;
    isDefault?: boolean;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
  }>;
  budgets?: Array<{
    id: string;
    categoryId: string;
    monthlyLimit: number | string;
    period: string;
    notifyThreshold?: number | null;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
  }>;
  recurringRules?: Array<{
    id: string;
    frequency: string;
    startDate: string;
    endDate?: string | null;
    lastGeneratedDate?: string | null;
    isActive: boolean;
    template: any;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
  }>;
  savingsGoals?: Array<{
    id: string;
    title: string;
    targetAmount: number | string;
    currentAmount: number | string;
    targetDate: string;
    icon: string;
    color: string;
    categoryId?: string | null;
    isCompleted: boolean;
    notes?: string | null;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
  }>;
  splitGroups?: Array<{
    id: string;
    title: string;
    totalAmount: number | string;
    currency?: string;
    paidByMemberId: string;
    members: any;
    splits: any;
    settled: boolean;
    date: string;
    notes?: string | null;
    categoryId?: string | null;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
  }>;
  settings?: {
    currency?: string;
    theme?: string;
    dateFormat?: string;
    firstDayOfWeek?: number;
    hasCompletedOnboarding?: boolean;
    updatedAt?: string;
  };
}
