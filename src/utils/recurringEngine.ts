import { addDays, addWeeks, addMonths, addYears, format, parseISO, isAfter, isBefore, isEqual } from 'date-fns';
import { RecurrenceRule, Transaction, RecurrenceFrequency } from '../types';

export function getNextOccurrenceDate(
  currentDateStr: string,
  frequency: RecurrenceFrequency
): string {
  const date = parseISO(currentDateStr);
  let nextDate: Date;

  switch (frequency) {
    case 'daily':
      nextDate = addDays(date, 1);
      break;
    case 'weekly':
      nextDate = addWeeks(date, 1);
      break;
    case 'monthly':
      nextDate = addMonths(date, 1);
      break;
    case 'yearly':
      nextDate = addYears(date, 1);
      break;
    default:
      nextDate = addMonths(date, 1);
  }

  return format(nextDate, 'yyyy-MM-dd');
}

export function generatePendingRecurringTransactions(
  rules: RecurrenceRule[],
  asOfDateStr: string = format(new Date(), 'yyyy-MM-dd')
): { newTransactions: Transaction[]; updatedRules: RecurrenceRule[] } {
  const asOfDate = parseISO(asOfDateStr);
  const newTransactions: Transaction[] = [];
  const updatedRules: RecurrenceRule[] = [];

  for (const rule of rules) {
    if (!rule.isActive) continue;

    let ruleUpdated = false;
    let currentRule = { ...rule };
    
    // Start generating from either the startDate or the day after lastGeneratedDate
    let nextDateStr = currentRule.lastGeneratedDate
      ? getNextOccurrenceDate(currentRule.lastGeneratedDate, currentRule.frequency)
      : currentRule.startDate;

    while (true) {
      const nextDate = parseISO(nextDateStr);
      
      // If next date is in the future relative to asOfDate, stop generating
      if (isAfter(nextDate, asOfDate)) {
        break;
      }

      // If end date is defined and next date has passed the end date, deactivate rule and stop
      if (currentRule.endDate) {
        const endDate = parseISO(currentRule.endDate);
        if (isAfter(nextDate, endDate)) {
          currentRule.isActive = false;
          ruleUpdated = true;
          break;
        }
      }

      // Create new transaction instance
      const newTx: Transaction = {
        id: `tx-rec-${currentRule.id}-${nextDateStr}-${Math.random().toString(36).substring(2, 7)}`,
        date: nextDateStr,
        description: currentRule.template.description,
        amount: currentRule.template.amount,
        type: currentRule.template.type,
        categoryId: currentRule.template.categoryId,
        isRecurring: true,
        recurringRuleId: currentRule.id,
        notes: currentRule.template.notes ? `[Auto Recurring] ${currentRule.template.notes}` : '[Auto Recurring]',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      newTransactions.push(newTx);
      currentRule.lastGeneratedDate = nextDateStr;
      currentRule.updatedAt = new Date().toISOString();
      ruleUpdated = true;

      // Advance to next cycle
      nextDateStr = getNextOccurrenceDate(nextDateStr, currentRule.frequency);
    }

    if (ruleUpdated) {
      updatedRules.push(currentRule);
    }
  }

  return { newTransactions, updatedRules };
}

export function computeNextScheduledDate(rule: RecurrenceRule): string {
  if (!rule.lastGeneratedDate) {
    return rule.startDate;
  }
  return getNextOccurrenceDate(rule.lastGeneratedDate, rule.frequency);
}
