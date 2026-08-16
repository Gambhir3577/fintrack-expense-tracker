import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  Trash2,
  Sparkles,
  Download,
  AlertCircle,
} from 'lucide-react';
import { parseCSVFile, detectColumnMapping, processParsedRows } from '../../utils/csvParser';
import { useTransactionStore } from '../../store/useTransactionStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { CSVColumnMapping, CSVParsedRow, TransactionType } from '../../types';
import { formatCurrency, formatDateString } from '../../utils/formatters';
import { IconRenderer } from '../../components/common/IconRenderer';
import confetti from 'canvas-confetti';

export const CSVImportPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { transactions, bulkAddTransactions } = useTransactionStore();
  const { categories } = useCategoryStore();
  const { settings, showToast } = useSettingsStore();

  // Wizard Steps: 1: Upload -> 2: Map Columns -> 3: Preview & Confirm
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Parsed Raw State
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<CSVColumnMapping>({
    date: '',
    description: '',
    amount: '',
    type: '',
    category: '',
  });

  // Processed Preview Rows
  const [processedRows, setProcessedRows] = useState<CSVParsedRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // File Upload Handler
  const handleFileUpload = async (file: File) => {
    try {
      if (!file.name.endsWith('.csv')) {
        showToast('Please upload a valid .csv file', 'error');
        return;
      }

      setFileName(file.name);
      const parsed = await parseCSVFile(file);
      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        showToast('CSV file is empty or missing headers', 'error');
        return;
      }

      setHeaders(parsed.headers);
      setRawRows(parsed.rows);

      // Auto-detect columns
      const detected = detectColumnMapping(parsed.headers);
      setMapping(detected);

      setStep(2);
      showToast(`Loaded ${parsed.rows.length} rows from ${file.name}`, 'info');
    } catch (err) {
      console.error(err);
      showToast('Failed to parse CSV file', 'error');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Step 2 -> Step 3: Run processing
  const handleProceedToPreview = () => {
    if (!mapping.date || !mapping.description || !mapping.amount) {
      showToast('Date, Description, and Amount columns are required for mapping', 'warning');
      return;
    }

    const processed = processParsedRows(rawRows, mapping, categories, transactions);
    setProcessedRows(processed);
    setStep(3);
  };

  // Row Modification Handlers in Preview Table
  const handleToggleInclude = (id: string) => {
    setProcessedRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, includeInImport: !row.includeInImport } : row))
    );
  };

  const handleToggleSelectAll = (select: boolean) => {
    setProcessedRows((prev) =>
      prev.map((row) => (row.isValid ? { ...row, includeInImport: select } : row))
    );
  };

  const handleUpdateRowCategory = (id: string, categoryId: string) => {
    setProcessedRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, mapped: { ...row.mapped, categoryId } } : row
      )
    );
  };

  const handleUpdateRowType = (id: string, type: TransactionType) => {
    setProcessedRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, mapped: { ...row.mapped, type } } : row
      )
    );
  };

  const handleUpdateRowDesc = (id: string, description: string) => {
    setProcessedRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, mapped: { ...row.mapped, description } } : row
      )
    );
  };

  // Final Import Confirmation
  const handleConfirmImport = async () => {
    const validToImport = processedRows.filter((r) => r.isValid && r.includeInImport);
    if (validToImport.length === 0) {
      showToast('No valid transactions selected for import', 'warning');
      return;
    }

    setIsImporting(true);
    try {
      const itemsToAdd = validToImport.map((r) => ({
        date: r.mapped.date,
        description: r.mapped.description,
        amount: r.mapped.amount,
        type: r.mapped.type,
        categoryId: r.mapped.categoryId,
        isRecurring: false,
        notes: `[Imported from ${fileName}]`,
      }));

      await bulkAddTransactions(itemsToAdd);

      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
      });

      showToast(`Successfully imported ${itemsToAdd.length} transactions!`, 'success');
      navigate('/transactions');
    } catch (err) {
      console.error(err);
      showToast('Failed to save imported transactions', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  // Sample CSV generator for testing
  const handleDownloadSampleCSV = () => {
    const sample = `Date,Description,Amount,Category,Type
2026-08-10,Whole Foods Market,115.40,Groceries,Debit
2026-08-11,Uber Ride Downtown,24.50,Transport,Debit
2026-08-12,Starbucks Reserve,8.75,Food & Dining,Debit
2026-08-13,Monthly Consulting Fee,1500.00,Freelance,Credit
2026-08-14,Netflix Subscription,22.99,Subscriptions,Debit
2026-08-15,Electric Utility Bill,95.20,Utilities,Debit`;

    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'fintrack-sample-bank-statement.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Downloaded sample CSV template', 'info');
  };

  const validSelectedCount = processedRows.filter((r) => r.isValid && r.includeInImport).length;
  const duplicateCount = processedRows.filter((r) => r.isDuplicate).length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            CSV Bank Statement Import
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Import transactions from any bank with smart column mapping and auto-categorization
          </p>
        </div>

        <button
          onClick={handleDownloadSampleCSV}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-slate-400" />
          <span>Download Sample CSV</span>
        </button>
      </div>

      {/* Wizard Progress Steps Indicator */}
      <div className="grid grid-cols-3 gap-3 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs font-semibold">
        <div
          className={`flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${
            step === 1
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">1</span>
          <span>Upload File</span>
        </div>

        <div
          className={`flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${
            step === 2
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">2</span>
          <span>Match Columns</span>
        </div>

        <div
          className={`flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${
            step === 3
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">3</span>
          <span>Review & Confirm</span>
        </div>
      </div>

      {/* STEP 1: Upload Screen */}
      {step === 1 && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-3xl p-8 sm:p-14 text-center bg-slate-900/40 hover:bg-slate-900/60 transition-all cursor-pointer shadow-xl"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="hidden"
          />

          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-4 shadow-inner">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-bold text-white mb-1">
            Drag and drop your bank CSV statement
          </h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
            Supports Chase, Bank of America, Wells Fargo, Amex, Apple Card, Revolut, PayPal, and custom exports.
          </p>

          <button
            type="button"
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
          >
            Browse Computer
          </button>
        </div>
      )}

      {/* STEP 2: Column Mapping */}
      {step === 2 && (
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white">Map CSV Columns</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                We analyzed <strong>{fileName}</strong> ({rawRows.length} rows). Confirm the matched columns below.
              </p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" /> Change File
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Date Column */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Date Column <span className="text-rose-400">*</span>
              </label>
              <select
                value={mapping.date}
                onChange={(e) => setMapping({ ...mapping, date: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Select column...</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h} (Sample: "{rawRows[0]?.[h] || ''}")
                  </option>
                ))}
              </select>
            </div>

            {/* Description Column */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Description / Payee <span className="text-rose-400">*</span>
              </label>
              <select
                value={mapping.description}
                onChange={(e) => setMapping({ ...mapping, description: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Select column...</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h} (Sample: "{rawRows[0]?.[h] || ''}")
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Column */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Amount <span className="text-rose-400">*</span>
              </label>
              <select
                value={mapping.amount}
                onChange={(e) => setMapping({ ...mapping, amount: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Select column...</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h} (Sample: "{rawRows[0]?.[h] || ''}")
                  </option>
                ))}
              </select>
            </div>

            {/* Type Column (Optional) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Type / Direction (Optional)
              </label>
              <select
                value={mapping.type || ''}
                onChange={(e) => setMapping({ ...mapping, type: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Auto-detect from amount +/- sign</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h} (Sample: "{rawRows[0]?.[h] || ''}")
                  </option>
                ))}
              </select>
            </div>

            {/* Category Column (Optional) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Category Column (Optional)
              </label>
              <select
                value={mapping.category || ''}
                onChange={(e) => setMapping({ ...mapping, category: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Use Smart Auto-Categorizer</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h} (Sample: "{rawRows[0]?.[h] || ''}")
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Back
            </button>
            <button
              onClick={handleProceedToPreview}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-md shadow-emerald-500/20 transition-all"
            >
              <span>Process & Review</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Preview, Editable Grid & Confirm */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Summary Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
            <div>
              <h3 className="text-base font-bold text-white">
                Import Preview ({validSelectedCount} of {processedRows.length} ready)
              </h3>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                {duplicateCount > 0 && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" /> {duplicateCount} potential duplicate(s)
                  </span>
                )}
                <span>Review & modify category suggestions before confirming</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setStep(2)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Remap Columns
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={isImporting || validSelectedCount === 0}
                className="flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isImporting ? 'Importing...' : `Confirm Import (${validSelectedCount})`}</span>
              </button>
            </div>
          </div>

          {/* Quick Select All / Deselect Toolbar */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleToggleSelectAll(true)}
                className="text-emerald-400 hover:underline font-semibold"
              >
                Select All Valid
              </button>
              <span>•</span>
              <button
                onClick={() => handleToggleSelectAll(false)}
                className="text-slate-400 hover:underline"
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Editable Preview Table */}
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-200">
                <thead className="bg-slate-950/80 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-4 w-10">Include</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Category (Auto-Suggested)</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {processedRows.map((row) => {
                    const isIncome = row.mapped.type === 'income';

                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          !row.includeInImport ? 'opacity-45 bg-slate-950/40' : ''
                        }`}
                      >
                        {/* Include Checkbox */}
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={row.includeInImport}
                            disabled={!row.isValid}
                            onChange={() => handleToggleInclude(row.id)}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/20"
                          />
                        </td>

                        {/* Date */}
                        <td className="p-4 whitespace-nowrap text-xs font-semibold text-slate-300">
                          {formatDateString(row.mapped.date, 'MMM dd, yyyy')}
                        </td>

                        {/* Description */}
                        <td className="p-4">
                          <input
                            type="text"
                            value={row.mapped.description}
                            onChange={(e) => handleUpdateRowDesc(row.id, e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:border-emerald-500 focus:outline-none"
                          />
                        </td>

                        {/* Amount */}
                        <td className="p-4 whitespace-nowrap">
                          <span
                            className={`font-mono font-bold text-xs sm:text-sm ${
                              isIncome ? 'text-emerald-400' : 'text-slate-100'
                            }`}
                          >
                            {isIncome ? '+' : '-'}{formatCurrency(row.mapped.amount, settings.currency)}
                          </span>
                        </td>

                        {/* Type Select */}
                        <td className="p-4">
                          <select
                            value={row.mapped.type}
                            onChange={(e) => handleUpdateRowType(row.id, e.target.value as TransactionType)}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-semibold text-slate-200 focus:outline-none"
                          >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                          </select>
                        </td>

                        {/* Category Dropdown */}
                        <td className="p-4">
                          <select
                            value={row.mapped.categoryId}
                            onChange={(e) => handleUpdateRowCategory(row.id, e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                          >
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Status Badge */}
                        <td className="p-4 text-center whitespace-nowrap">
                          {!row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                              <AlertCircle className="w-3 h-3" /> Error
                            </span>
                          ) : row.isDuplicate ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                              <AlertTriangle className="w-3 h-3" /> Duplicate
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Ready
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
