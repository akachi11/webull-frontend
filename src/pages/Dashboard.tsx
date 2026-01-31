import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Search, Menu, X, LogOut, User, Bell, DollarSign, Activity, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import logo from "../assets/logo.png"
import Navbar from '../components/Navbar';
import PopularStocks from '../components/PopularStocks';

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

interface Stock {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    logo: string
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

export default function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState<UserData>({ firstName: 'John', lastName: 'Doe' });
    const [portfolio, setPortfolio] = useState<PortfolioStock[]>([]);
    const [totalValue, setTotalValue] = useState(0);
    const [totalChange, setTotalChange] = useState(0);
    const [totalChangePercent, setTotalChangePercent] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const fetchPortfolio = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');

            if (!token) {
                navigate('/signin');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/portfolio`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/signin');
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch portfolio');
            }

            const data = await response.json();

            setPortfolio(data.stocks || []);

            // Set cash from response
            setCash(data.cash || 0);

            // Use summary data from backend if available
            if (data.summary) {
                setTotalValue(data.summary.totalValue);
                setTotalChange(data.summary.totalGain);
                setTotalChangePercent(data.summary.totalGainPercent);
            } else {
                // Fallback calculation
                const stocks = data.stocks || [];
                const total = stocks.reduce((sum: number, stock: PortfolioStock) => sum + stock.value, 0);
                const totalInvested = stocks.reduce((sum: number, stock: PortfolioStock) => sum + (stock.avgPrice * stock.shares), 0);
                const change = total - totalInvested;
                const changePercent = totalInvested > 0 ? (change / totalInvested) * 100 : 0;

                setTotalValue(total);
                setTotalChange(change);
                setTotalChangePercent(changePercent);
            }
        } catch (error) {
            console.error('Error fetching portfolio:', error);
            setPortfolio([]);
            setTotalValue(0);
            setTotalChange(0);
            setTotalChangePercent(0);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPopularStocks = async () => {
        setPopularStocksLoading(true);
        try {
            await axios.get(`${API_BASE_URL}/stocks/popular`).then((res) => {
                setPopularStocks(res.data.stocks || []);
            })
        } catch (error) {
            console.error('Error fetching popular stocks:', error);
            setPopularStocks([]);
        } finally {
            setPopularStocksLoading(false);
        }
    };

    const handleStockClick = (symbol: string) => {
        navigate(`/trade/${symbol}`);
    };

    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/trade/${searchQuery.toUpperCase()}`);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/signin');
    };

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value);
    };

    const formatNumber = (value: number): string => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">

            <Navbar />

            {/* Main Content */}
            <main className="lg:pl-64 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Portfolio Summary */}
                    <div className="bg-linear-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-emerald-100 text-sm font-medium mb-1">Total Portfolio Value</p>
                                    <div className="flex items-center gap-3">
                                        {isBalanceHidden ? (
                                            <span className="text-4xl font-bold">••••••••</span>
                                        ) : (
                                            <h2 className="text-4xl sm:text-5xl font-bold">{formatCurrency(totalValue)}</h2>
                                        )}
                                        <button
                                            onClick={() => setIsBalanceHidden(!isBalanceHidden)}
                                            className="p-2 hover:bg-white/10 rounded-lg transition"
                                        >
                                            {isBalanceHidden ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                    <p className="text-emerald-100 text-sm mb-1">Total Gain/Loss</p>
                                    <div className="flex items-center gap-2">
                                        {totalChange >= 0 ? (
                                            <TrendingUp size={20} className="text-emerald-300" />
                                        ) : (
                                            <TrendingDown size={20} className="text-red-300" />
                                        )}
                                        <span className={`text-2xl font-bold ${totalChange >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                                            {isBalanceHidden ? '••••' : formatCurrency(Math.abs(totalChange))}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                    <p className="text-emerald-100 text-sm mb-1">Return</p>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-2xl font-bold ${totalChangePercent >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                                            {isBalanceHidden ? '••••' : `${totalChangePercent >= 0 ? '+' : ''}${formatNumber(totalChangePercent)}%`}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                    <p className="text-emerald-100 text-sm mb-1">Cash Available</p>
                                    <span className="text-2xl font-bold">{isBalanceHidden ? '••••••' : formatCurrency(cash)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* My Stocks */}
                        <div className="xl:col-span-2">
                            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-white">My Stocks</h3>
                                    {portfolio.length > 5 && (
                                        <button
                                            onClick={() => {
                                                localStorage.setItem('allStocks', JSON.stringify(portfolio));
                                                navigate('/stocks');
                                            }}
                                            className="text-emerald-500 hover:text-emerald-400 text-sm font-medium transition"
                                        >
                                            See All →
                                        </button>
                                    )}
                                </div>

                                {isLoading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                                                <div className="space-y-2 flex-1">
                                                    <div className="h-4 bg-slate-700 rounded w-24"></div>
                                                    <div className="h-3 bg-slate-700 rounded w-32"></div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="h-4 bg-slate-700 rounded w-20"></div>
                                                    <div className="h-3 bg-slate-700 rounded w-16"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : portfolio.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Activity className="mx-auto text-slate-600 mb-4" size={48} />
                                        <p className="text-slate-400 mb-4">No stocks in your portfolio yet</p>
                                        <button
                                            onClick={() => handleStockClick('AAPL')}
                                            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition"
                                        >
                                            Start Trading
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {portfolio.slice(0, 5).map((stock) => (
                                            <button
                                                key={stock.symbol}
                                                onClick={() => handleStockClick(stock.symbol)}
                                                className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl transition group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-linear-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                                                        <span className="text-white font-bold text-lg">{stock.symbol.slice(0, 2)}</span>
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-white font-semibold group-hover:text-emerald-400 transition">{stock.symbol}</p>
                                                        <p className="text-slate-400 text-sm">{stock.shares} shares</p>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <p className="text-white font-semibold">{formatCurrency(stock.value)}</p>
                                                    <div className="flex items-center gap-1 justify-end">
                                                        {stock.gainPercent >= 0 ? (
                                                            <TrendingUp size={14} className="text-emerald-400" />
                                                        ) : (
                                                            <TrendingDown size={14} className="text-red-400" />
                                                        )}
                                                        <span className={`text-sm ${stock.gainPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            {stock.gainPercent >= 0 ? '+' : ''}{formatNumber(stock.gainPercent)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Popular Stocks */}
                        <div className="xl:col-span-1">
                            <PopularStocks
                                stocks={popularStocks}
                                isLoading={popularStocksLoading}
                                onStockClick={handleStockClick}
                                formatNumber={formatNumber}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}