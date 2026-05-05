import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp, TrendingDown, Activity, Eye, EyeOff,
    Wallet, RefreshCw, Users, Lock, ShieldCheck, Zap, Globe
} from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import PopularStocks from '../components/PopularStocks';
import { API_BASE_URL } from '../utils';

interface Stock {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    logo: string;
}

interface PortfolioStock {
    symbol: string;
    name: string;
    shares: number;
    avgPrice: number;
    currentPrice: number;
    value: number;
    gain: number;
    gainPercent: number;
}

interface UserData {
    firstName: string;
    lastName: string;
    email?: string;
}

interface NewsItem {
    headline: string;
    summary: string;
    source: string;
    tag: string;
    url: string;
    readTime: string;
    publishedAt: string;
}

interface MarketIndex {
    label: string;
    value: string;
    change: string;
    up: boolean;
}

// ─── News Card ────────────────────────────────────────────────────────────────
function NewsCard() {
    const [items, setItems] = useState<NewsItem[]>([]);
    const [index, setIndex] = useState(0);
    const [visible, setVisible] = useState(true);
    const [loading, setLoading] = useState(true);
    const [paused, setPaused] = useState(false);

    const fallback: NewsItem[] = [
        { headline: 'S&P 500 edges higher as tech earnings beat expectations', summary: 'Major indices climbed as several large-cap technology companies posted quarterly results that surpassed analyst forecasts, boosting investor confidence across the broader market.', source: 'Reuters', tag: 'Markets', url: 'https://www.reuters.com/markets/', readTime: '2 min read', publishedAt: '14 min ago' },
        { headline: 'Federal Reserve signals rate hold as inflation data cools', summary: 'Fed officials indicated they are content to leave borrowing costs unchanged after the latest CPI print came in below expectations, suggesting the tightening cycle may be nearing its end.', source: 'Bloomberg', tag: 'Fed', url: 'https://www.bloomberg.com/economics', readTime: '3 min read', publishedAt: '38 min ago' },
        { headline: 'Apple reports record services revenue in Q2 earnings', summary: 'The iPhone maker beat Wall Street estimates on both revenue and earnings per share, driven by a surge in App Store and subscription income that offset a modest decline in hardware sales.', source: 'CNBC', tag: 'Stocks', url: 'https://www.cnbc.com/technology/', readTime: '2 min read', publishedAt: '1 hr ago' },
        { headline: 'Bitcoin surges past $65,000 on ETF inflow momentum', summary: 'The flagship cryptocurrency extended its rally as spot Bitcoin ETFs continued to attract fresh capital, with cumulative inflows crossing $15 billion since launch earlier this year.', source: 'CoinDesk', tag: 'Crypto', url: 'https://www.coindesk.com', readTime: '2 min read', publishedAt: '2 hr ago' },
        { headline: 'Oil prices dip as OPEC output concerns ease', summary: 'Crude futures pulled back after reports emerged that key OPEC+ members are unlikely to extend production cuts beyond the current agreement, raising expectations of higher supply in Q3.', source: 'Financial Times', tag: 'Economy', url: 'https://www.ft.com/markets', readTime: '2 min read', publishedAt: '3 hr ago' },
        { headline: 'Nvidia extends rally after data center demand outlook raised', summary: 'Shares in the chip giant hit a fresh all-time high after management reiterated strong forward guidance for AI infrastructure spending, with hyperscalers ramping GPU orders significantly.', source: 'WSJ', tag: 'Stocks', url: 'https://www.wsj.com/market-data', readTime: '3 min read', publishedAt: '4 hr ago' },
        { headline: 'Jobs report surprises to the upside with 250K new positions', summary: 'Non-farm payrolls for the month exceeded consensus estimates by a wide margin, with gains broad-based across services, healthcare, and construction sectors, keeping unemployment at multi-decade lows.', source: 'Reuters', tag: 'Economy', url: 'https://www.reuters.com/markets/', readTime: '2 min read', publishedAt: '5 hr ago' },
        { headline: 'Tesla deliveries miss estimates; shares slide in premarket', summary: 'The EV maker reported quarterly delivery numbers that fell short of analyst projections, citing production disruptions at its Berlin factory and softer demand in the Chinese market.', source: 'CNBC', tag: 'Stocks', url: 'https://www.cnbc.com/technology/', readTime: '2 min read', publishedAt: '6 hr ago' },
    ];

    useEffect(() => {
        fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 2000,
                tools: [{ type: 'web_search_20250305', name: 'web_search' }],
                messages: [{
                    role: 'user',
                    content: `Search for the latest 8 financial market news stories right now.
Return ONLY a raw JSON array — no markdown, no backticks, no explanation.
Each element must have exactly these keys:
{
  "headline": "concise news headline",
  "summary": "2-3 sentence summary of the story with key facts and context",
  "source": "publication name",
  "tag": "one of: Markets | Stocks | Economy | Crypto | Fed",
  "url": "direct link to the article",
  "readTime": "X min read",
  "publishedAt": "relative time like 5 min ago or 2 hr ago"
}`
                }]
            })
        })
            .then(r => r.json())
            .then(data => {
                const text = (data.content ?? [])
                    .filter((b: { type: string }) => b.type === 'text')
                    .map((b: { text: string }) => b.text)
                    .join('');
                const match = text.match(/\[[\s\S]*?\]/);
                if (match) {
                    const parsed = JSON.parse(match[0]) as NewsItem[];
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setItems(parsed);
                        setLoading(false);
                        return;
                    }
                }
                throw new Error('parse failed');
            })
            .catch(() => { setItems(fallback); setLoading(false); });
    }, []);

    useEffect(() => {
        if (items.length === 0 || paused) return;
        const timer = setInterval(() => {
            setVisible(false);
            setTimeout(() => { setIndex(i => (i + 1) % items.length); setVisible(true); }, 350);
        }, 5000);
        return () => clearInterval(timer);
    }, [items, paused]);

    const goTo = (i: number) => {
        setVisible(false);
        setTimeout(() => { setIndex(i); setVisible(true); }, 350);
    };
    const prev = () => goTo((index - 1 + items.length) % items.length);
    const next = () => goTo((index + 1) % items.length);

    const TAG_STYLES: Record<string, { pill: string; dot: string }> = {
        Markets: { pill: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-500' },
        Stocks: { pill: 'bg-blue-500/20 text-blue-400 border-blue-500/30', dot: 'bg-blue-500' },
        Economy: { pill: 'bg-amber-500/20 text-amber-400 border-amber-500/30', dot: 'bg-amber-500' },
        Crypto: { pill: 'bg-violet-500/20 text-violet-400 border-violet-500/30', dot: 'bg-violet-500' },
        Fed: { pill: 'bg-red-500/20 text-red-400 border-red-500/30', dot: 'bg-red-500' },
    };

    const current = items[index];
    const tagStyle = current ? (TAG_STYLES[current.tag] ?? TAG_STYLES['Markets']) : TAG_STYLES['Markets'];

    if (loading) {
        return (
            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-5 space-y-3 animate-pulse">
                <div className="flex items-center gap-3">
                    <div className="h-4 w-16 bg-slate-700 rounded-full" />
                    <div className="h-3 w-24 bg-slate-700 rounded" />
                </div>
                <div className="h-6 w-3/4 bg-slate-700 rounded" />
                <div className="space-y-2">
                    <div className="h-3 w-full bg-slate-700 rounded" />
                    <div className="h-3 w-5/6 bg-slate-700 rounded" />
                    <div className="h-3 w-4/6 bg-slate-700 rounded" />
                </div>
                <div className="flex gap-2 pt-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="h-1.5 w-6 bg-slate-700 rounded-full" />)}
                </div>
            </div>
        );
    }

    return (
        <div
            className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl overflow-hidden"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-white font-semibold text-sm">Market News</span>
                    <span className="text-slate-600 text-xs">·</span>
                    <span className="text-slate-500 text-xs">{index + 1} of {items.length}</span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={prev} className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
                    </button>
                    <button onClick={next} className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
                    </button>
                </div>
            </div>

            {current && (
                <a
                    href={current.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-5 py-4 group"
                    style={{
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateY(0)' : 'translateY(8px)',
                        transition: 'opacity 0.35s ease, transform 0.35s ease',
                    }}
                >
                    <div className="flex items-center gap-2 mb-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tagStyle.pill}`}>{current.tag}</span>
                        <span className="text-slate-500 text-xs">{current.source}</span>
                        <span className="text-slate-700 text-xs">·</span>
                        <span className="text-slate-500 text-xs">{current.publishedAt}</span>
                        <span className="text-slate-700 text-xs">·</span>
                        <span className="text-slate-500 text-xs">{current.readTime}</span>
                    </div>
                    <h3 className="text-white font-bold text-base leading-snug mb-2 group-hover:text-emerald-400 transition-colors duration-200">{current.headline}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">{current.summary}</p>
                    <div className="flex items-center gap-1 mt-3 text-emerald-500 text-xs font-semibold group-hover:gap-2 transition-all duration-200">
                        <span>Read full story</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </div>
                </a>
            )}

            <div className="px-5 pb-4">
                <div className="h-0.5 bg-slate-800 rounded-full mb-3 overflow-hidden">
                    <div
                        key={`${index}-${paused}`}
                        className="h-full rounded-full bg-emerald-500"
                        style={{ animation: paused ? 'none' : 'newsProgress 5s linear forwards', width: paused ? undefined : '0%' }}
                    />
                </div>
                <div className="flex items-center gap-1">
                    {items.map((item, i) => {
                        const s = TAG_STYLES[item.tag] ?? TAG_STYLES['Markets'];
                        return (
                            <button
                                key={i}
                                onClick={() => goTo(i)}
                                className={`rounded-full transition-all duration-300 ${i === index ? `w-5 h-2 ${s.dot}` : 'w-2 h-2 bg-slate-700 hover:bg-slate-500'}`}
                            />
                        );
                    })}
                </div>
            </div>
            <style>{`@keyframes newsProgress { from { width: 0% } to { width: 100% } }`}</style>
        </div>
    );
}

// ─── Market Snapshot ──────────────────────────────────────────────────────────
function MarketSnapshot() {
    const [indices, setIndices] = useState<MarketIndex[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState('');

    const fmt = (n: number) =>
        new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

    const fetchMarketData = useCallback(async () => {
        try {
            // Fetch S&P 500 (SPY), NASDAQ (QQQ), DOW (DIA) from your backend
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const [stocksRes, btcRes] = await Promise.all([
                fetch(`${API_BASE_URL}/stocks/quotes?symbols=SPY,QQQ,DIA`, { headers }).catch(() => null),
                fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true').catch(() => null),
            ]);

            const result: MarketIndex[] = [];

            if (stocksRes?.ok) {
                const data = await stocksRes.json();
                // Support both { quotes: [] } and flat []
                const quotes: { symbol: string; price: number; changePercent: number }[] =
                    Array.isArray(data) ? data : (data.quotes ?? data.stocks ?? []);

                const labelMap: Record<string, string> = { SPY: 'S&P 500', QQQ: 'NASDAQ', DIA: 'DOW' };
                quotes.forEach(q => {
                    if (labelMap[q.symbol]) {
                        result.push({
                            label: labelMap[q.symbol],
                            value: fmt(q.price),
                            change: `${q.changePercent >= 0 ? '+' : ''}${fmt(q.changePercent)}%`,
                            up: q.changePercent >= 0,
                        });
                    }
                });
            }

            if (btcRes?.ok) {
                const btcData = await btcRes.json();
                const price: number = btcData?.bitcoin?.usd ?? 0;
                const change: number = btcData?.bitcoin?.usd_24h_change ?? 0;
                result.push({
                    label: 'BTC/USD',
                    value: `$${new Intl.NumberFormat('en-US').format(Math.round(price))}`,
                    change: `${change >= 0 ? '+' : ''}${fmt(change)}%`,
                    up: change >= 0,
                });
            }

            if (result.length > 0) {
                setIndices(result);
            } else {
                throw new Error('no data');
            }

            setLastUpdated(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        } catch {
            // Silently keep previous data or show nothing
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchMarketData();
        const interval = setInterval(() => void fetchMarketData(), 30000);
        return () => clearInterval(interval);
    }, [fetchMarketData]);

    return (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-5 py-4">
            <div className="flex items-center justify-between mb-3">
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Market Snapshot</p>
                {lastUpdated !== '' && (
                    <p className="text-slate-600 text-[10px]">Updated {lastUpdated}</p>
                )}
            </div>

            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-pulse">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="space-y-1.5">
                            <div className="h-2.5 w-16 bg-slate-800 rounded" />
                            <div className="h-4 w-20 bg-slate-800 rounded" />
                            <div className="h-3 w-12 bg-slate-800 rounded" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {indices.map(({ label, value, change, up }) => (
                        <div key={label} className="flex flex-col gap-0.5">
                            <p className="text-slate-500 text-xs">{label}</p>
                            <p className="text-white text-sm font-bold">{value}</p>
                            <div className="flex items-center gap-1">
                                {up
                                    ? <TrendingUp size={11} className="text-emerald-400" />
                                    : <TrendingDown size={11} className="text-red-400" />}
                                <p className={`text-xs font-semibold ${up ? 'text-emerald-400' : 'text-red-400'}`}>{change}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState<UserData>({ firstName: 'John', lastName: 'Doe' });
    const [portfolio, setPortfolio] = useState<PortfolioStock[]>([]);
    const [totalValue, setTotalValue] = useState(0);
    const [totalChange, setTotalChange] = useState(0);
    const [totalChangePercent, setTotalChangePercent] = useState(0);
    const [isBalanceHidden, setIsBalanceHidden] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [popularStocks, setPopularStocks] = useState<Stock[]>([]);
    const [popularStocksLoading, setPopularStocksLoading] = useState(true);
    const [cash, setCash] = useState(0);

    useEffect(() => {
        fetchUserData();
        fetchPortfolio();
        fetchPopularStocks();
    }, []);

    const fetchUserData = async () => {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) setUser(JSON.parse(storedUser) as UserData);
        } catch (error) { console.error(error); }
    };

    const fetchPortfolio = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) { navigate('/signin'); return; }

            const response = await fetch(`${API_BASE_URL}/portfolio`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/signin');
                return;
            }
            if (!response.ok) throw new Error('Failed to fetch portfolio');

            const data = await response.json();
            setPortfolio(data.stocks || []);
            setCash(data.cash || 0);

            if (data.summary) {
                setTotalValue(data.summary.totalValue);
                setTotalChange(data.summary.totalGain);
                setTotalChangePercent(data.summary.totalGainPercent);
            } else {
                const stocks: PortfolioStock[] = data.stocks || [];
                const total = stocks.reduce((s, st) => s + st.value, 0);
                const invested = stocks.reduce((s, st) => s + (st.avgPrice * st.shares), 0);
                const change = total - invested;
                setTotalValue(total);
                setTotalChange(change);
                setTotalChangePercent(invested > 0 ? (change / invested) * 100 : 0);
            }
        } catch (error) {
            console.error(error);
            setPortfolio([]); setTotalValue(0); setTotalChange(0); setTotalChangePercent(0);
        } finally { setIsLoading(false); }
    };

    const fetchPopularStocks = async () => {
        setPopularStocksLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/stocks/popular`);
            setPopularStocks((res.data.stocks as Stock[]) || []);
        } catch { setPopularStocks([]); }
        finally { setPopularStocksLoading(false); }
    };

    const handleStockClick = (symbol: string) => navigate(`/trade/${symbol}`);

    const fmt$ = (v: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v);

    const fmtN = (v: number) =>
        new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

    const getGreeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const actionButtons = [
        { label: 'Deposit', icon: <Wallet size={20} />, onClick: () => navigate('/deposit'), color: 'from-emerald-500 to-teal-500' },
        { label: 'P2P Trading', icon: <Users size={20} />, onClick: () => navigate('/p2p'), color: 'from-blue-500 to-cyan-500' },
        { label: 'Convert', icon: <RefreshCw size={20} />, onClick: () => navigate('/stocks'), color: 'from-violet-500 to-purple-500' },
    ];

    const trustItems = [
        { icon: <ShieldCheck size={18} className="text-emerald-400" />, label: 'Bank-grade Security', sub: '256-bit SSL encryption' },
        { icon: <Lock size={18} className="text-emerald-400" />, label: 'Funds Protected', sub: 'SIPC insured up to $500K' },
        { icon: <Zap size={18} className="text-emerald-400" />, label: 'Instant Execution', sub: 'Avg. fill time < 50ms' },
        { icon: <Globe size={18} className="text-emerald-400" />, label: '180+ Markets', sub: 'Global trading access' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <Navbar />

            <main className="lg:pl-64 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* ── Greeting ── */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                {getGreeting()}, {user.firstName} 👋
                            </h2>
                            <p className="text-slate-400 text-sm mt-0.5">
                                Here's what's happening with your portfolio today.
                            </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span className="text-emerald-400 text-xs font-medium">Markets Open</span>
                        </div>
                    </div>

                    {/* ── Trust strip ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {trustItems.map(({ icon, label, sub }) => (
                            <div key={label} className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3">
                                <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center shrink-0">
                                    {icon}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-white text-xs font-semibold leading-tight">{label}</p>
                                    <p className="text-slate-500 text-[10px] mt-0.5 truncate">{sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── Portfolio card ── */}
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
                        </div>
                        <div className="relative z-10">
                            <div className="mb-6">
                                <p className="text-emerald-100 text-sm font-medium mb-1">Total Portfolio Value</p>
                                <div className="flex items-center gap-3">
                                    {isBalanceHidden
                                        ? <span className="text-4xl font-bold">••••••••</span>
                                        : <h2 className="text-4xl sm:text-5xl font-bold">{fmt$(totalValue)}</h2>}
                                    <button onClick={() => setIsBalanceHidden(!isBalanceHidden)} className="p-2 hover:bg-white/10 rounded-lg transition">
                                        {isBalanceHidden ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                    <p className="text-emerald-100 text-sm mb-1">Total Gain/Loss</p>
                                    <div className="flex items-center gap-2">
                                        {totalChange >= 0
                                            ? <TrendingUp size={20} className="text-emerald-300" />
                                            : <TrendingDown size={20} className="text-red-300" />}
                                        <span className={`text-2xl font-bold ${totalChange >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                                            {isBalanceHidden ? '••••' : fmt$(Math.abs(totalChange))}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                    <p className="text-emerald-100 text-sm mb-1">Return</p>
                                    <span className={`text-2xl font-bold ${totalChangePercent >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                                        {isBalanceHidden ? '••••' : `${totalChangePercent >= 0 ? '+' : ''}${fmtN(totalChangePercent)}%`}
                                    </span>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                    <p className="text-emerald-100 text-sm mb-1">Cash Available</p>
                                    <span className="text-2xl font-bold">{isBalanceHidden ? '••••••' : fmt$(cash)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Quick Actions ── */}
                    <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-3 xl:hidden">
                        {actionButtons.map(({ label, icon, onClick, color }) => (
                            <button key={label} onClick={onClick} className="flex flex-col items-center gap-1.5 px-3 group">
                                <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-md shadow-black/30 group-hover:scale-110 transition-transform duration-200`}>
                                    {icon}
                                </div>
                                <span className="text-slate-400 text-[10px] font-medium group-hover:text-white transition-colors duration-200 whitespace-nowrap">{label}</span>
                            </button>
                        ))}
                    </div>

                    {/* ── Market Snapshot ── */}
                    <MarketSnapshot />

                    {/* ── Stocks grid + News ── */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2">
                            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-white">My Stocks</h3>
                                    {portfolio.length > 5 && (
                                        <button
                                            onClick={() => { localStorage.setItem('allStocks', JSON.stringify(portfolio)); navigate('/stocks'); }}
                                            className="text-emerald-500 hover:text-emerald-400 text-sm font-medium transition"
                                        >
                                            See All →
                                        </button>
                                    )}
                                </div>

                                {isLoading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                                                <div className="space-y-2 flex-1">
                                                    <div className="h-4 bg-slate-700 rounded w-24" />
                                                    <div className="h-3 bg-slate-700 rounded w-32" />
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="h-4 bg-slate-700 rounded w-20" />
                                                    <div className="h-3 bg-slate-700 rounded w-16" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : portfolio.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Activity className="mx-auto text-slate-600 mb-4" size={48} />
                                        <p className="text-slate-400 mb-4">No stocks in your portfolio yet</p>
                                        <button onClick={() => handleStockClick('AAPL')} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition">
                                            Start Trading
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {portfolio.slice(0, 5).map(stock => (
                                            <button
                                                key={stock.symbol}
                                                onClick={() => handleStockClick(stock.symbol)}
                                                className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl transition group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                                                        <span className="text-white font-bold text-lg">{stock.symbol.slice(0, 2)}</span>
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-white font-semibold group-hover:text-emerald-400 transition">{stock.symbol}</p>
                                                        <p className="text-slate-400 text-sm">{stock.shares} shares</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-white font-semibold">{fmt$(stock.value)}</p>
                                                    <div className="flex items-center gap-1 justify-end">
                                                        {stock.gainPercent >= 0
                                                            ? <TrendingUp size={14} className="text-emerald-400" />
                                                            : <TrendingDown size={14} className="text-red-400" />}
                                                        <span className={`text-sm ${stock.gainPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            {stock.gainPercent >= 0 ? '+' : ''}{fmtN(stock.gainPercent)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="xl:col-span-1 flex flex-col gap-6">
                            <NewsCard />
                            <PopularStocks
                                stocks={popularStocks}
                                isLoading={popularStocksLoading}
                                onStockClick={handleStockClick}
                                formatNumber={fmtN}
                            />
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}