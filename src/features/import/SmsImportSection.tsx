import React, { useState } from 'react';
import {
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  Check,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ArrowRight,
  Sparkles,
  Smartphone,
  Eye,
  EyeOff,
  Plus,
} from 'lucide-react';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useTransactionStore } from '../../store/useTransactionStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useCurrencyStore } from '../../store/currencyStore';
import { fetchRecentSms, isNative } from '../../utils/nativeSms';
import { parseSmsBatch, parseSingleSms, ParsedDraftTransaction } from '../../utils/smsParser';
import { formatCurrency } from '../../utils/formatters';
import confetti from 'canvas-confetti';

export const SmsImportSection: React.FC = () => {
  const { categories } = useCategoryStore();
  const { bulkAddTransactions } = useTransactionStore();
  const { showToast } = useSettingsStore();
  const { baseCurrency } = useCurrencyStore();

  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [drafts, setDrafts] = useState<ParsedDraftTransaction[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedSmsId, setExpandedSmsId] = useState<string | null>(null);

  // Manual SMS paste testing state
  const [manualSmsText, setManualSmsText] = useState('');

  const handleScanSms = async () => {
    setIsScanning(true);
    try {
      const { messages, isSimulated } = await fetchRecentSms(100);
      const parsed = parseSmsBatch(messages, categories);

      setDrafts(parsed);
      setSelectedIds(new Set(parsed.map((d) => d.id)));
      setHasScanned(true);

      if (parsed.length > 0) {
        showToast(
          `Found ${parsed.length} bank transaction ${parsed.length === 1 ? 'alert' : 'alerts'}!`,
          'success'
        );
      } else {
        showToast('No new bank or UPI transaction messages found in inbox.', 'info');
      }

      if (isSimulated && !isNative) {
        showToast('Loaded simulated bank SMS for web demo.', 'info');
      }
    } catch (err: any) {
      console.warn('SMS scan error:', err);
      showToast(err.message || 'SMS permission denied or unavailable.', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const handleParseManualSms = () => {
    if (!manualSmsText.trim()) return;

    const dummyMsg = {
      id: `manual-${Date.now()}`,
      sender: 'MANUAL',
      body: manualSmsText.trim(),
      date: Date.now(),
    };

    const parsed = parseSingleSms(dummyMsg, categories);
    if (parsed) {
      setDrafts((prev) => [parsed, ...prev]);
      setSelectedIds((prev) => new Set([...prev, parsed.id]));
      setManualSmsText('');
      setHasScanned(true);
      showToast('Successfully parsed transaction from SMS!', 'success');
    } else {
      showToast('Could not find debit/credit amount in the pasted message.', 'warning');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === drafts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(drafts.map((d) => d.id)));
    }
  };

  const handleDeleteDraft = (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleUpdateDraft = (id: string, updates: Partial<ParsedDraftTransaction>) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
  };

  const handleConfirmImport = async () => {
    const toImport = drafts.filter((d) => selectedIds.has(d.id));
    if (toImport.length === 0) {
      showToast('No drafts selected for import', 'warning');
      return;
    }

    try {
      const txPayloads = toImport.map((d) => ({
        description: d.merchant,
        amount: d.amount,
        type: d.type,
        categoryId: d.categoryId || categories[0]?.id || 'cat-food',
        date: d.date,
        isRecurring: false,
        notes: `Auto-imported on-device from bank SMS (${d.sender})`,
      }));

      const count = await bulkAddTransactions(txPayloads);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      showToast(`Imported ${count} transactions from SMS!`, 'success');

      // Clear imported drafts
      setDrafts((prev) => prev.filter((d) => !selectedIds.has(d.id)));
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error(err);
      showToast('Failed to import transactions', 'error');
    }
  };

  const selectedCount = selectedIds.size;
  const selectedTotal = drafts
    .filter((d) => selectedIds.has(d.id))
    .reduce((sum, d) => sum + (d.type === 'expense' ? -d.amount : d.amount), 0);

  return (
    <div className="space-y-6">
      {/* Privacy Notice Banner */}
      <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">100% On-Device Bank SMS Parser</h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Zero Cloud Upload
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              FinTrack analyzes bank and UPI transaction SMS messages directly inside your device memory using local regular expressions.
              Raw SMS text is never uploaded, stored on servers, or processed by cloud models.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleScanSms}
          disabled={isScanning}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'Scanning Inbox...' : 'Scan Bank SMS'}</span>
        </button>
      </div>

      {/* Manual SMS Paste Test (Great for Web & Testing) */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test On-Device Parser with Sample Bank SMS</span>
          </label>
          <span className="text-[11px] text-slate-500">Supports HDFC, SBI, ICICI, Axis, UPI</span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={manualSmsText}
            onChange={(e) => setManualSmsText(e.target.value)}
            placeholder="Paste SMS (e.g. INR 450.00 debited from A/C XX1234 to Swiggy on 16-Oct-26)"
            className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleParseManualSms();
              }
            }}
          />
          <button
            type="button"
            onClick={handleParseManualSms}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold shrink-0 transition-colors"
          >
            Parse
          </button>
        </div>

        {/* Quick Sample Test Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-slate-500 font-medium mr-1">Quick Samples:</span>
          {[
            { label: '🍕 Swiggy ₹450', text: 'Dear Customer, INR 450.00 debited from A/C ending 4901 on 16-OCT-26 to Swiggy. Avl Bal: INR 34,210.00.' },
            { label: '🚗 Uber ₹850', text: 'Your a/c no. XX9876 is debited by Rs. 850.00 on 16Oct26 towards Uber India ref no 341291.' },
            { label: '💼 Salary ₹75,000', text: 'Your Acct XX4321 is credited with INR 75,000.00 on 16-Oct-26 by Salary Oct 2026. Available Balance is INR 1,12,000.' },
            { label: '🛒 Blinkit ₹2,199', text: 'Rs. 2,199.00 spent on Axis Bank Credit Card ending 7781 at Blinkit Groceries on 15-Oct-26.' },
          ].map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setManualSmsText(sample.text);
                const dummyMsg = {
                  id: `sample-${Date.now()}-${idx}`,
                  sender: 'SAMPLE',
                  body: sample.text,
                  date: Date.now(),
                };
                const parsed = parseSingleSms(dummyMsg, categories);
                if (parsed) {
                  setDrafts((prev) => [parsed, ...prev.filter((d) => d.rawText !== sample.text)]);
                  setSelectedIds((prev) => new Set([...prev, parsed.id]));
                  setHasScanned(true);
                  showToast(`Parsed ${sample.label}!`, 'success');
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-medium transition-all cursor-pointer"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Draft Review & Confirmation Table */}
      {drafts.length > 0 ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center ${
                    selectedCount === drafts.length
                      ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                      : 'border-slate-700 bg-slate-900'
                  }`}
                >
                  {selectedCount === drafts.length && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span>
                  {selectedCount === drafts.length ? 'Deselect All' : 'Select All'} ({drafts.length} drafts)
                </span>
              </button>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <span className="text-xs text-slate-400">
                Selected Net:{' '}
                <strong className={`font-mono ${selectedTotal >= 0 ? 'text-emerald-400' : 'text-slate-200'}`}>
                  {formatCurrency(Math.abs(selectedTotal), baseCurrency)}
                </strong>
              </span>

              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={selectedCount === 0}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-40"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Import Selected ({selectedCount})</span>
              </button>
            </div>
          </div>

          {/* Draft Items */}
          <div className="space-y-2.5">
            {drafts.map((draft) => {
              const isSelected = selectedIds.has(draft.id);
              const isExpanded = expandedSmsId === draft.id;

              return (
                <div
                  key={draft.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-slate-900/90 border-slate-700/80'
                      : 'bg-slate-950/60 border-slate-800/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(draft.id)}
                      className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-950 cursor-pointer"
                    />

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      {/* Merchant & Account */}
                      <div className="sm:col-span-4 min-w-0">
                        <input
                          type="text"
                          value={draft.merchant}
                          onChange={(e) => handleUpdateDraft(draft.id, { merchant: e.target.value })}
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-semibold text-white focus:border-emerald-500 focus:outline-none"
                        />
                        {draft.accountDigits && (
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            A/C **{draft.accountDigits} • via {draft.sender}
                          </p>
                        )}
                      </div>

                      {/* Category Selector */}
                      <div className="sm:col-span-3">
                        <select
                          value={draft.categoryId}
                          onChange={(e) => {
                            const cat = categories.find((c) => c.id === e.target.value);
                            handleUpdateDraft(draft.id, {
                              categoryId: e.target.value,
                              categoryName: cat?.name || 'Category',
                            });
                          }}
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:border-emerald-500 focus:outline-none cursor-pointer"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Date */}
                      <div className="sm:col-span-2">
                        <input
                          type="date"
                          value={draft.date}
                          onChange={(e) => handleUpdateDraft(draft.id, { date: e.target.value })}
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:border-emerald-500 focus:outline-none font-mono"
                        />
                      </div>

                      {/* Amount & Type Badge */}
                      <div className="sm:col-span-3 flex items-center justify-between sm:justify-end gap-3">
                        <div className="text-right">
                          <span
                            className={`font-mono font-bold text-sm ${
                              draft.type === 'income' ? 'text-emerald-400' : 'text-white'
                            }`}
                          >
                            {draft.type === 'income' ? '+' : '-'}
                            {formatCurrency(draft.amount, baseCurrency)}
                          </span>
                          <span
                            className={`block text-[10px] font-bold uppercase tracking-wider ${
                              draft.type === 'income' ? 'text-emerald-400' : 'text-slate-400'
                            }`}
                          >
                            {draft.type}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setExpandedSmsId(isExpanded ? null : draft.id)}
                            className="p-1.5 text-slate-400 hover:text-white rounded"
                            title="View original SMS"
                          >
                            {isExpanded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDraft(draft.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded"
                            title="Remove draft"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Original SMS Expandable Drawer */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 pl-7 text-[11px] font-mono text-slate-400 bg-slate-950/50 p-2.5 rounded-lg">
                      <p className="text-slate-500 font-semibold mb-0.5">Original SMS Body:</p>
                      <p className="text-slate-300 select-all whitespace-pre-wrap">{draft.rawText}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : hasScanned ? (
        <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <h4 className="text-sm font-bold text-white">All Caught Up!</h4>
          <p className="text-xs text-slate-400">
            No pending bank or UPI transactions to import from your SMS inbox.
          </p>
        </div>
      ) : null}
    </div>
  );
};
