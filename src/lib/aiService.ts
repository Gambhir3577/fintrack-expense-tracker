import { Transaction, Category, BudgetGoal, RecurrenceRule, SupportedCurrency } from '../types';
import { formatCurrency, formatPercent, formatDateString } from '../utils/formatters';
import { format, subDays, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';

export interface FinancialContext {
  netBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  savingsRate: number;
  baseCurrency: SupportedCurrency;
  topExpenseCategories: Array<{ category: Category; amount: number; percentage: number }>;
  overBudgetCategories: Array<{ category: Category; spent: number; limit: number; excess: number }>;
  upcomingRecurring: Array<{ rule: RecurrenceRule; category?: Category }>;
  daysRemainingInMonth: number;
  recentTransactions: Transaction[];
  categories: Category[];
}

export interface ParsedTransactionDraft {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  date: string;
  confidence: number;
  categoryName: string;
}

export interface FinancialAuditResult {
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  score: number;
  headline: string;
  summary: string;
  strengths: string[];
  risks: string[];
  recommendations: string[];
  projectedSavings: number;
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  actionCard?: {
    type: 'transaction_draft' | 'audit_report' | 'forecast_card';
    data: any;
  };
}

export interface AIKeyConfig {
  provider: 'local' | 'gemini' | 'openai';
  apiKey?: string;
}

/**
 * Parses natural language user input into a structured transaction draft.
 * E.g. "Paid ₹1,250 for groceries at Blinkit today"
 */
export function parseNaturalLanguageTransaction(
  input: string,
  categories: Category[],
  baseCurrency: SupportedCurrency = 'INR'
): ParsedTransactionDraft | null {
  const text = input.trim();
  if (!text) return null;

  // 1. Detect Amount (e.g. ₹1,25,000, ₹1,250, 1250 rs, INR 500, 45.50)
  const amountRegex = /(?:₹|rs\.?|inr|\$|€|£)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)\s*(?:rs\.?|inr|rupees|bucks)?/i;
  const match = text.match(amountRegex);

  let amount = 0;
  if (match && match[1]) {
    amount = parseFloat(match[1].replace(/,/g, ''));
  }

  if (!amount || isNaN(amount) || amount <= 0) {
    return null;
  }

  // 2. Detect Type (Income vs Expense)
  const incomeKeywords = ['salary', 'income', 'received', 'credited', 'earned', 'got paid', 'freelance', 'dividend', 'deposit', 'bonus', 'refund'];
  const lower = text.toLowerCase();
  const isIncome = incomeKeywords.some((k) => lower.includes(k));
  const type: 'income' | 'expense' = isIncome ? 'income' : 'expense';

  // 3. Detect Date
  let date = format(new Date(), 'yyyy-MM-dd');
  if (lower.includes('yesterday')) {
    date = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  } else if (lower.includes('2 days ago') || lower.includes('day before yesterday')) {
    date = format(subDays(new Date(), 2), 'yyyy-MM-dd');
  }

  // 4. Match Category using intelligent keyword heuristics
  const categoryKeywords: Record<string, string[]> = {
    'cat-food': ['food', 'dining', 'lunch', 'dinner', 'breakfast', 'restaurant', 'swiggy', 'zomato', 'starbucks', 'coffee', 'cafe', 'burger', 'pizza', 'biryani', 'snack', 'deli', 'treat', 'drink', 'bar'],
    'cat-groceries': ['grocery', 'groceries', 'supermarket', 'market', 'blinkit', 'zepto', 'bigbasket', 'instamart', 'dmart', 'whole foods', 'vegetable', 'fruits', 'milk', 'bread', 'walmart'],
    'cat-transport': ['uber', 'ola', 'cab', 'taxi', 'fuel', 'petrol', 'diesel', 'gas', 'metro', 'train', 'bus', 'flight', 'parking', 'toll', 'auto', 'commute', 'rapido'],
    'cat-housing': ['rent', 'maintenance', 'apartment', 'house', 'landlord', 'flat', 'lease', 'mortgage', 'society'],
    'cat-utilities': ['electricity', 'power', 'water', 'gas bill', 'wifi', 'broadband', 'airtel', 'jio', 'mobile recharge', 'internet', 'utility', 'recharge'],
    'cat-subscriptions': ['netflix', 'spotify', 'prime', 'apple', 'youtube', 'hotstar', 'icloud', 'software', 'subscription', 'annual pass', 'membership'],
    'cat-shopping': ['shopping', 'amazon', 'flipkart', 'myntra', 'clothes', 'shoes', 'electronics', 'gadget', 'laptop', 'cable', 'dress', 'ikea'],
    'cat-health': ['gym', 'cult.fit', 'fitness', 'doctor', 'hospital', 'medicine', 'pharmacy', 'medical', 'yoga', 'wellness', 'supplements'],
    'cat-entertainment': ['movie', 'cinema', 'pvr', 'theatre', 'concert', 'game', 'steam', 'bookmyshow', 'outing', 'party', 'live band'],
    'cat-salary': ['salary', 'paycheck', 'payroll', 'wages', 'stipend', 'bonus'],
    'cat-freelance': ['freelance', 'consulting', 'project', 'client', 'gig', 'upwork', 'fiverr'],
    'cat-investments': ['dividend', 'interest', 'stocks', 'mutual fund', 'crypto', 'shares', 'sip'],
  };

  let matchedCatId = type === 'income' ? 'cat-salary' : 'cat-food';
  let bestConfidence = 0.5;

  for (const [catId, keywords] of Object.entries(categoryKeywords)) {
    const hasMatch = keywords.some((k) => lower.includes(k));
    if (hasMatch) {
      matchedCatId = catId;
      bestConfidence = 0.85;
      break;
    }
  }

  // Fallback if category doesn't exist
  const existingCat = categories.find((c) => c.id === matchedCatId) || categories[0];
  const catId = existingCat ? existingCat.id : (categories[0]?.id || 'cat-food');
  const catName = existingCat ? existingCat.name : 'General';

  // 5. Clean Description
  let cleanDesc = text
    .replace(/(?:₹|rs\.?|inr|\$|€|£)?\s*[0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?\s*(?:rs\.?|inr|rupees|bucks)?/gi, '')
    .replace(/\b(today|yesterday|for|paid|spent|bought|received|got|on|at|i)\b/gi, '')
    .trim();

  cleanDesc = cleanDesc.replace(/^[\s,.-]+|[\s,.-]+$/g, '');
  if (!cleanDesc || cleanDesc.length < 2) {
    cleanDesc = `${catName} Entry`;
  } else {
    cleanDesc = cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1);
  }

  return {
    description: cleanDesc,
    amount,
    type,
    categoryId: catId,
    categoryName: catName,
    date,
    confidence: bestConfidence,
  };
}

/**
 * Generates an automated deep financial health audit.
 */
export function generateFinancialAuditReport(ctx: FinancialContext): FinancialAuditResult {
  let score = 70;
  const strengths: string[] = [];
  const risks: string[] = [];
  const recommendations: string[] = [];

  // Savings rate evaluation
  if (ctx.savingsRate >= 40) {
    score += 20;
    strengths.push(`Exceptional savings rate of ${formatPercent(ctx.savingsRate)} (target is ≥20%).`);
  } else if (ctx.savingsRate >= 20) {
    score += 10;
    strengths.push(`Healthy savings rate of ${formatPercent(ctx.savingsRate)}.`);
  } else if (ctx.savingsRate > 0) {
    score -= 5;
    risks.push(`Low savings rate of ${formatPercent(ctx.savingsRate)} — try building a larger financial cushion.`);
    recommendations.push(`Aim to save at least 20% of monthly income (${formatCurrency(ctx.monthlyIncome * 0.2, ctx.baseCurrency)}).`);
  } else {
    score -= 25;
    risks.push(`Negative cash flow: Monthly expenses exceed income by ${formatCurrency(ctx.monthlyExpense - ctx.monthlyIncome, ctx.baseCurrency)}.`);
    recommendations.push('Immediate spending pause recommended on discretionary shopping and leisure.');
  }

  // Budget overspend evaluation
  if (ctx.overBudgetCategories.length > 0) {
    score -= ctx.overBudgetCategories.length * 8;
    const overNames = ctx.overBudgetCategories.map((c) => c.category.name).join(', ');
    risks.push(`${ctx.overBudgetCategories.length} categories exceeded budget limits: ${overNames}.`);
    recommendations.push(`Cap dining and shopping allocations for the remaining ${ctx.daysRemainingInMonth} days.`);
  } else {
    score += 8;
    strengths.push('All budgeted categories are currently within assigned limits.');
  }

  // Net balance buffer
  if (ctx.netBalance > ctx.monthlyExpense * 3) {
    score += 10;
    strengths.push('Strong emergency runway: Net balance covers >3 months of expenses.');
  } else if (ctx.netBalance < ctx.monthlyExpense) {
    score -= 10;
    risks.push('Low emergency reserve: Total balance is less than 1 month of living expenses.');
    recommendations.push('Focus on building an emergency reserve equal to 3 months of expenses.');
  }

  // Final score clamping & grade
  score = Math.max(20, Math.min(99, score));
  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' = 'B';
  if (score >= 90) grade = 'A+';
  else if (score >= 80) grade = 'A';
  else if (score >= 65) grade = 'B';
  else if (score >= 50) grade = 'C';
  else grade = 'D';

  const potentialMonthlySavings = Math.round(
    ctx.topExpenseCategories.slice(0, 2).reduce((sum, c) => sum + c.amount * 0.15, 0)
  );

  return {
    grade,
    score,
    headline: grade.startsWith('A')
      ? 'Outstanding Financial Health & Pacing'
      : grade === 'B'
      ? 'Solid Financial Foundation with Optimization Potential'
      : 'Budget Attention Needed to Prevent Deficits',
    summary: `Your monthly inflow is ${formatCurrency(ctx.monthlyIncome, ctx.baseCurrency)} against ${formatCurrency(ctx.monthlyExpense, ctx.baseCurrency)} in expenses, yielding a ${formatPercent(ctx.savingsRate)} savings rate with ${ctx.daysRemainingInMonth} days left in the billing cycle.`,
    strengths,
    risks,
    recommendations,
    projectedSavings: potentialMonthlySavings,
  };
}

/**
 * Generates an end-of-month cash flow forecast.
 */
export function generateCashFlowForecast(ctx: FinancialContext) {
  const today = new Date();
  const daysInMonth = differenceInDays(endOfMonth(today), startOfMonth(today)) + 1;
  const daysElapsed = Math.max(1, daysInMonth - ctx.daysRemainingInMonth);

  const dailyBurnRate = ctx.monthlyExpense / daysElapsed;
  const projectedRemainingExpense = dailyBurnRate * ctx.daysRemainingInMonth;
  const totalProjectedMonthExpense = ctx.monthlyExpense + projectedRemainingExpense;
  const projectedNetSavings = ctx.monthlyIncome - totalProjectedMonthExpense;

  return {
    dailyBurnRate: Math.round(dailyBurnRate),
    projectedRemainingExpense: Math.round(projectedRemainingExpense),
    totalProjectedMonthExpense: Math.round(totalProjectedMonthExpense),
    projectedNetSavings: Math.round(projectedNetSavings),
    isPositivePacing: projectedNetSavings >= 0,
  };
}

/**
 * Main AI Query Dispatcher with Local Rule Engine & Optional LLM Gateway
 */
export async function processAIQuery(
  query: string,
  ctx: FinancialContext,
  keyConfig?: AIKeyConfig
): Promise<AIMessage> {
  const lower = query.toLowerCase().trim();
  const timestamp = new Date().toISOString();
  const id = `msg-${Date.now()}`;

  // 1. If remote Gemini or OpenAI API key is provided and user enabled remote mode
  if (keyConfig && keyConfig.provider !== 'local' && keyConfig.apiKey) {
    try {
      const responseText = await callRemoteLLM(query, ctx, keyConfig);
      return {
        id,
        sender: 'assistant',
        content: responseText,
        timestamp,
      };
    } catch (err) {
      console.warn('Remote LLM failed, falling back to local intelligence engine:', err);
    }
  }

  // 2. High-Performance Local Financial Intelligence Engine (Zero-Latency)

  // Intent A: Natural Language Transaction Entry
  const parsedTx = parseNaturalLanguageTransaction(query, ctx.categories, ctx.baseCurrency);
  const isExplicitTxLogging = lower.includes('paid') || lower.includes('spent') || lower.includes('bought') || lower.includes('add transaction') || lower.includes('record') || lower.includes('got salary');

  if (parsedTx && (isExplicitTxLogging || parsedTx.confidence >= 0.8)) {
    return {
      id,
      sender: 'assistant',
      content: `I've analyzed and drafted this **${parsedTx.type}** entry for you: **${formatCurrency(parsedTx.amount, ctx.baseCurrency)}** under **${parsedTx.categoryName}**. Click below to confirm and record it to your local vault!`,
      timestamp,
      actionCard: {
        type: 'transaction_draft',
        data: parsedTx,
      },
    };
  }

  // Intent B: Financial Health Audit
  if (lower.includes('audit') || lower.includes('health') || lower.includes('grade') || lower.includes('diagnose') || lower.includes('how am i doing') || lower.includes('financial status')) {
    const audit = generateFinancialAuditReport(ctx);
    return {
      id,
      sender: 'assistant',
      content: `Here is your comprehensive **Financial Health Audit**! Your current score is **${audit.score}/100** (Grade **${audit.grade}**).`,
      timestamp,
      actionCard: {
        type: 'audit_report',
        data: audit,
      },
    };
  }

  // Intent C: Cash Flow Forecast & Projection
  if (lower.includes('forecast') || lower.includes('project') || lower.includes('burn rate') || lower.includes('end of month') || lower.includes('runway') || lower.includes('predict')) {
    const forecast = generateCashFlowForecast(ctx);
    return {
      id,
      sender: 'assistant',
      content: `Based on your average spending pace of **${formatCurrency(forecast.dailyBurnRate, ctx.baseCurrency)}/day**, here is your end-of-month financial projection:`,
      timestamp,
      actionCard: {
        type: 'forecast_card',
        data: forecast,
      },
    };
  }

  // Intent D: Category Spending Breakdown
  if (lower.includes('where') || lower.includes('category') || lower.includes('breakdown') || lower.includes('most') || lower.includes('spending on')) {
    if (ctx.topExpenseCategories.length === 0) {
      return {
        id,
        sender: 'assistant',
        content: `You haven't recorded any expenses for this month yet. Use **New Transaction** or simply tell me *"Paid ₹500 for lunch"* to start tracking!`,
        timestamp,
      };
    }

    const topList = ctx.topExpenseCategories.slice(0, 4).map(
      (c, idx) => `${idx + 1}. **${c.category.name}**: ${formatCurrency(c.amount, ctx.baseCurrency)} (${formatPercent(c.percentage)})`
    ).join('\n');

    return {
      id,
      sender: 'assistant',
      content: `Here is your highest expense breakdown for this month:\n\n${topList}\n\n💡 **Insight**: Your top category accounts for ${formatPercent(ctx.topExpenseCategories[0]?.percentage || 0)} of your monthly expenses.`,
      timestamp,
    };
  }

  // Intent E: Savings Advice & Tips
  if (lower.includes('save') || lower.includes('tip') || lower.includes('advice') || lower.includes('cut') || lower.includes('reduce')) {
    const topCat = ctx.topExpenseCategories[0]?.category?.name || 'Dining & Shopping';
    const audit = generateFinancialAuditReport(ctx);

    return {
      id,
      sender: 'assistant',
      content: `### 💡 Personalized Financial Recommendations:\n\n1. **Focus on ${topCat}**: Trimming just 15% from this category can save you **${formatCurrency(audit.projectedSavings, ctx.baseCurrency)}** this month.\n2. **Automate Savings First**: Transfer your target 20% savings (${formatCurrency(ctx.monthlyIncome * 0.2, ctx.baseCurrency)}) on salary day before allocating discretionary spending.\n3. **Review Recurring Rules**: Check your **${ctx.upcomingRecurring.length}** recurring subscriptions to ensure you aren't paying for unused streaming or fitness tiers.\n4. **Current Savings Rate**: You are currently saving **${formatPercent(ctx.savingsRate)}** of your monthly income.`,
      timestamp,
    };
  }

  // Intent F: Recurring / Subscriptions Query
  if (lower.includes('recurring') || lower.includes('subscription') || lower.includes('bills') || lower.includes('rent')) {
    if (ctx.upcomingRecurring.length === 0) {
      return {
        id,
        sender: 'assistant',
        content: `You currently have no active recurring rules. You can add recurring salary deposits, rent, or Netflix in the **Recurring Rules** section or ask me to schedule one!`,
        timestamp,
      };
    }

    const subList = ctx.upcomingRecurring.map(
      (r) => `• **${r.rule.template.description}**: ${formatCurrency(r.rule.template.amount, ctx.baseCurrency)} (${r.rule.frequency})`
    ).join('\n');

    return {
      id,
      sender: 'assistant',
      content: `Here are your scheduled recurring inflows and subscriptions:\n\n${subList}\n\nThese are processed automatically based on their due date!`,
      timestamp,
    };
  }

  // Default Context-Aware Overview
  return {
    id,
    sender: 'assistant',
    content: `Hello! I'm your **FinTrack AI Financial Intelligence Copilot**.\n\nHere is your real-time financial snapshot:\n• **Net Balance**: ${formatCurrency(ctx.netBalance, ctx.baseCurrency)}\n• **Monthly Income**: ${formatCurrency(ctx.monthlyIncome, ctx.baseCurrency)}\n• **Monthly Expense**: ${formatCurrency(ctx.monthlyExpense, ctx.baseCurrency)}\n• **Savings Rate**: ${formatPercent(ctx.savingsRate)}\n\nHow can I assist you? You can ask me to:\n1. *"Audit my financial health"*\n2. *"Forecast my cash flow"*\n3. *"Where did most of my money go?"*\n4. Or record an entry: *"Paid ₹450 for coffee at Starbucks"*`,
    timestamp,
  };
}

/**
 * Optional Remote LLM Gateway (Gemini 1.5 Flash / OpenAI)
 */
async function callRemoteLLM(prompt: string, ctx: FinancialContext, config: AIKeyConfig): Promise<string> {
  const systemContext = `You are FinTrack AI, a precise, helpful, and privacy-first personal financial advisor.
Current User Financial Context:
- Base Currency: ${ctx.baseCurrency}
- Net Balance: ${ctx.netBalance}
- Monthly Income: ${ctx.monthlyIncome}
- Monthly Expenses: ${ctx.monthlyExpense}
- Savings Rate: ${ctx.savingsRate}%
- Top Expenses: ${ctx.topExpenseCategories.map(c => `${c.category.name}: ${c.amount}`).join(', ')}
- Over-budget Categories: ${ctx.overBudgetCategories.map(c => `${c.category.name} (exceeded by ${c.excess})`).join(', ')}
- Days remaining in month: ${ctx.daysRemainingInMonth}

Respond concisely with clear markdown formatting. Be encouraging, quantitative, and give actionable financial guidance.`;

  if (config.provider === 'gemini' && config.apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemContext}\n\nUser Question: ${prompt}` }] },
        ],
      }),
    });

    if (!res.ok) throw new Error(`Gemini API error: ${res.statusText}`);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received from Gemini.';
  }

  if (config.provider === 'openai' && config.apiKey) {
    const url = 'https://api.openai.com/v1/chat/completions';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemContext },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!res.ok) throw new Error(`OpenAI API error: ${res.statusText}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || 'No response received from OpenAI.';
  }

  throw new Error('Unsupported AI provider configuration');
}
