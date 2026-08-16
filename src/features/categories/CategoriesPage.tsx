import React, { useState, useMemo } from 'react';
import {
  Tags,
  Plus,
  Edit2,
  Trash2,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { Category } from '../../types';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useTransactionStore } from '../../store/useTransactionStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { formatCurrency } from '../../utils/formatters';
import { IconRenderer } from '../../components/common/IconRenderer';
import { CategoryModal } from './CategoryModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const CategoriesPage: React.FC = () => {
  const { categories, deleteCategory } = useCategoryStore();
  const { transactions } = useTransactionStore();
  const { settings, showToast } = useSettingsStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Calculate stats per category
  const categoryStats = useMemo(() => {
    const statsMap = new Map<string, { count: number; total: number }>();

    transactions.forEach((tx) => {
      const curr = statsMap.get(tx.categoryId) || { count: 0, total: 0 };
      statsMap.set(tx.categoryId, {
        count: curr.count + 1,
        total: curr.total + tx.amount,
      });
    });

    return statsMap;
  }, [transactions]);

  const expenseCategories = categories.filter((c) => c.type === 'expense' || c.type === 'both');
  const incomeCategories = categories.filter((c) => c.type === 'income');

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteCategory(deletingId);
      showToast('Category deleted', 'info');
      setDeletingId(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to delete category', 'error');
    }
  };

  const renderCategoryCard = (cat: Category) => {
    const stats = categoryStats.get(cat.id) || { count: 0, total: 0 };

    return (
      <div
        key={cat.id}
        className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 flex items-center justify-between hover:border-slate-700 transition-all shadow-md"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 border"
            style={{
              backgroundColor: `${cat.color}18`,
              borderColor: `${cat.color}35`,
              color: cat.color,
            }}
          >
            <IconRenderer name={cat.icon} className="w-6 h-6" />
          </div>

          <div className="truncate">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-white truncate">{cat.name}</h4>
              {cat.isDefault && (
                <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                  Default
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {stats.count} transaction{stats.count === 1 ? '' : 's'} • {formatCurrency(stats.total, settings.currency)} total
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button
            onClick={() => setEditingCategory(cat)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Edit Category"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {!cat.isDefault ? (
            <button
              onClick={() => setDeletingId(cat.id)}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Delete Category"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <span className="p-2 text-slate-600" title="System default category">
              <Lock className="w-4 h-4" />
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Categories
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Organize transactions and customize spending tags with icons & colors
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-md shadow-emerald-500/20 transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Category</span>
        </button>
      </div>

      {/* Expense Categories */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
          <ArrowDownLeft className="w-4 h-4 text-rose-400" />
          <span>Expense Categories ({expenseCategories.length})</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {expenseCategories.map(renderCategoryCard)}
        </div>
      </div>

      {/* Income Categories */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
          <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          <span>Income Categories ({incomeCategories.length})</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {incomeCategories.map(renderCategoryCard)}
        </div>
      </div>

      {/* Modals */}
      <CategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <CategoryModal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        initialData={editingCategory}
      />

      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Custom Category"
        message="Are you sure you want to delete this custom category? Existing transactions using this category will remain."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
