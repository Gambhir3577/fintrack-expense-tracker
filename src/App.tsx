import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { TransactionsPage } from './features/transactions/TransactionsPage';
import { BudgetsPage } from './features/budgets/BudgetsPage';
import { RecurringPage } from './features/recurring/RecurringPage';
import { CSVImportPage } from './features/import/CSVImportPage';
import { CategoriesPage } from './features/categories/CategoriesPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { AIAssistantPage } from './features/ai/AIAssistantPage';
import { ReceiptScannerPage } from './features/scanner/ReceiptScannerPage';
import { SavingsGoalsPage } from './features/goals/SavingsGoalsPage';
import { SplitBillPage } from './features/split/SplitBillPage';
import { LoginPage } from './features/auth/LoginPage';
import { AuthGuard } from './features/auth/AuthGuard';
import { useAuthStore } from './store/useAuthStore';

export function App() {
  const { loadAuth } = useAuthStore();

  useEffect(() => {
    loadAuth();
  }, [loadAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login / Auth Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Dashboard & Feature Routes */}
        <Route
          path="/"
          element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="ai-assistant" element={<AIAssistantPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="receipt-scanner" element={<ReceiptScannerPage />} />
          <Route path="goals" element={<SavingsGoalsPage />} />
          <Route path="split-bill" element={<SplitBillPage />} />
          <Route path="budgets" element={<BudgetsPage />} />
          <Route path="recurring" element={<RecurringPage />} />
          <Route path="import" element={<CSVImportPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
