import { Router } from 'express';
import { entityController } from '../controllers/entityControllers.js';
import { requireAuth } from '../middleware/auth.js';

export const dataRouter = Router();

dataRouter.use(requireAuth);

// Transactions CRUD
dataRouter.get('/transactions', (req, res, next) => entityController.getTransactions(req, res, next));
dataRouter.post('/transactions', (req, res, next) => entityController.createTransaction(req, res, next));
dataRouter.put('/transactions/:id', (req, res, next) => entityController.updateTransaction(req, res, next));
dataRouter.delete('/transactions/:id', (req, res, next) => entityController.deleteTransaction(req, res, next));

// Categories CRUD
dataRouter.get('/categories', (req, res, next) => entityController.getCategories(req, res, next));
dataRouter.post('/categories', (req, res, next) => entityController.createCategory(req, res, next));
dataRouter.delete('/categories/:id', (req, res, next) => entityController.deleteCategory(req, res, next));

// Budgets CRUD
dataRouter.get('/budgets', (req, res, next) => entityController.getBudgets(req, res, next));
dataRouter.post('/budgets', (req, res, next) => entityController.setBudget(req, res, next));
dataRouter.delete('/budgets/:id', (req, res, next) => entityController.deleteBudget(req, res, next));

// Recurring Rules CRUD
dataRouter.get('/recurring-rules', (req, res, next) => entityController.getRecurringRules(req, res, next));
dataRouter.post('/recurring-rules', (req, res, next) => entityController.createRecurringRule(req, res, next));
dataRouter.delete('/recurring-rules/:id', (req, res, next) => entityController.deleteRecurringRule(req, res, next));

// Savings Goals CRUD
dataRouter.get('/savings-goals', (req, res, next) => entityController.getSavingsGoals(req, res, next));
dataRouter.post('/savings-goals', (req, res, next) => entityController.createSavingsGoal(req, res, next));
dataRouter.delete('/savings-goals/:id', (req, res, next) => entityController.deleteSavingsGoal(req, res, next));

// Split Groups CRUD
dataRouter.get('/split-groups', (req, res, next) => entityController.getSplitGroups(req, res, next));
dataRouter.post('/split-groups', (req, res, next) => entityController.createSplitGroup(req, res, next));
dataRouter.delete('/split-groups/:id', (req, res, next) => entityController.deleteSplitGroup(req, res, next));
