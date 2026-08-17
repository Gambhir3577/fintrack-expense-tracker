import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Modal } from '../../components/common/Modal';
import { SavingsGoal } from '../../types';
import { useSavingsGoalStore } from '../../store/useSavingsGoalStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useCurrencyStore } from '../../store/currencyStore';
import { AVAILABLE_ICONS, PALETTE_COLORS, CURRENCY_CONFIGS } from '../../utils/constants';
import { IconRenderer } from '../../components/common/IconRenderer';
import { Target, Calendar, Sparkles } from 'lucide-react';

const goalSchema = z.object({
  title: z.string().min(2, 'Goal title is required').max(60),
  targetAmount: z.number({ invalid_type_error: 'Target amount is required' }).positive('Must be greater than 0'),
  currentAmount: z.number().min(0),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid target date required'),
  icon: z.string(),
  color: z.string(),
  notes: z.string().optional(),
});

type GoalFormValues = z.infer<typeof goalSchema>;

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: SavingsGoal | null;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const { addGoal, updateGoal } = useSavingsGoalStore();
  const { showToast } = useSettingsStore();
  const { baseCurrency } = useCurrencyStore();
  const currencyConfig = CURRENCY_CONFIGS[baseCurrency] || CURRENCY_CONFIGS.INR;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: '',
      targetAmount: undefined as any,
      currentAmount: 0,
      targetDate: format(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      icon: 'Target',
      color: PALETTE_COLORS[0],
      notes: '',
    },
  });

  const selectedIcon = watch('icon');
  const selectedColor = watch('color');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          title: initialData.title,
          targetAmount: initialData.targetAmount,
          currentAmount: initialData.currentAmount,
          targetDate: initialData.targetDate,
          icon: initialData.icon || 'Target',
          color: initialData.color || PALETTE_COLORS[0],
          notes: initialData.notes || '',
        });
      } else {
        reset({
          title: '',
          targetAmount: undefined as any,
          currentAmount: 0,
          targetDate: format(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          icon: 'Target',
          color: PALETTE_COLORS[0],
          notes: '',
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (data: GoalFormValues) => {
    try {
      if (initialData) {
        await updateGoal(initialData.id, {
          title: data.title.trim(),
          targetAmount: data.targetAmount,
          currentAmount: data.currentAmount || 0,
          targetDate: data.targetDate,
          icon: data.icon,
          color: data.color,
          notes: data.notes?.trim() || undefined,
        });
        showToast('Savings goal updated successfully!', 'success');
      } else {
        await addGoal({
          title: data.title.trim(),
          targetAmount: data.targetAmount,
          currentAmount: data.currentAmount || 0,
          targetDate: data.targetDate,
          icon: data.icon,
          color: data.color,
          notes: data.notes?.trim() || undefined,
        });
        showToast('New savings goal created!', 'success');
      }
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to save goal', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Savings Goal' : 'Create New Savings Goal'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Goal Title
          </label>
          <div className="relative rounded-xl border border-slate-800 bg-slate-950 focus-within:border-emerald-500 transition-colors">
            <Target className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. Emergency Fund, Buy MacBook Pro, Goa Trip"
              {...register('title')}
              className="w-full bg-transparent pl-10 pr-4 py-2.5 text-sm font-semibold text-white focus:outline-none placeholder-slate-600"
            />
          </div>
          {errors.title && <p className="text-xs text-rose-400 mt-1">{errors.title.message}</p>}
        </div>

        {/* Target Amount & Initial Amount Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Target Amount ({currencyConfig.symbol})
            </label>
            <div className="relative rounded-xl border border-slate-800 bg-slate-950 focus-within:border-emerald-500 transition-colors">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                {currencyConfig.symbol}
              </span>
              <input
                type="number"
                step="any"
                placeholder="100000"
                {...register('targetAmount', { valueAsNumber: true })}
                className="w-full bg-transparent pl-9 pr-4 py-2.5 text-base font-bold text-white font-mono focus:outline-none"
              />
            </div>
            {errors.targetAmount && <p className="text-xs text-rose-400 mt-1">{errors.targetAmount.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Already Saved ({currencyConfig.symbol})
            </label>
            <div className="relative rounded-xl border border-slate-800 bg-slate-950 focus-within:border-emerald-500 transition-colors">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                {currencyConfig.symbol}
              </span>
              <input
                type="number"
                step="any"
                placeholder="0"
                {...register('currentAmount', { valueAsNumber: true })}
                className="w-full bg-transparent pl-9 pr-4 py-2.5 text-base font-bold text-slate-200 font-mono focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Target Date */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Target Completion Date
          </label>
          <div className="relative rounded-xl border border-slate-800 bg-slate-950 focus-within:border-emerald-500 transition-colors">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              {...register('targetDate')}
              className="w-full bg-transparent pl-10 pr-3 py-2.5 text-sm font-medium text-white focus:outline-none"
            />
          </div>
          {errors.targetDate && <p className="text-xs text-rose-400 mt-1">{errors.targetDate.message}</p>}
        </div>

        {/* Color Palette Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Goal Theme Color
          </label>
          <div className="flex flex-wrap gap-2.5">
            {PALETTE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setValue('color', color)}
                className={`w-7 h-7 rounded-xl transition-all ${
                  selectedColor === color ? 'scale-115 ring-2 ring-white shadow-lg' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Icon Selector Grid */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Goal Icon
          </label>
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800/80">
            {AVAILABLE_ICONS.map((iconName) => (
              <button
                key={iconName}
                type="button"
                onClick={() => setValue('icon', iconName)}
                className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                  selectedIcon === iconName
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <IconRenderer name={iconName} className="w-5 h-5" />
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Motivation / Notes (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Monthly SIP contribution or personal reward"
            {...register('notes')}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none placeholder-slate-600"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-md shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {initialData ? 'Update Goal' : 'Create Goal'}
          </button>
        </div>

      </form>
    </Modal>
  );
};
