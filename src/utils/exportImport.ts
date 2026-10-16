import Papa from 'papaparse';
import { db } from '../db';
import { Transaction, Category } from '../types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Native Share Sheet or Web Blob file download
 */
export async function shareOrDownloadFile(
  filename: string,
  content: string,
  mimeType: string,
  title: string
): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      const savedFile = await Filesystem.writeFile({
        path: filename,
        data: content,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      await Share.share({
        title,
        text: `Exported ${title} from FinTrack AI`,
        url: savedFile.uri,
        dialogTitle: `Share or Save ${filename}`,
      });
      return;
    } catch (err: any) {
      console.warn('Native share error, falling back to browser download:', err);
    }
  }

  // Web Browser fallback
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportTransactionsToCSV(transactions: Transaction[], categories: Category[]): Promise<void> {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const data = transactions.map((t) => ({
    ID: t.id,
    Date: t.date,
    Description: t.description,
    Amount: t.amount,
    Type: t.type,
    Category: categoryMap.get(t.categoryId) || 'Uncategorized',
    IsRecurring: t.isRecurring ? 'Yes' : 'No',
    Notes: t.notes || '',
    CreatedAt: t.createdAt,
  }));

  const csv = Papa.unparse(data);
  const filename = `fintrack-transactions-${new Date().toISOString().split('T')[0]}.csv`;
  await shareOrDownloadFile(filename, csv, 'text/csv;charset=utf-8;', 'Transactions CSV');
}

export async function exportFullBackupJSON(): Promise<void> {
  const transactions = await db.transactions.toArray();
  const categories = await db.categories.toArray();
  const budgets = await db.budgets.toArray();
  const recurringRules = await db.recurringRules.toArray();
  const settings = await db.settings.toArray();

  const backupPayload = {
    version: 1,
    appName: 'FinTrack',
    exportedAt: new Date().toISOString(),
    data: {
      transactions,
      categories,
      budgets,
      recurringRules,
      settings,
    },
  };

  const jsonStr = JSON.stringify(backupPayload, null, 2);
  const filename = `fintrack-backup-${new Date().toISOString().split('T')[0]}.json`;
  await shareOrDownloadFile(filename, jsonStr, 'application/json;charset=utf-8;', 'FinTrack JSON Backup');
}

export async function restoreBackupFromJSON(jsonString: string): Promise<{ success: boolean; message: string; counts?: { transactions: number; categories: number; budgets: number; rules: number } }> {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !parsed.data) {
      return { success: false, message: 'Invalid backup file structure.' };
    }

    const { transactions, categories, budgets, recurringRules, settings } = parsed.data;

    await db.transaction('rw', db.transactions, db.categories, db.budgets, db.recurringRules, db.settings, async () => {
      if (Array.isArray(transactions)) {
        await db.transactions.clear();
        if (transactions.length > 0) await db.transactions.bulkAdd(transactions);
      }
      if (Array.isArray(categories)) {
        await db.categories.clear();
        if (categories.length > 0) await db.categories.bulkAdd(categories);
      }
      if (Array.isArray(budgets)) {
        await db.budgets.clear();
        if (budgets.length > 0) await db.budgets.bulkAdd(budgets);
      }
      if (Array.isArray(recurringRules)) {
        await db.recurringRules.clear();
        if (recurringRules.length > 0) await db.recurringRules.bulkAdd(recurringRules);
      }
      if (Array.isArray(settings)) {
        await db.settings.clear();
        if (settings.length > 0) await db.settings.bulkAdd(settings);
      }
    });

    return {
      success: true,
      message: 'Backup restored successfully!',
      counts: {
        transactions: transactions?.length || 0,
        categories: categories?.length || 0,
        budgets: budgets?.length || 0,
        rules: recurringRules?.length || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to parse JSON backup file.',
    };
  }
}
