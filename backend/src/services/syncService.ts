import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { SyncPushPayload } from '../types/index.js';

export class SyncService {
  async pullChanges(userId: string, since?: string) {
    const sinceDate = since ? new Date(since) : new Date(0);

    const [
      transactions,
      categories,
      budgets,
      recurringRules,
      savingsGoals,
      splitGroups,
      settingRecord,
    ] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId,
          updatedAt: { gt: sinceDate },
        },
      }),
      prisma.category.findMany({
        where: {
          userId,
          updatedAt: { gt: sinceDate },
        },
      }),
      prisma.budgetGoal.findMany({
        where: {
          userId,
          updatedAt: { gt: sinceDate },
        },
      }),
      prisma.recurrenceRule.findMany({
        where: {
          userId,
          updatedAt: { gt: sinceDate },
        },
      }),
      prisma.savingsGoal.findMany({
        where: {
          userId,
          updatedAt: { gt: sinceDate },
        },
      }),
      prisma.splitGroup.findMany({
        where: {
          userId,
          updatedAt: { gt: sinceDate },
        },
      }),
      prisma.userSetting.findFirst({
        where: {
          userId,
          updatedAt: { gt: sinceDate },
        },
      }),
    ]);

    // Format numbers cleanly for frontend
    const serializedTransactions = transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      deletedAt: t.deletedAt ? t.deletedAt.toISOString() : null,
    }));

    const serializedCategories = categories.map((c) => ({
      ...c,
      budgetLimit: c.budgetLimit ? Number(c.budgetLimit) : undefined,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      deletedAt: c.deletedAt ? c.deletedAt.toISOString() : null,
    }));

    const serializedBudgets = budgets.map((b) => ({
      ...b,
      monthlyLimit: Number(b.monthlyLimit),
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
      deletedAt: b.deletedAt ? b.deletedAt.toISOString() : null,
    }));

    const serializedRecurringRules = recurringRules.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      deletedAt: r.deletedAt ? r.deletedAt.toISOString() : null,
    }));

    const serializedSavingsGoals = savingsGoals.map((g) => ({
      ...g,
      targetAmount: Number(g.targetAmount),
      currentAmount: Number(g.currentAmount),
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
      deletedAt: g.deletedAt ? g.deletedAt.toISOString() : null,
    }));

    const serializedSplitGroups = splitGroups.map((s) => ({
      ...s,
      totalAmount: Number(s.totalAmount),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      deletedAt: s.deletedAt ? s.deletedAt.toISOString() : null,
    }));

    const serializedSettings = settingRecord
      ? {
          currency: settingRecord.currency,
          theme: settingRecord.theme,
          dateFormat: settingRecord.dateFormat,
          firstDayOfWeek: settingRecord.firstDayOfWeek,
          hasCompletedOnboarding: settingRecord.hasCompletedOnboarding,
          updatedAt: settingRecord.updatedAt.toISOString(),
        }
      : null;

    return {
      timestamp: new Date().toISOString(),
      changes: {
        transactions: serializedTransactions,
        categories: serializedCategories,
        budgets: serializedBudgets,
        recurringRules: serializedRecurringRules,
        savingsGoals: serializedSavingsGoals,
        splitGroups: serializedSplitGroups,
        settings: serializedSettings,
      },
    };
  }

  async pushChanges(userId: string, payload: SyncPushPayload) {
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      // 1. Transactions
      if (payload.transactions && payload.transactions.length > 0) {
        for (const item of payload.transactions) {
          const itemUpdatedAt = item.updatedAt ? new Date(item.updatedAt) : now;
          const itemDeletedAt = item.deletedAt ? new Date(item.deletedAt) : null;
          const existing = await tx.transaction.findFirst({
            where: { id: item.id, userId },
          });

          if (!existing) {
            await tx.transaction.create({
              data: {
                id: item.id,
                userId,
                date: item.date,
                description: item.description,
                amount: new Prisma.Decimal(item.amount),
                type: item.type,
                categoryId: item.categoryId,
                isRecurring: item.isRecurring || false,
                recurringRuleId: item.recurringRuleId || null,
                notes: item.notes || null,
                createdAt: item.createdAt ? new Date(item.createdAt) : now,
                updatedAt: itemUpdatedAt,
                deletedAt: itemDeletedAt,
              },
            });
          } else if (itemUpdatedAt >= existing.updatedAt) {
            // Last-Write-Wins: client version is newer or equal
            await tx.transaction.update({
              where: { id: existing.id },
              data: {
                date: item.date,
                description: item.description,
                amount: new Prisma.Decimal(item.amount),
                type: item.type,
                categoryId: item.categoryId,
                isRecurring: item.isRecurring || false,
                recurringRuleId: item.recurringRuleId || null,
                notes: item.notes || null,
                updatedAt: itemUpdatedAt,
                deletedAt: itemDeletedAt,
              },
            });
          }
        }
      }

      // 2. Categories
      if (payload.categories && payload.categories.length > 0) {
        for (const item of payload.categories) {
          const itemUpdatedAt = item.updatedAt ? new Date(item.updatedAt) : now;
          const itemDeletedAt = item.deletedAt ? new Date(item.deletedAt) : null;
          const existing = await tx.category.findFirst({
            where: { id: item.id, userId },
          });

          const budgetLimit = item.budgetLimit !== undefined && item.budgetLimit !== null
            ? new Prisma.Decimal(item.budgetLimit)
            : null;

          if (!existing) {
            await tx.category.create({
              data: {
                id: item.id,
                userId,
                name: item.name,
                icon: item.icon,
                color: item.color,
                type: item.type,
                budgetLimit,
                isDefault: item.isDefault || false,
                createdAt: item.createdAt ? new Date(item.createdAt) : now,
                updatedAt: itemUpdatedAt,
                deletedAt: itemDeletedAt,
              },
            });
          } else if (itemUpdatedAt >= existing.updatedAt) {
            await tx.category.update({
              where: { id: existing.id },
              data: {
                name: item.name,
                icon: item.icon,
                color: item.color,
                type: item.type,
                budgetLimit,
                isDefault: item.isDefault || false,
                updatedAt: itemUpdatedAt,
                deletedAt: itemDeletedAt,
              },
            });
          }
        }
      }

      // 3. Budgets
      if (payload.budgets && payload.budgets.length > 0) {
        for (const item of payload.budgets) {
          const itemUpdatedAt = item.updatedAt ? new Date(item.updatedAt) : now;
          const itemDeletedAt = item.deletedAt ? new Date(item.deletedAt) : null;
          const existing = await tx.budgetGoal.findFirst({
            where: { id: item.id, userId },
          });

          if (!existing) {
            await tx.budgetGoal.create({
              data: {
                id: item.id,
                userId,
                categoryId: item.categoryId,
                monthlyLimit: new Prisma.Decimal(item.monthlyLimit),
                period: item.period,
                notifyThreshold: item.notifyThreshold ?? 0.8,
                createdAt: item.createdAt ? new Date(item.createdAt) : now,
                updatedAt: itemUpdatedAt,
                deletedAt: itemDeletedAt,
              },
            });
          } else if (itemUpdatedAt >= existing.updatedAt) {
            await tx.budgetGoal.update({
              where: { id: existing.id },
              data: {
                categoryId: item.categoryId,
                monthlyLimit: new Prisma.Decimal(item.monthlyLimit),
                period: item.period,
                notifyThreshold: item.notifyThreshold ?? 0.8,
                updatedAt: itemUpdatedAt,
                deletedAt: itemDeletedAt,
              },
            });
          }
        }
      }

      // 4. Recurring Rules
      if (payload.recurringRules && payload.recurringRules.length > 0) {
        for (const item of payload.recurringRules) {
          const itemUpdatedAt = item.updatedAt ? new Date(item.updatedAt) : now;
          const itemDeletedAt = item.deletedAt ? new Date(item.deletedAt) : null;
          const existing = await tx.recurrenceRule.findFirst({
            where: { id: item.id, userId },
          });

          if (!existing) {
            await tx.recurrenceRule.create({
              data: {
                id: item.id,
                userId,
                frequency: item.frequency,
                startDate: item.startDate,
                endDate: item.endDate || null,
                lastGeneratedDate: item.lastGeneratedDate || null,
                isActive: item.isActive,
                template: item.template,
                createdAt: item.createdAt ? new Date(item.createdAt) : now,
                updatedAt: itemUpdatedAt,
                deletedAt: itemDeletedAt,
              },
            });
          } else if (itemUpdatedAt >= existing.updatedAt) {
            await tx.recurrenceRule.update({
              where: { id: existing.id },
              data: {
                frequency: item.frequency,
                startDate: item.startDate,
                endDate: item.endDate || null,
                lastGeneratedDate: item.lastGeneratedDate || null,
                isActive: item.isActive,
                template: item.template,
                updatedAt: itemUpdatedAt,
                deletedAt: itemDeletedAt,
              },
            });
          }
        }
      }

      // 5. Savings Goals
      if (payload.savingsGoals && payload.savingsGoals.length > 0) {
        for (const item of payload.savingsGoals) {
          const itemUpdatedAt = item.updatedAt ? new Date(item.updatedAt) : now;
          const itemDeletedAt = item.deletedAt ? new Date(item.deletedAt) : null;
          const existing = await tx.savingsGoal.findFirst({
            where: { id: item.id, userId },
          });

          if (!existing) {
            await tx.savingsGoal.create({
              data: {
                id: item.id,
                userId,
                title: item.title,
                targetAmount: new Prisma.Decimal(item.targetAmount),
                currentAmount: new Prisma.Decimal(item.currentAmount),
                targetDate: item.targetDate,
                icon: item.icon,
                color: item.color,
                categoryId: item.categoryId || null,
                isCompleted: item.isCompleted || false,
                notes: item.notes || null,
                createdAt: item.createdAt ? new Date(item.createdAt) : now,
                updatedAt: itemUpdatedAt,
                deletedAt: itemDeletedAt,
              },
            });
          } else if (itemUpdatedAt >= existing.updatedAt) {
            await tx.savingsGoal.update({
              where: { id: existing.id },
              data: {
                title: item.title,
                targetAmount: new Prisma.Decimal(item.targetAmount),
                currentAmount: new Prisma.Decimal(item.currentAmount),
                targetDate: item.targetDate,
                icon: item.icon,
                color: item.color,
                categoryId: item.categoryId || null,
                isCompleted: item.isCompleted || false,
                notes: item.notes || null,
                updatedAt: itemUpdatedAt,
                deletedAt: itemDeletedAt,
              },
            });
          }
        }
      }

      // 6. Split Groups
      if (payload.splitGroups && payload.splitGroups.length > 0) {
        for (const item of payload.splitGroups) {
          const itemUpdatedAt = item.updatedAt ? new Date(item.updatedAt) : now;
          const itemDeletedAt = item.deletedAt ? new Date(item.deletedAt) : null;
          const existing = await tx.splitGroup.findFirst({
            where: { id: item.id, userId },
          });

          if (!existing) {
            await tx.splitGroup.create({
              data: {
                id: item.id,
                userId,
                title: item.title,
                totalAmount: new Prisma.Decimal(item.totalAmount),
                currency: item.currency || 'INR',
                paidByMemberId: item.paidByMemberId,
                members: item.members,
                splits: item.splits,
                settled: item.settled || false,
                date: item.date,
                notes: item.notes || null,
                categoryId: item.categoryId || null,
                createdAt: item.createdAt ? new Date(item.createdAt) : now,
                updatedAt: itemUpdatedAt,
                deletedAt: itemDeletedAt,
              },
            });
          } else if (itemUpdatedAt >= existing.updatedAt) {
            await tx.splitGroup.update({
              where: { id: existing.id },
              data: {
                title: item.title,
                totalAmount: new Prisma.Decimal(item.totalAmount),
                currency: item.currency || 'INR',
                paidByMemberId: item.paidByMemberId,
                members: item.members,
                splits: item.splits,
                settled: item.settled || false,
                date: item.date,
                notes: item.notes || null,
                categoryId: item.categoryId || null,
                updatedAt: itemUpdatedAt,
                deletedAt: itemDeletedAt,
              },
            });
          }
        }
      }

      // 7. Settings
      if (payload.settings) {
        const item = payload.settings;
        const itemUpdatedAt = item.updatedAt ? new Date(item.updatedAt) : now;
        const existing = await tx.userSetting.findUnique({
          where: { userId },
        });

        if (!existing) {
          await tx.userSetting.create({
            data: {
              userId,
              currency: item.currency || 'INR',
              theme: item.theme || 'dark',
              dateFormat: item.dateFormat || 'YYYY-MM-DD',
              firstDayOfWeek: item.firstDayOfWeek ?? 1,
              hasCompletedOnboarding: item.hasCompletedOnboarding ?? true,
              updatedAt: itemUpdatedAt,
            },
          });
        } else if (itemUpdatedAt >= existing.updatedAt) {
          await tx.userSetting.update({
            where: { userId },
            data: {
              currency: item.currency ?? existing.currency,
              theme: item.theme ?? existing.theme,
              dateFormat: item.dateFormat ?? existing.dateFormat,
              firstDayOfWeek: item.firstDayOfWeek ?? existing.firstDayOfWeek,
              hasCompletedOnboarding: item.hasCompletedOnboarding ?? existing.hasCompletedOnboarding,
              updatedAt: itemUpdatedAt,
            },
          });
        }
      }
    });

    return {
      success: true,
      processedAt: new Date().toISOString(),
    };
  }
}

export const syncService = new SyncService();
