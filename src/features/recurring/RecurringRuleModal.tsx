import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Modal } from '../../components/common/Modal';
import { RecurrenceRule, RecurrenceFrequency } from '../../types';
import { useRecurringStore } from '../../store/useRecurringStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { CURRENCY_CONFIGS } from '../../utils/constants';
import { ArrowUpRight, ArrowDownLeft, Calendar, Tag } from 'lucide-react';

const recurringRuleSchema = z.object({
  description: z.string().min(1, 'Description is required').max(100),
  amount: z.number({ invalid_type_error: 'Amount is required' }).positive('Amount must be greater than 0'),
  type: z.enum(['income', 'expense']),
  categoryId: z.string().min(1, 'Select a category'),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid start date required'),
  endDate: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean(),
});

type RecurringRuleFormValues = z.infer<typeof recurringRuleSchema>;

interface RecurringRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: RecurrenceRule | null;
}

export const RecurringRuleModal: React.FC<RecurringRuleModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const { addRule, updateRule } = useRecurringStore();
  const { categories } = useCategoryStore();
  const { settings, showToast } = useSettingsStore();
  const currencyConfig = CURRENCY_CONFIGS[settings.currency] || CURRENCY_CONFIGS.USD;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RecurringRuleFormValues>({
    resolver: zodResolver(recurringRuleSchema),
    defaultValues: {
      description: '',
      amount: undefined as any,
      type: 'expense',
      categoryId: '',
      frequency: 'monthly',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: '',
      notes: '',
      isActive: true,
    },
  });

  const selectedType = watch('type');
  const availableCategories = categories.filter(
    (c) => c.type === 'both' || c.type === selectedType
  );

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          description: initialData.template.description,
          amount: initialData.template.amount,
          type: initialData.template.type,
          categoryId: initialData.template.categoryId,
          frequency: initialData.frequency,
          startDate: initialData.startDate,
          endDate: initialData.endDate || '',
          notes: initialData.template.notes || '',
          isActive: initialData.isActive,
        });
      } else {
        reset({
          description: '',
          amount: undefined as any,
          type: 'expense',
          categoryId: availableCategories[0]?.id || '',
          frequency: 'monthly',
          startDate: format(new Date(), 'yyyy-MM-dd'),
          endDate: '',
          notes: '',
          isActive: true,
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (data: RecurringRuleFormValues) => {
    try {
      if (initialData) {
        await updateRule({
          ...initialData,
          frequency: data.frequency as RecurrenceFrequency,
          startDate: data.startDate,
          endDate: data.endDate || undefined,
          isActive: data.isActive,
          template: {
            description: data.description.trim(),
            amount: data.amount,
            type: data.type,
            categoryId: data.categoryId,
            notes: data.notes?.trim() || undefined,
          },
        });
        showToast('Recurring rule updated', 'success');
      } else {
        await addRule({
          frequency: data.frequency as RecurrenceFrequency,
          startDate: data.startDate,
          endDate: data.endDate || undefined,
          isActive: data.isActive,
          template: {
            description: data.description.trim(),
            amount: data.amount,
            type: data.type,
            categoryId: data.categoryId,
            notes: data.notes?.trim() || undefined,
          },
        });
        showToast('Recurring rule created and processed', 'success');
      }
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to save recurring rule', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Recurring Rule' : 'New Recurring Rule'}
      subtitle="Schedule automated regular financial entries"
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
            <ArrowDownLeft className="w-4 h-4" /> Expense
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
            <ArrowUpRight className="w-4 h-4" /> Income
          </button>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Rule Description
          </label>
          <input
            type="text"
            placeholder="e.g. Monthly Salary, House Rent, Gym Pass"
            {...register('description')}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
          />
          {errors.description && <p className="text-xs text-rose-400 mt-1">{errors.description.message}</p>}
        </div>

        {/* Amount & Frequency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Amount ({currencyConfig.symbol})
            </label>
            <div className="relative rounded-xl border border-slate-800 bg-slate-950 focus-within:border-emerald-500">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                {currencyConfig.symbol}
              </span>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                {...register('amount', { valueAsNumber: true })}
                className="w-full bg-transparent pl-9 pr-4 py-2.5 text-sm font-bold text-white focus:outline-none"
              />
            </div>
            {errors.amount && <p className="text-xs text-rose-400 mt-1">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Frequency
            </label>
            <select
              {...register('frequency')}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Category
          </label>
          <select
            {...register('categoryId')}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none cursor-pointer"
          >
            <option value="" disabled>Select category</option>
            {availableCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.categoryId && <p className="text-xs text-rose-400 mt-1">{errors.categoryId.message}</p>}
        </div>

        {/* Start Date & End Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              {...register('startDate')}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              End Date (Optional)
            </label>
            <input
              type="date"
              {...register('endDate')}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

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
            {isSubmitting ? 'Saving...' : initialData ? 'Update Rule' : 'Create Rule'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
