import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  Trash2,
  Edit2,
  Repeat,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Sparkles,
} from 'lucide-react';
import { Transaction, Category } from '../../types';
import { useTransactionStore } from '../../store/useTransactionStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useCurrencyStore } from '../../store/currencyStore';
import { formatCurrency, formatDateString } from '../../utils/formatters';
import { exportTransactionsToCSV } from '../../utils/exportImport';
import { IconRenderer } from '../../components/common/IconRenderer';
import { TransactionFormModal } from './TransactionFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { loadDemoData } from '../../db/seedData';

export const TransactionsPage: React.FC = () => {
  const {
    transactions,
    filters,
    sortConfig,
    currentPage,
    pageSize,
    loadTransactions,
    deleteTransaction,
    bulkDeleteTransactions,
    setFilter,
    resetFilters,
    setSort,
    setPage,
    setPageSize,
    getFilteredTransactions,
  } = useTransactionStore();

  const { categories } = useCategoryStore();
  const { settings, showToast } = useSettingsStore();
  const { baseCurrency, convert } = useCurrencyStore();

  // Local state for modals & selection
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const filteredTransactions = getFilteredTransactions();

  // Pagination calculation
  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  // Category lookup helper
  const getCategory = (catId: string) => {
    return (
      categories.find((c) => c.id === catId) || {
        name: 'Uncategorized',
        icon: 'Tag',
        color: '#64748B',
      }
    );
  };

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedTransactions.map((t) => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSingle = async () => {
    if (!deletingId) return;
    try {
      await deleteTransaction(deletingId);
      setSelectedIds((prev) => prev.filter((i) => i !== deletingId));
      showToast('Transaction removed', 'info');
      setDeletingId(null);
    } catch (e) {
      console.error(e);
      showToast('Failed to delete transaction', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await bulkDeleteTransactions(selectedIds);
      showToast(`Deleted ${selectedIds.length} transactions`, 'info');
      setSelectedIds([]);
      setIsBulkDeleteConfirmOpen(false);
    } catch (e) {
      console.error(e);
      showToast('Failed to bulk delete', 'error');
    }
  };

  const handleExportCSV = () => {
    const listToExport =
      selectedIds.length > 0
        ? transactions.filter((t) => selectedIds.includes(t.id))
        : filteredTransactions;

    exportTransactionsToCSV(listToExport, categories);
    showToast(`Exported ${listToExport.length} transactions to CSV`, 'success');
  };

  const handleLoadDemo = async () => {
    try {
      await loadDemoData();
      await loadTransactions();
      showToast('Loaded demo transactions!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to load demo data', 'error');
    }
  };

  const isAllCurrentPageSelected =
    paginatedTransactions.length > 0 &&
    paginatedTransactions.every((t) => selectedIds.includes(t.id));

  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.categoryId !== 'all' ||
    filters.type !== 'all' ||
    filters.datePreset !== 'all' ||
    filters.recurringOnly;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Transactions
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-slate-400">
              {filteredTransactions.length} transaction{filteredTransactions.length === 1 ? '' : 's'} found
            </p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
              {baseCurrency}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {transactions.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Export CSV</span>
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search description, memo or notes..."
              value={filters.searchQuery}
              onChange={(e) => setFilter('searchQuery', e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition-colors"
            />
            {filters.searchQuery && (
              <button
                onClick={() => setFilter('searchQuery', '')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Type */}
            <select
              value={filters.type}
              onChange={(e) => setFilter('type', e.target.value as any)}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>

            {/* Category */}
            <select
              value={filters.categoryId}
              onChange={(e) => setFilter('categoryId', e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:border-emerald-500 focus:outline-none cursor-pointer max-w-[150px] truncate"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Date Range Preset */}
            <select
              value={filters.datePreset}
              onChange={(e) => setFilter('datePreset', e.target.value as any)}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs sm:text-sm text-slate-200 focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="this-year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>

            {/* Recurring Toggle */}
            <button
              onClick={() => setFilter('recurringOnly', !filters.recurringOnly)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                filters.recurringOnly
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Recurring</span>
            </button>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-2.5 py-2 text-xs text-rose-400 hover:text-rose-300 font-semibold"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Custom Date Range Row */}
        {filters.datePreset === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800 animate-fade-in">
            <span className="text-xs font-semibold text-slate-400">Date Range:</span>
            <input
              type="date"
              value={filters.customStartDate || ''}
              onChange={(e) => setFilter('customStartDate', e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
            <span className="text-xs text-slate-500">to</span>
            <input
              type="date"
              value={filters.customEndDate || ''}
              onChange={(e) => setFilter('customEndDate', e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Bulk Action Bar (when rows are selected) */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 animate-fade-in">
          <span className="text-xs sm:text-sm font-semibold">
            {selectedIds.length} item{selectedIds.length === 1 ? '' : 's'} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1 text-xs rounded-lg bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700"
            >
              Deselect All
            </button>
            <button
              onClick={() => setIsBulkDeleteConfirmOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Transactions Table & Mobile View */}
      {paginatedTransactions.length === 0 ? (
        <div className="py-6">
          {transactions.length === 0 ? (
            <EmptyState
              title="No transactions yet"
              description="Start tracking your finances by adding your first transaction or loading our rich demo dataset."
              actionText="Load Demo Data"
              onAction={handleLoadDemo}
            />
          ) : (
            <EmptyState
              title="No matching transactions"
              description="No records match your active search and filter criteria. Try resetting your filters."
              actionText="Reset Filters"
              onAction={resetFilters}
            />
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden shadow-lg">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-950/80 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={isAllCurrentPageSelected}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/20"
                    />
                  </th>
                  <th
                    onClick={() => setSort('date')}
                    className="p-4 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Date</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th
                    onClick={() => setSort('description')}
                    className="p-4 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Description</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th
                    onClick={() => setSort('categoryId')}
                    className="p-4 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Category</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th
                    onClick={() => setSort('amount')}
                    className="p-4 text-right cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Amount</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold">{baseCurrency}</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedTransactions.map((tx) => {
                  const cat = getCategory(tx.categoryId);
                  const isIncome = tx.type === 'income';
                  const isSelected = selectedIds.includes(tx.id);

                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-emerald-500/5' : ''
                      }`}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(tx.id)}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/20"
                        />
                      </td>
                      <td className="p-4 text-xs font-semibold text-slate-400 whitespace-nowrap">
                        {formatDateString(tx.date, 'MMM dd, yyyy')}
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-semibold text-slate-100">{tx.description}</p>
                          {tx.notes && <p className="text-xs text-slate-400 mt-0.5">{tx.notes}</p>}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-semibold"
                          style={{
                            backgroundColor: `${cat.color}15`,
                            borderColor: `${cat.color}30`,
                            color: cat.color,
                          }}
                        >
                          <IconRenderer name={cat.icon} className="w-3.5 h-3.5" />
                          <span>{cat.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <span
                          className={`font-bold font-mono text-sm ${
                            isIncome ? 'text-emerald-400' : 'text-slate-200'
                          }`}
                        >
                          {isIncome ? '+' : '-'}{formatCurrency(convert(tx.amount), baseCurrency)}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {tx.isRecurring ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <Repeat className="w-3 h-3" /> Recurring
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-medium">Standard</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingTransaction(tx)}
                            title="Edit"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(tx.id)}
                            title="Delete"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="block md:hidden divide-y divide-slate-800/80">
            {paginatedTransactions.map((tx) => {
              const cat = getCategory(tx.categoryId);
              const isIncome = tx.type === 'income';
              const isSelected = selectedIds.includes(tx.id);

              return (
                <div
                  key={tx.id}
                  className={`p-4 space-y-2.5 transition-colors ${
                    isSelected ? 'bg-emerald-500/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(tx.id)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/20"
                      />
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: `${cat.color}18`,
                          borderColor: `${cat.color}35`,
                          color: cat.color,
                        }}
                      >
                        <IconRenderer name={cat.icon} className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{tx.description}</p>
                        <p className="text-xs text-slate-400">{formatDateString(tx.date, 'MMM dd, yyyy')}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-sm font-extrabold ${
                          isIncome ? 'text-emerald-400' : 'text-slate-100'
                        }`}
                      >
                        {isIncome ? '+' : '-'}{formatCurrency(convert(tx.amount), baseCurrency)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span
                      className="px-2 py-0.5 rounded-lg border font-semibold"
                      style={{
                        backgroundColor: `${cat.color}15`,
                        borderColor: `${cat.color}30`,
                        color: cat.color,
                      }}
                    >
                      {cat.name}
                    </span>

                    <div className="flex items-center gap-2">
                      {tx.isRecurring && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          <Repeat className="w-2.5 h-2.5" /> Recurring
                        </span>
                      )}
                      <button
                        onClick={() => setEditingTransaction(tx)}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingId(tx.id)}
                        className="p-1 text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950/60 border-t border-slate-800 gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <span>
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, filteredTransactions.length)} of{' '}
                {filteredTransactions.length} records
              </span>

              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:outline-none"
              >
                <option value={10}>10 per page</option>
                <option value={15}>15 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  onClick={() => setPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-semibold text-slate-200">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transaction Modals */}
      <TransactionFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <TransactionFormModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        initialData={editingTransaction}
      />

      {/* Delete Single Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteSingle}
        title="Delete Transaction"
        message="Are you sure you want to permanently delete this transaction? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />

      {/* Bulk Delete Dialog */}
      <ConfirmDialog
        isOpen={isBulkDeleteConfirmOpen}
        onClose={() => setIsBulkDeleteConfirmOpen(false)}
        onConfirm={handleBulkDelete}
        title={`Delete ${selectedIds.length} Transactions`}
        message={`Are you sure you want to permanently remove ${selectedIds.length} selected transaction records?`}
        confirmText="Delete All Selected"
        variant="danger"
      />
    </div>
  );
};
