import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../components/common/Modal';
import { Category, TransactionType } from '../../types';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { AVAILABLE_ICONS, PALETTE_COLORS, CURRENCY_CONFIGS } from '../../utils/constants';
import { IconRenderer } from '../../components/common/IconRenderer';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50),
  icon: z.string().min(1, 'Please select an icon'),
  color: z.string().min(1, 'Please select a color'),
  type: z.enum(['income', 'expense', 'both']),
  budgetLimit: z.number().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Category | null;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const { addCategory, updateCategory } = useCategoryStore();
  const { settings, showToast } = useSettingsStore();
  const currencyConfig = CURRENCY_CONFIGS[settings.currency] || CURRENCY_CONFIGS.USD;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      icon: 'Tag',
      color: PALETTE_COLORS[0],
      type: 'expense',
      budgetLimit: undefined,
    },
  });

  const selectedIcon = watch('icon');
  const selectedColor = watch('color');
  const selectedType = watch('type');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          name: initialData.name,
          icon: initialData.icon,
          color: initialData.color,
          type: initialData.type,
          budgetLimit: initialData.budgetLimit,
        });
      } else {
        reset({
          name: '',
          icon: 'Tag',
          color: PALETTE_COLORS[5], // Emerald
          type: 'expense',
          budgetLimit: undefined,
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      if (initialData) {
        await updateCategory({
          ...initialData,
          name: data.name.trim(),
          icon: data.icon,
          color: data.color,
          type: data.type,
          budgetLimit: data.budgetLimit,
        });
        showToast('Category updated successfully', 'success');
      } else {
        await addCategory({
          name: data.name.trim(),
          icon: data.icon,
          color: data.color,
          type: data.type,
          budgetLimit: data.budgetLimit,
        });
        showToast('Custom category created', 'success');
      }
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to save category', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Category' : 'New Custom Category'}
      subtitle="Define category name, color tag, and icon"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Type Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setValue('type', 'expense')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
              selectedType === 'expense'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" /> Expense Category
          </button>
          <button
            type="button"
            onClick={() => setValue('type', 'income')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
              selectedType === 'income'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" /> Income Category
          </button>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Category Name
          </label>
          <input
            type="text"
            placeholder="e.g. Coffee & Snacks, Gym, Freelancing"
            {...register('name')}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
          />
          {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>}
        </div>

        {/* Color Palette Picker */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Badge Color
          </label>
          <div className="flex flex-wrap gap-2.5">
            {PALETTE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setValue('color', color)}
                className={`w-7 h-7 rounded-full transition-transform ${
                  selectedColor === color ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-950' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Icon Grid Picker */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Select Icon
          </label>
          <div className="grid grid-cols-7 sm:grid-cols-9 gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800 max-h-36 overflow-y-auto">
            {AVAILABLE_ICONS.map((iconName) => (
              <button
                key={iconName}
                type="button"
                onClick={() => setValue('icon', iconName)}
                className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                  selectedIcon === iconName
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <IconRenderer name={iconName} className="w-5 h-5" />
              </button>
            ))}
          </div>
        </div>

        {/* Default Monthly Budget Limit (Optional) */}
        {selectedType === 'expense' && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Default Monthly Budget ({currencyConfig.symbol}) (Optional)
            </label>
            <div className="relative rounded-xl border border-slate-800 bg-slate-950 focus-within:border-emerald-500">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                {currencyConfig.symbol}
              </span>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                {...register('budgetLimit', { valueAsNumber: true })}
                className="w-full bg-transparent pl-9 pr-4 py-2.5 text-sm font-bold text-white focus:outline-none"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-md shadow-emerald-500/20 transition-all font-sans"
          >
            {isSubmitting ? 'Saving...' : initialData ? 'Save Category' : 'Create Category'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
