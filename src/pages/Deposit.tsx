import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, TrendingUp, DollarSign, Search,
    CheckCircle2, ChevronRight, ChevronLeft, Wallet,
    BarChart2, AlertCircle, Loader2, X
} from 'lucide-react';

// ── Config ────────────────────────────────────────────────────────────────────
const SUPPORT_EMAIL = 'support@yourbroker.com'; // ← change this

interface UserData {
    firstName: string;
    lastName: string;
    email: string;
}

type DepositType = 'cash' | 'stock' | null;
type PaymentMethod = 'bank_transfer' | 'card' | 'wire' | '';

interface StockIntent {
    symbol: string;
    name: string;
    allocation: number; // percentage
}

interface FormState {
    depositType: DepositType;
    amount: string;
    paymentMethod: PaymentMethod;
    bankName: string;
    accountLast4: string;
    notes: string;
    // stock-specific
    stocks: StockIntent[];
    stockSearch: string;
}

const POPULAR_STOCKS = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corp.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'META', name: 'Meta Platforms' },
    { symbol: 'BRK.B', name: 'Berkshire Hathaway' },
];

const PAYMENT_METHODS = [
    { id: 'bank_transfer', label: 'Bank Transfer', sub: 'ACH / SEPA · 1–3 business days', icon: '🏦' },
    { id: 'wire', label: 'Wire Transfer', sub: 'Same day · fees may apply', icon: '⚡' },
    { id: 'card', label: 'Debit Card', sub: 'Instant · small processing fee', icon: '💳' },
];

// ── Step tracker ──────────────────────────────────────────────────────────────
const STEPS = ['Type', 'Amount', 'Payment', 'Review'];

export default function DepositPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [user, setUser] = useState<UserData>({ firstName: 'User', lastName: '', email: '' });
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [stockQuery, setStockQuery] = useState('');

    const [form, setForm] = useState<FormState>({
        depositType: null,
        amount: '',
        paymentMethod: '',
        bankName: '',
        accountLast4: '',
        notes: '',
        stocks: [],
        stockSearch: '',
    });

    useEffect(() => {
        try {
            const stored = localStorage.getItem('user');
            if (stored) setUser(JSON.parse(stored));
        } catch { /* ignore */ }
    }, []);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const set = (patch: Partial<FormState>) => setForm(f => ({ ...f, ...patch }));

    const totalAllocation = form.stocks.reduce((s, st) => s + st.allocation, 0);

    const addStock = (symbol: string, name: string) => {
        if (form.stocks.find(s => s.symbol === symbol)) return;
        const remaining = Math.max(0, 100 - totalAllocation);
        const allocation = form.stocks.length === 0 ? 100 : remaining;
        set({ stocks: [...form.stocks, { symbol, name, allocation }], stockSearch: '' });
        setStockQuery('');
    };

    const removeStock = (symbol: string) =>
        set({ stocks: form.stocks.filter(s => s.symbol !== symbol) });

    const updateAllocation = (symbol: string, value: number) =>
        set({ stocks: form.stocks.map(s => s.symbol === symbol ? { ...s, allocation: value } : s) });

    const filteredStocks = POPULAR_STOCKS.filter(s =>
        !form.stocks.find(fs => fs.symbol === s.symbol) &&
        (s.symbol.toLowerCase().includes(stockQuery.toLowerCase()) ||
            s.name.toLowerCase().includes(stockQuery.toLowerCase()))
    );

    // ── Email body builder ────────────────────────────────────────────────────
    const buildEmailBody = () => {
        const lines: string[] = [
            `DEPOSIT REQUEST`,
            `===============`,
            ``,
            `Client: ${user.firstName} ${user.lastName}`,
            `Email:  ${user.email}`,
            `Date:   ${new Date().toLocaleString()}`,
            ``,
            `── DEPOSIT DETAILS ──`,
            `Type:    ${form.depositType === 'cash' ? 'Cash Deposit' : 'Direct Stock Purchase'}`,
            `Amount:  $${parseFloat(form.amount || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            `Method:  ${PAYMENT_METHODS.find(p => p.id === form.paymentMethod)?.label ?? form.paymentMethod}`,
        ];

        if (form.bankName) lines.push(`Bank:    ${form.bankName}`);
        if (form.accountLast4) lines.push(`Acct:    ****${form.accountLast4}`);

        if (form.depositType === 'stock' && form.stocks.length > 0) {
            lines.push(``, `── STOCK ALLOCATIONS ──`);
            form.stocks.forEach(s => {
                const amt = (parseFloat(form.amount || '0') * s.allocation / 100);
                lines.push(`${s.symbol.padEnd(8)} ${s.name.padEnd(25)} ${s.allocation}%   $${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
            });
        }

        if (form.notes) {
            lines.push(``, `── NOTES ──`, form.notes);
        }

        lines.push(``, `──────────────────────────────────────────`, `Please process this request at your earliest convenience.`);
        return lines.join('\n');
    };

    const buildSubject = () =>
        `Deposit Request — ${user.firstName} ${user.lastName} — $${parseFloat(form.amount || '0').toLocaleString()} ${form.depositType === 'stock' ? '(Stock Purchase)' : '(Cash)'}`;

    // ── Submit: open mailto ───────────────────────────────────────────────────
    const handleSubmit = () => {
        setSubmitting(true);
        const subject = encodeURIComponent(buildSubject());
        const body = encodeURIComponent(buildEmailBody());
        const cc = user.email ? encodeURIComponent(user.email) : '';
        const mailto = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}${cc ? `&cc=${cc}` : ''}`;
        setTimeout(() => {
            window.location.href = mailto;
            setSubmitting(false);
            setDone(true);
        }, 800);
    };

    // ── Validation per step ───────────────────────────────────────────────────
    const canAdvance = () => {
        if (step === 0) return form.depositType !== null;
        if (step === 1) {
            const amt = parseFloat(form.amount);
            if (isNaN(amt) || amt < 10) return false;
            if (form.depositType === 'stock') return form.stocks.length > 0 && totalAllocation === 100;
            return true;
        }
        if (step === 2) return form.paymentMethod !== '';
        return true;
    };

    // ── Amount quick-pick ─────────────────────────────────────────────────────
    const QUICK_AMOUNTS = ['100', '500', '1000', '5000', '10000'];

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    if (done) return <SuccessScreen navigate={navigate} email={SUPPORT_EMAIL} />;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">

            {/* ── Top bar ── */}
            <header className="flex items-center gap-4 px-4 sm:px-8 py-5 border-b border-slate-800">
                <button onClick={() => step === 0 ? navigate(-1) : setStep(s => s - 1)}
                    className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-white font-bold text-lg">Deposit</h1>

                {/* Step pills */}
                <div className="ml-auto flex items-center gap-1.5">
                    {STEPS.map((label, i) => (
                        <div key={label} className="flex items-center gap-1.5">
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${i < step ? 'bg-emerald-500/20 text-emerald-400' :
                                i === step ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' :
                                    'bg-slate-800 text-slate-500'
                                }`}>
                                {i < step ? <CheckCircle2 size={11} /> : <span>{i + 1}</span>}
                                <span className="hidden sm:inline">{label}</span>
                            </div>
                            {i < STEPS.length - 1 && <div className={`w-4 h-px ${i < step ? 'bg-emerald-500' : 'bg-slate-700'}`} />}
                        </div>
                    ))}
                </div>
            </header>

            {/* ── Content ── */}
            <main className="flex-1 flex items-start justify-center px-4 py-8 sm:py-12">
                <div className="w-full max-w-xl space-y-6">

                    {/* ── STEP 0: Type ── */}
                    {step === 0 && (
                        <div className="space-y-4 animate-fadein">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">What would you like to do?</h2>
                                <p className="text-slate-400 text-sm">Choose how your funds will be used once deposited.</p>
                            </div>

                            {[
                                {
                                    id: 'cash' as DepositType,
                                    icon: <Wallet size={28} className="text-emerald-400" />,
                                    title: 'Deposit Cash',
                                    desc: 'Add funds to your cash balance. You can invest it whenever you\'re ready.',
                                    badge: 'Flexible',
                                    badgeColor: 'bg-emerald-500/20 text-emerald-400',
                                },
                                {
                                    id: 'stock' as DepositType,
                                    icon: <BarChart2 size={28} className="text-blue-400" />,
                                    title: 'Buy Stocks Directly',
                                    desc: 'Specify which stocks to purchase immediately when your deposit clears.',
                                    badge: 'Instant Invest',
                                    badgeColor: 'bg-blue-500/20 text-blue-400',
                                },
                            ].map(opt => (
                                <button key={opt.id} onClick={() => set({ depositType: opt.id })}
                                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 flex items-start gap-4 ${form.depositType === opt.id
                                        ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
                                        }`}>
                                    <div className="mt-0.5 shrink-0">{opt.icon}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-white font-semibold text-base">{opt.title}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${opt.badgeColor}`}>{opt.badge}</span>
                                        </div>
                                        <p className="text-slate-400 text-sm leading-relaxed">{opt.desc}</p>
                                    </div>
                                    <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${form.depositType === opt.id ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'
                                        }`}>
                                        {form.depositType === opt.id && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ── STEP 1: Amount + stock picker ── */}
                    {step === 1 && (
                        <div className="space-y-5 animate-fadein">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">
                                    {form.depositType === 'stock' ? 'How much & where?' : 'How much?'}
                                </h2>
                                <p className="text-slate-400 text-sm">Minimum deposit is $10.00</p>
                            </div>

                            {/* Amount input */}
                            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-4">
                                <label className="block text-slate-300 text-sm font-medium">Deposit Amount (USD)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-bold">$</span>
                                    <input
                                        type="number"
                                        min="10"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={form.amount}
                                        onChange={e => set({ amount: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-4 py-3.5 text-white text-2xl font-bold placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                                    />
                                </div>
                                {/* Quick amounts */}
                                <div className="flex flex-wrap gap-2">
                                    {QUICK_AMOUNTS.map(a => (
                                        <button key={a} onClick={() => set({ amount: a })}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${form.amount === a
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                                }`}>
                                            ${parseInt(a).toLocaleString()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Stock picker (only when stock mode) */}
                            {form.depositType === 'stock' && (
                                <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-slate-300 text-sm font-medium">Stock Allocation</label>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${totalAllocation === 100 ? 'bg-emerald-500/20 text-emerald-400' :
                                            totalAllocation > 100 ? 'bg-red-500/20 text-red-400' :
                                                'bg-amber-500/20 text-amber-400'
                                            }`}>
                                            {totalAllocation}% / 100%
                                        </span>
                                    </div>

                                    {/* Search */}
                                    <div className="relative">
                                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="text"
                                            placeholder="Search ticker or company…"
                                            value={stockQuery}
                                            onChange={e => setStockQuery(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                                        />
                                    </div>

                                    {/* Suggestions */}
                                    {stockQuery && (
                                        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
                                            {filteredStocks.length === 0
                                                ? <p className="text-slate-500 text-sm px-4 py-3">No matches found</p>
                                                : filteredStocks.slice(0, 5).map(s => (
                                                    <button key={s.symbol} onClick={() => addStock(s.symbol, s.name)}
                                                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-800 text-left transition">
                                                        <span className="text-white font-semibold text-sm">{s.symbol}</span>
                                                        <span className="text-slate-400 text-xs">{s.name}</span>
                                                    </button>
                                                ))
                                            }
                                        </div>
                                    )}

                                    {/* Selected stocks */}
                                    {form.stocks.length > 0 ? (
                                        <div className="space-y-3">
                                            {form.stocks.map(s => {
                                                const dollarAmt = parseFloat(form.amount || '0') * s.allocation / 100;
                                                return (
                                                    <div key={s.symbol} className="bg-slate-900/80 rounded-xl p-3 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                                                                    <span className="text-white text-[10px] font-bold">{s.symbol.slice(0, 2)}</span>
                                                                </div>
                                                                <div>
                                                                    <p className="text-white text-sm font-semibold">{s.symbol}</p>
                                                                    <p className="text-slate-500 text-[10px]">{s.name}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-emerald-400 text-sm font-bold">
                                                                    ${dollarAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </span>
                                                                <button onClick={() => removeStock(s.symbol)}
                                                                    className="text-slate-600 hover:text-red-400 transition">
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <input type="range" min="0" max="100" value={s.allocation}
                                                                onChange={e => updateAllocation(s.symbol, parseInt(e.target.value))}
                                                                className="flex-1 accent-emerald-500 h-1.5 rounded-full" />
                                                            <span className="text-white text-sm font-bold w-10 text-right">{s.allocation}%</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <TrendingUp size={28} className="mx-auto text-slate-700 mb-2" />
                                            <p className="text-slate-500 text-sm">Search and add stocks above</p>
                                        </div>
                                    )}

                                    {totalAllocation !== 100 && form.stocks.length > 0 && (
                                        <div className="flex items-center gap-2 text-amber-400 text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                                            <AlertCircle size={13} />
                                            Allocations must add up to exactly 100% before you can continue.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Notes */}
                            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-3">
                                <label className="block text-slate-300 text-sm font-medium">Additional Notes <span className="text-slate-600">(optional)</span></label>
                                <textarea
                                    rows={3}
                                    placeholder="Any special instructions or context for this deposit…"
                                    value={form.notes}
                                    onChange={e => set({ notes: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none transition"
                                />
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: Payment method ── */}
                    {step === 2 && (
                        <div className="space-y-5 animate-fadein">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">Payment Method</h2>
                                <p className="text-slate-400 text-sm">How will you be sending the funds?</p>
                            </div>

                            <div className="space-y-3">
                                {PAYMENT_METHODS.map(pm => (
                                    <button key={pm.id} onClick={() => set({ paymentMethod: pm.id as PaymentMethod })}
                                        className={`w-full text-left p-4 rounded-2xl border-2 flex items-center gap-4 transition-all duration-200 ${form.paymentMethod === pm.id
                                            ? 'border-emerald-500 bg-emerald-500/10'
                                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                                            }`}>
                                        <span className="text-2xl">{pm.icon}</span>
                                        <div className="flex-1">
                                            <p className="text-white font-semibold text-sm">{pm.label}</p>
                                            <p className="text-slate-500 text-xs">{pm.sub}</p>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${form.paymentMethod === pm.id ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'
                                            }`}>
                                            {form.paymentMethod === pm.id && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Optional bank details */}
                            {(form.paymentMethod === 'bank_transfer' || form.paymentMethod === 'wire') && (
                                <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-4">
                                    <p className="text-slate-300 text-sm font-medium">Bank Details <span className="text-slate-600">(optional)</span></p>
                                    <input type="text" placeholder="Bank name (e.g. Chase, Barclays)"
                                        value={form.bankName} onChange={e => set({ bankName: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition" />
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">****</span>
                                        <input type="text" maxLength={4} placeholder="Last 4 digits"
                                            value={form.accountLast4} onChange={e => set({ accountLast4: e.target.value.replace(/\D/, '') })}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-14 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── STEP 3: Review ── */}
                    {step === 3 && (
                        <div className="space-y-5 animate-fadein">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">Review Your Request</h2>
                                <p className="text-slate-400 text-sm">Check everything below, then submit. This will open your email client.</p>
                            </div>

                            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/10 px-5 py-4 border-b border-slate-700">
                                    <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-0.5">Deposit Summary</p>
                                    <p className="text-white text-3xl font-bold">
                                        ${parseFloat(form.amount || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>

                                {/* Rows */}
                                <div className="divide-y divide-slate-800">
                                    {[
                                        { label: 'Type', value: form.depositType === 'cash' ? '💵 Cash Deposit' : '📈 Direct Stock Purchase' },
                                        { label: 'Method', value: PAYMENT_METHODS.find(p => p.id === form.paymentMethod)?.label ?? '' },
                                        ...(form.bankName ? [{ label: 'Bank', value: form.bankName + (form.accountLast4 ? ` ****${form.accountLast4}` : '') }] : []),
                                        { label: 'From', value: user.email || '—' },
                                        { label: 'To', value: SUPPORT_EMAIL },
                                    ].map(row => (
                                        <div key={row.label} className="flex items-center justify-between px-5 py-3.5">
                                            <span className="text-slate-500 text-sm">{row.label}</span>
                                            <span className="text-white text-sm font-medium text-right max-w-[60%] truncate">{row.value}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Stock breakdown */}
                                {form.depositType === 'stock' && form.stocks.length > 0 && (
                                    <div className="border-t border-slate-700 px-5 py-4">
                                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Stock Allocations</p>
                                        <div className="space-y-2">
                                            {form.stocks.map(s => {
                                                const amt = parseFloat(form.amount || '0') * s.allocation / 100;
                                                return (
                                                    <div key={s.symbol} className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                                                                <span className="text-white text-[9px] font-bold">{s.symbol.slice(0, 2)}</span>
                                                            </div>
                                                            <span className="text-white text-sm font-semibold">{s.symbol}</span>
                                                            <span className="text-slate-500 text-xs">{s.allocation}%</span>
                                                        </div>
                                                        <span className="text-emerald-400 text-sm font-bold">
                                                            ${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {form.notes && (
                                    <div className="border-t border-slate-700 px-5 py-4">
                                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Notes</p>
                                        <p className="text-slate-300 text-sm">{form.notes}</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-start gap-2.5 text-slate-400 text-xs bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3">
                                <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                                Clicking "Submit" will open your email client with a pre-filled message to {SUPPORT_EMAIL}. Send it to complete your request.
                            </div>
                        </div>
                    )}

                    {/* ── Navigation buttons ── */}
                    <div className="flex gap-3 pt-2">
                        {step > 0 && (
                            <button onClick={() => setStep(s => s - 1)}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition text-sm font-medium">
                                <ChevronLeft size={16} /> Back
                            </button>
                        )}

                        {step < STEPS.length - 1 ? (
                            <button
                                onClick={() => canAdvance() && setStep(s => s + 1)}
                                disabled={!canAdvance()}
                                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 ${canAdvance()
                                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25'
                                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                    }`}>
                                Continue <ChevronRight size={16} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 disabled:opacity-60">
                                {submitting
                                    ? <><Loader2 size={16} className="animate-spin" /> Preparing…</>
                                    : <><DollarSign size={16} /> Submit Deposit Request</>
                                }
                            </button>
                        )}
                    </div>

                </div>
            </main>

            <style>{`
                @keyframes fadein {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .animate-fadein { animation: fadein 0.3s ease forwards; }
            `}</style>
        </div>
    );
}

// ── Success screen ────────────────────────────────────────────────────────────
function SuccessScreen({ navigate, email }: { navigate: (path: string) => void; email: string }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="text-center max-w-sm space-y-5">
                <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={40} className="text-emerald-400" />
                </div>
                <div>
                    <h2 className="text-white text-2xl font-bold mb-2">Request Ready!</h2>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Your email client should have opened with a pre-filled message to <span className="text-emerald-400">{email}</span>. Hit send to submit your deposit request.
                    </p>
                </div>
                <div className="flex flex-col gap-3">
                    <button onClick={() => navigate('/dashboard')}
                        className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition">
                        Back to Dashboard
                    </button>
                    <button onClick={() => navigate('/deposit')}
                        className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition">
                        Make Another Deposit
                    </button>
                </div>
            </div>
        </div>
    );
}