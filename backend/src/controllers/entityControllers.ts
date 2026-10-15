import { Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';

export class EntityController {
  // Transactions
  async getTransactions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const transactions = await prisma.transaction.findMany({
        where: { userId: req.user!.id, deletedAt: null },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      });
      res.json(transactions.map((t) => ({ ...t, amount: Number(t.amount) })));
    } catch (err) {
      next(err);
    }
  }

  async createTransaction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id, date, description, amount, type, categoryId, isRecurring, recurringRuleId, notes } = req.body;
      const created = await prisma.transaction.create({
        data: {
          id: id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          userId: req.user!.id,
          date,
          description,
          amount: new Prisma.Decimal(amount),
          type,
          categoryId,
          isRecurring: !!isRecurring,
          recurringRuleId,
          notes,
        },
      });
      res.status(201).json({ ...created, amount: Number(created.amount) });
    } catch (err) {
      next(err);
    }
  }

  async updateTransaction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { date, description, amount, type, categoryId, isRecurring, recurringRuleId, notes } = req.body;
      const updated = await prisma.transaction.updateMany({
        where: { id, userId: req.user!.id },
        data: {
          date,
          description,
          amount: amount !== undefined ? new Prisma.Decimal(amount) : undefined,
          type,
          categoryId,
          isRecurring,
          recurringRuleId,
          notes,
          updatedAt: new Date(),
        },
      });
      if (updated.count === 0) {
        res.status(404).json({ error: 'Transaction not found or unauthorized' });
        return;
      }
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  async deleteTransaction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await prisma.transaction.updateMany({
        where: { id, userId: req.user!.id },
        data: { deletedAt: new Date(), updatedAt: new Date() },
      });
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  // Categories
  async getCategories(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const categories = await prisma.category.findMany({
        where: { userId: req.user!.id, deletedAt: null },
      });
      res.json(categories.map((c) => ({ ...c, budgetLimit: c.budgetLimit ? Number(c.budgetLimit) : null })));
    } catch (err) {
      next(err);
    }
  }

  async createCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id, name, icon, color, type, budgetLimit, isDefault } = req.body;
      const created = await prisma.category.create({
        data: {
          id: id || `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          userId: req.user!.id,
          name,
          icon,
          color,
          type,
          budgetLimit: budgetLimit ? new Prisma.Decimal(budgetLimit) : null,
          isDefault: !!isDefault,
        },
      });
      res.status(201).json({ ...created, budgetLimit: created.budgetLimit ? Number(created.budgetLimit) : null });
    } catch (err) {
      next(err);
    }
  }

  async deleteCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await prisma.category.updateMany({
        where: { id, userId: req.user!.id },
        data: { deletedAt: new Date(), updatedAt: new Date() },
      });
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  // Budgets
  async getBudgets(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const budgets = await prisma.budgetGoal.findMany({
        where: { userId: req.user!.id, deletedAt: null },
      });
      res.json(budgets.map((b) => ({ ...b, monthlyLimit: Number(b.monthlyLimit) })));
    } catch (err) {
      next(err);
    }
  }

  async setBudget(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id, categoryId, monthlyLimit, period, notifyThreshold } = req.body;
      const budgetId = id || `b-${period}-${categoryId}`;
      const upserted = await prisma.budgetGoal.upsert({
        where: { id: budgetId },
        create: {
          id: budgetId,
          userId: req.user!.id,
          categoryId,
          monthlyLimit: new Prisma.Decimal(monthlyLimit),
          period,
          notifyThreshold: notifyThreshold ?? 0.8,
        },
        update: {
          monthlyLimit: new Prisma.Decimal(monthlyLimit),
          notifyThreshold: notifyThreshold ?? 0.8,
          deletedAt: null,
          updatedAt: new Date(),
        },
      });
      res.json({ ...upserted, monthlyLimit: Number(upserted.monthlyLimit) });
    } catch (err) {
      next(err);
    }
  }

  async deleteBudget(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await prisma.budgetGoal.updateMany({
        where: { id, userId: req.user!.id },
        data: { deletedAt: new Date(), updatedAt: new Date() },
      });
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  // Recurring Rules
  async getRecurringRules(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const rules = await prisma.recurrenceRule.findMany({
        where: { userId: req.user!.id, deletedAt: null },
      });
      res.json(rules);
    } catch (err) {
      next(err);
    }
  }

  async createRecurringRule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id, frequency, startDate, endDate, isActive, template } = req.body;
      const created = await prisma.recurrenceRule.create({
        data: {
          id: id || `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          userId: req.user!.id,
          frequency,
          startDate,
          endDate,
          isActive: isActive !== false,
          template,
        },
      });
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  }

  async deleteRecurringRule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await prisma.recurrenceRule.updateMany({
        where: { id, userId: req.user!.id },
        data: { deletedAt: new Date(), updatedAt: new Date() },
      });
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  // Savings Goals
  async getSavingsGoals(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const goals = await prisma.savingsGoal.findMany({
        where: { userId: req.user!.id, deletedAt: null },
      });
      res.json(
        goals.map((g) => ({
          ...g,
          targetAmount: Number(g.targetAmount),
          currentAmount: Number(g.currentAmount),
        }))
      );
    } catch (err) {
      next(err);
    }
  }

  async createSavingsGoal(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id, title, targetAmount, currentAmount, targetDate, icon, color, categoryId, isCompleted, notes } = req.body;
      const created = await prisma.savingsGoal.create({
        data: {
          id: id || `goal-${Date.now()}`,
          userId: req.user!.id,
          title,
          targetAmount: new Prisma.Decimal(targetAmount),
          currentAmount: new Prisma.Decimal(currentAmount || 0),
          targetDate,
          icon,
          color,
          categoryId,
          isCompleted: !!isCompleted,
          notes,
        },
      });
      res.status(201).json({
        ...created,
        targetAmount: Number(created.targetAmount),
        currentAmount: Number(created.currentAmount),
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteSavingsGoal(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await prisma.savingsGoal.updateMany({
        where: { id, userId: req.user!.id },
        data: { deletedAt: new Date(), updatedAt: new Date() },
      });
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  // Split Groups
  async getSplitGroups(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const groups = await prisma.splitGroup.findMany({
        where: { userId: req.user!.id, deletedAt: null },
      });
      res.json(groups.map((g) => ({ ...g, totalAmount: Number(g.totalAmount) })));
    } catch (err) {
      next(err);
    }
  }

  async createSplitGroup(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id, title, totalAmount, currency, paidByMemberId, members, splits, settled, date, notes, categoryId } = req.body;
      const created = await prisma.splitGroup.create({
        data: {
          id: id || `split-${Date.now()}`,
          userId: req.user!.id,
          title,
          totalAmount: new Prisma.Decimal(totalAmount),
          currency: currency || 'INR',
          paidByMemberId,
          members,
          splits,
          settled: !!settled,
          date,
          notes,
          categoryId,
        },
      });
      res.status(201).json({ ...created, totalAmount: Number(created.totalAmount) });
    } catch (err) {
      next(err);
    }
  }

  async deleteSplitGroup(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await prisma.splitGroup.updateMany({
        where: { id, userId: req.user!.id },
        data: { deletedAt: new Date(), updatedAt: new Date() },
      });
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
}

export const entityController = new EntityController();
