import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Menu, X, Bell, TrendingUp } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import logo from '../assets/logo.png';
import NotificationPanel from './NotificationPanel';
import Sidebar from './Sidebar';
import { API_BASE_URL } from '../utils';

interface SearchResult {
    symbol: string;
    name: string;
    type?: string;
    exchange?: string;
}

function StockSearchInput({ className }: { className?: string }) {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Debounced search — calls your backend or falls back to a static list
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        const q = query.trim();
        if (!q) {
            setResults([]);
            setOpen(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/stocks/search?q=${encodeURIComponent(q)}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (!res.ok) throw new Error('search failed');
                const data = await res.json();
                // support both { results: [] } and flat []
                const list: SearchResult[] = Array.isArray(data) ? data : (data.results ?? data.stocks ?? []);
                setResults(list.slice(0, 8));
                setOpen(list.length > 0);
            } catch {
                // Fallback: filter a built-in list client-side
                const STATIC: SearchResult[] = [
                    { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
                    { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ' },
                    { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ' },
                    { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ' },
                    { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ' },
                    { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ' },
                    { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ' },
                    { symbol: 'BRK.B', name: 'Berkshire Hathaway', exchange: 'NYSE' },
                    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE' },
                    { symbol: 'V', name: 'Visa Inc.', exchange: 'NYSE' },
                    { symbol: 'JNJ', name: 'Johnson & Johnson', exchange: 'NYSE' },
                    { symbol: 'WMT', name: 'Walmart Inc.', exchange: 'NYSE' },
                    { symbol: 'XOM', name: 'Exxon Mobil Corp.', exchange: 'NYSE' },
                    { symbol: 'UNH', name: 'UnitedHealth Group', exchange: 'NYSE' },
                    { symbol: 'MA', name: 'Mastercard Inc.', exchange: 'NYSE' },
                    { symbol: 'PG', name: 'Procter & Gamble Co.', exchange: 'NYSE' },
                    { symbol: 'HD', name: 'The Home Depot Inc.', exchange: 'NYSE' },
                    { symbol: 'CVX', name: 'Chevron Corporation', exchange: 'NYSE' },
                    { symbol: 'LLY', name: 'Eli Lilly and Co.', exchange: 'NYSE' },
                    { symbol: 'ABBV', name: 'AbbVie Inc.', exchange: 'NYSE' },
                    { symbol: 'BAC', name: 'Bank of America Corp.', exchange: 'NYSE' },
                    { symbol: 'KO', name: 'The Coca-Cola Company', exchange: 'NYSE' },
                    { symbol: 'PFE', name: 'Pfizer Inc.', exchange: 'NYSE' },
                    { symbol: 'AVGO', name: 'Broadcom Inc.', exchange: 'NASDAQ' },
                    { symbol: 'COST', name: 'Costco Wholesale Corp.', exchange: 'NASDAQ' },
                    { symbol: 'MRK', name: 'Merck & Co. Inc.', exchange: 'NYSE' },
                    { symbol: 'AMD', name: 'Advanced Micro Devices', exchange: 'NASDAQ' },
                    { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ' },
                    { symbol: 'INTC', name: 'Intel Corporation', exchange: 'NASDAQ' },
                    { symbol: 'DIS', name: 'The Walt Disney Co.', exchange: 'NYSE' },
                    { symbol: 'ADBE', name: 'Adobe Inc.', exchange: 'NASDAQ' },
                    { symbol: 'CRM', name: 'Salesforce Inc.', exchange: 'NYSE' },
                    { symbol: 'PYPL', name: 'PayPal Holdings Inc.', exchange: 'NASDAQ' },
                    { symbol: 'ORCL', name: 'Oracle Corporation', exchange: 'NYSE' },
                    { symbol: 'QCOM', name: 'Qualcomm Inc.', exchange: 'NASDAQ' },
                    { symbol: 'IBM', name: 'IBM Corporation', exchange: 'NYSE' },
                    { symbol: 'GS', name: 'Goldman Sachs Group', exchange: 'NYSE' },
                    { symbol: 'MS', name: 'Morgan Stanley', exchange: 'NYSE' },
                    { symbol: 'UBER', name: 'Uber Technologies', exchange: 'NYSE' },
                    { symbol: 'SPOT', name: 'Spotify Technology', exchange: 'NYSE' },
                    { symbol: 'SQ', name: 'Block Inc.', exchange: 'NYSE' },
                    { symbol: 'SHOP', name: 'Shopify Inc.', exchange: 'NYSE' },
                    { symbol: 'SNAP', name: 'Snap Inc.', exchange: 'NYSE' },
                    { symbol: 'TWTR', name: 'Twitter Inc.', exchange: 'NYSE' },
                    { symbol: 'COIN', name: 'Coinbase Global Inc.', exchange: 'NASDAQ' },
                    { symbol: 'HOOD', name: 'Robinhood Markets', exchange: 'NASDAQ' },
                    { symbol: 'PLTR', name: 'Palantir Technologies', exchange: 'NYSE' },
                    { symbol: 'RBLX', name: 'Roblox Corporation', exchange: 'NYSE' },
                    { symbol: 'ABNB', name: 'Airbnb Inc.', exchange: 'NASDAQ' },
                    { symbol: 'LYFT', name: 'Lyft Inc.', exchange: 'NASDAQ' },
                ];
                const lower = q.toLowerCase();
                const filtered = STATIC.filter(
                    s => s.symbol.toLowerCase().startsWith(lower) ||
                        s.name.toLowerCase().includes(lower)
                ).slice(0, 8);
                setResults(filtered);
                setOpen(filtered.length > 0);
            } finally {
                setLoading(false);
            }
        }, 250);

        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query]);

    const handleSelect = (symbol: string) => {
        navigate(`/trade/${symbol}`);
        setQuery('');
        setResults([]);
        setOpen(false);
    };

    return (
        <div ref={containerRef} className={`relative ${className ?? ''}`}>
            {/* Input */}
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                    type="search"
                    placeholder="Search stocks…"
                    value={query}
                    readOnly
                    onFocus={(e) => {
                        e.target.removeAttribute('readonly');
                        if (results.length > 0) setOpen(true);
                    }}
                    onChange={e => setQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-sm"
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-3.5 h-3.5 border-2 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {/* Dropdown */}
            {open && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-[999]">
                    {results.map((r, i) => (
                        <button
                            key={r.symbol}
                            onMouseDown={() => handleSelect(r.symbol)} // mouseDown fires before blur
                            className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800 transition text-left ${i < results.length - 1 ? 'border-b border-slate-800' : ''
                                }`}
                        >
                            {/* Symbol badge */}
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                                <span className="text-white text-[10px] font-bold leading-none">
                                    {r.symbol.slice(0, 3)}
                                </span>
                            </div>
                            {/* Name + exchange */}
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-semibold leading-none mb-0.5">{r.symbol}</p>
                                <p className="text-slate-400 text-xs truncate">{r.name}</p>
                            </div>
                            {/* Exchange tag */}
                            {r.exchange && (
                                <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                                    {r.exchange}
                                </span>
                            )}
                            <TrendingUp size={13} className="text-slate-600 shrink-0" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Navbar() {
    const navigate = useNavigate();
    const { user, isSidebarOpen, setIsSidebarOpen, isNotificationOpen, setIsNotificationOpen, unreadCount } = useApp();

    return (
        <>
            <nav className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-6">
                            {/* Hamburger */}
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="lg:hidden text-slate-400 hover:text-white transition"
                            >
                                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>

                            {/* Logo */}
                            <div
                                className="flex items-center gap-3 cursor-pointer"
                                onClick={() => navigate('/dashboard')}
                            >
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                                    <img src={logo} alt="TradeHub" className="w-full h-full object-contain" />
                                </div>
                                <span className="text-xl font-bold text-white hidden sm:block">TradeHub</span>
                            </div>

                            {/* Desktop search */}
                            <StockSearchInput className="hidden md:block w-72" />
                        </div>

                        <div className="flex items-center gap-3">
                            {/* User info */}
                            <div className="flex flex-col items-end pr-3 border-r border-slate-700">
                                <p className="text-sm font-medium text-white whitespace-nowrap">
                                    {user?.firstName} {user?.lastName}
                                </p>
                                <p className="text-xs text-slate-400 whitespace-nowrap">Premium Account</p>
                            </div>

                            {/* Notifications */}
                            <button
                                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                className="p-2 text-slate-400 hover:text-white transition relative"
                            >
                                <Bell size={20} fill={unreadCount > 0 ? 'currentColor' : 'none'} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center font-semibold">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile search */}
                <div className="md:hidden px-4 pb-3">
                    <StockSearchInput />
                </div>
            </nav>

            <Sidebar />
            <NotificationPanel />
        </>
    );
}