import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Modal } from '../../components/common/Modal';
import { Transaction, TransactionType, RecurrenceFrequency } from '../../types';
import { useTransactionStore } from '../../store/useTransactionStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useRecurringStore } from '../../store/useRecurringStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useCurrencyStore } from '../../store/currencyStore';
import { CURRENCY_CONFIGS } from '../../utils/constants';
import { IconRenderer } from '../../components/common/IconRenderer';
import { ArrowUpRight, ArrowDownLeft, Calendar, Tag, FileText, Repeat } from 'lucide-react';

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number({ invalid_type_error: 'Amount is required' }).positive({ message: 'Amount must be greater than 0' }),
  description: z.string().min(1, { message: 'Description is required' }).max(100),
  categoryId: z.string().min(1, { message: 'Please select a category' }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Valid date required' }),
  notes: z.string().optional(),
  isRecurring: z.boolean(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Transaction | null;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const { addTransaction, updateTransaction } = useTransactionStore();
  const { categories } = useCategoryStore();
  const { addRule } = useRecurringStore();
  const { showToast } = useSettingsStore();
  const { baseCurrency } = useCurrencyStore();

  const currencyConfig = CURRENCY_CONFIGS[baseCurrency] || CURRENCY_CONFIGS.INR;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      amount: undefined as any,
      description: '',
      categoryId: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
      isRecurring: false,
      frequency: 'monthly',
    },
  });

  const selectedType = watch('type');
  const isRecurring = watch('isRecurring');

  // Filter categories based on transaction type
  const availableCategories = categories.filter(
    (c) => c.type === 'both' || c.type === selectedType
  );

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          type: initialData.type,
          amount: initialData.amount,
          description: initialData.description,
          categoryId: initialData.categoryId,
          date: initialData.date,
          notes: initialData.notes || '',
          isRecurring: initialData.isRecurring,
          frequency: 'monthly',
        });
      } else {
        const defaultCat = availableCategories[0]?.id || '';
        reset({
          type: 'expense',
          amount: undefined as any,
          description: '',
          categoryId: defaultCat,
          date: format(new Date(), 'yyyy-MM-dd'),
          notes: '',
          isRecurring: false,
          frequency: 'monthly',
        });
      }
    }
  }, [isOpen, initialData, reset]);

  // Set default category when type switches
  useEffect(() => {
    const currentCatId = watch('categoryId');
    const isValidForType = availableCategories.some((c) => c.id === currentCatId);
    if (!isValidForType && availableCategories.length > 0) {
      setValue('categoryId', availableCategories[0].id);
    }
  }, [selectedType, availableCategories, setValue, watch]);

  const onSubmit = async (data: TransactionFormValues) => {
    try {
      if (initialData) {
        await updateTransaction({
          ...initialData,
          type: data.type,
          amount: data.amount,
          description: data.description.trim(),
          categoryId: data.categoryId,
          date: data.date,
          notes: data.notes?.trim() || undefined,
          isRecurring: data.isRecurring,
        });
        showToast('Transaction updated successfully', 'success');
      } else {
        let recurringRuleId: string | undefined;

        // If user set this as recurring, create recurring rule too
        if (data.isRecurring && data.frequency) {
          const rule = await addRule({
            frequency: data.frequency as RecurrenceFrequency,
            startDate: data.date,
            lastGeneratedDate: data.date, // marked as generated for today
            isActive: true,
            template: {
              description: data.description.trim(),
              amount: data.amount,
              type: data.type,
              categoryId: data.categoryId,
              notes: data.notes?.trim() || undefined,
            },
          });
          recurringRuleId = rule.id;
        }

        await addTransaction({
          type: data.type,
          amount: data.amount,
          description: data.description.trim(),
          categoryId: data.categoryId,
          date: data.date,
          notes: data.notes?.trim() || undefined,
          isRecurring: data.isRecurring,
          recurringRuleId,
        });
        showToast('Transaction recorded successfully', 'success');
      }
      onClose();
    } catch (error) {
      console.error('Save transaction error:', error);
      showToast('Failed to save transaction', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Transaction' : 'Record Transaction'}
      subtitle={initialData ? 'Modify transaction parameters' : 'Track an expense or income entry'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Type Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setValue('type', 'expense')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              selectedType === 'expense'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            Expense
          </button>
          <button
            type="button"
            onClick={() => setValue('type', 'income')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              selectedType === 'income'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            Income
          </button>
        </div>

        {/* Amount & Date Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Amount ({currencyConfig.symbol})
            </label>
            <div className="relative rounded-xl border border-slate-800 bg-slate-950 focus-within:border-emerald-500 transition-colors">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                {currencyConfig.symbol}
              </span>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                {...register('amount', { valueAsNumber: true })}
                className="w-full bg-transparent pl-9 pr-4 py-2.5 text-lg font-bold text-white placeholder-slate-600 focus:outline-none"
              />
            </div>
            {errors.amount && <p className="text-xs text-rose-400 mt-1">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Date
            </label>
            <div className="relative rounded-xl border border-slate-800 bg-slate-950 focus-within:border-emerald-500 transition-colors">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                {...register('date')}
                className="w-full bg-transparent pl-10 pr-3 py-2.5 text-sm font-medium text-white focus:outline-none"
              />
            </div>
            {errors.date && <p className="text-xs text-rose-400 mt-1">{errors.date.message}</p>}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Description
          </label>
          <input
            type="text"
            placeholder="e.g. Whole Foods Groceries, Client Payment"
            {...register('description')}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition-colors"
          />
          {errors.description && <p className="text-xs text-rose-400 mt-1">{errors.description.message}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Category
          </label>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <select
                  {...field}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors appearance-none cursor-pointer"
                >
                  <option value="" disabled>Select category</option>
                  {availableCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <Tag className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            )}
          />
          {errors.categoryId && <p className="text-xs text-rose-400 mt-1">{errors.categoryId.message}</p>}
        </div>

        {/* Notes (Optional) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Notes (Optional)
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Add memo or invoice reference..."
              {...register('notes')}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Recurring Toggle (Only when creating new transaction) */}
        {!initialData && (
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register('isRecurring')}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/20"
                />
                <span className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                  <Repeat className="w-4 h-4 text-emerald-400" />
                  Make this a recurring rule
                </span>
              </label>
            </div>

            {isRecurring && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 animate-fade-in">
                <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1.5">
                  Frequency Cycle
                </label>
                <select
                  {...register('frequency')}
                  className="w-full rounded-lg border border-emerald-500/30 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <p className="text-xs text-slate-400 mt-1.5">
                  FinTrack will automatically generate new entries on every recurring cycle.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-lg shadow-emerald-500/20 transition-all font-sans"
          >
            {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Add Transaction'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
