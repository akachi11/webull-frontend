import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Activity, Clock, DollarSign, PieChart, BarChart3, ArrowUpRight, ArrowDownRight, Search } from 'lucide-react';
import Navbar from '../components/Navbar';

const API_BASE_URL = 'http://localhost:5000/api';

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

interface Transaction {
    _id: string;
    symbol: string;
    name: string;
    type: 'BUY' | 'SELL';
    shares: number;
    price: number;
    total: number;
    commission: number;
    timestamp: string;
}

interface PortfolioSummary {
    totalValue: number;
    totalStockValue: number;
    totalCash: number;
    totalGain: number;
    totalGainPercent: number;
}

export default function Portfolio() {
    const navigate = useNavigate();
    const [stocks, setStocks] = useState<PortfolioStock[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [summary, setSummary] = useState<PortfolioSummary>({
        totalValue: 0,
        totalStockValue: 0,
        totalCash: 0,
        totalGain: 0,
        totalGainPercent: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [transactionsLoading, setTransactionsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');

    useEffect(() => {
        fetchPortfolio();
        fetchTransactions();
    }, []);

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

            if (!response.ok) throw new Error('Failed to fetch portfolio');

            const data = await response.json();
            setStocks(data.stocks || []);
            setSummary(data.summary || {
                totalValue: 0,
                totalStockValue: 0,
                totalCash: 0,
                totalGain: 0,
                totalGainPercent: 0
            });
        } catch (error) {
            console.error('Error fetching portfolio:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTransactions = async () => {
        setTransactionsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/portfolio/transactions?limit=20`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to fetch transactions');

            const data = await response.json();
            setTransactions(data.transactions || []);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setTransactionsLoading(false);
        }
    };

    const handleStockClick = (symbol: string) => {
        navigate(`/trade/${symbol}`);
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

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const filteredTransactions = transactions.filter(t => {
        const matchesType = filterType === 'ALL' || t.type === filterType;
        const matchesSearch = t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    const topPerformers = [...stocks]
        .sort((a, b) => b.gainPercent - a.gainPercent)
        .slice(0, 3);

    const bottomPerformers = [...stocks]
        .sort((a, b) => a.gainPercent - b.gainPercent)
        .slice(0, 3);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <Navbar />

            <main className="lg:pl-64 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Portfolio Overview</h1>
                        <p className="text-slate-400">Track your investments and performance</p>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-2xl"></div>
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <DollarSign size={18} />
                                    <p className="text-emerald-100 text-sm">Total Value</p>
                                </div>
                                <p className="text-3xl font-bold">{formatCurrency(summary.totalValue)}</p>
                            </div>
                        </div>

                        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-2">
                                <PieChart size={18} className="text-emerald-400" />
                                <p className="text-slate-400 text-sm">Stock Value</p>
                            </div>
                            <p className="text-2xl font-bold text-white">{formatCurrency(summary.totalStockValue)}</p>
                        </div>

                        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity size={18} className="text-emerald-400" />
                                <p className="text-slate-400 text-sm">Cash Available</p>
                            </div>
                            <p className="text-2xl font-bold text-white">{formatCurrency(summary.totalCash)}</p>
                        </div>

                        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-2">
                                {summary.totalGain >= 0 ? (
                                    <TrendingUp size={18} className="text-emerald-400" />
                                ) : (
                                    <TrendingDown size={18} className="text-red-400" />
                                )}
                                <p className="text-slate-400 text-sm">Total Gain/Loss</p>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <p className={`text-2xl font-bold ${summary.totalGain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {formatCurrency(Math.abs(summary.totalGain))}
                                </p>
                                <span className={`text-sm ${summary.totalGain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    ({summary.totalGainPercent >= 0 ? '+' : ''}{formatNumber(summary.totalGainPercent)}%)
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Performance Highlights */}
                    {stocks.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Top Performers */}
                            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <ArrowUpRight className="text-emerald-400" size={20} />
                                    <h3 className="text-lg font-bold text-white">Top Performers</h3>
                                </div>
                                <div className="space-y-3">
                                    {topPerformers.map((stock) => (
                                        <div
                                            key={stock.symbol}
                                            className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                                        >
                                            <div>
                                                <p className="text-white font-semibold">{stock.symbol}</p>
                                                <p className="text-slate-400 text-sm">{stock.name}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-emerald-400 font-semibold">
                                                    +{formatNumber(stock.gainPercent)}%
                                                </p>
                                                <p className="text-slate-400 text-sm">{formatCurrency(stock.gain)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Bottom Performers */}
                            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <ArrowDownRight className="text-red-400" size={20} />
                                    <h3 className="text-lg font-bold text-white">Needs Attention</h3>
                                </div>
                                <div className="space-y-3">
                                    {bottomPerformers.map((stock) => (
                                        <div
                                            key={stock.symbol}
                                            className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                                        >
                                            <div>
                                                <p className="text-white font-semibold">{stock.symbol}</p>
                                                <p className="text-slate-400 text-sm">{stock.name}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-semibold ${stock.gainPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {stock.gainPercent >= 0 ? '+' : ''}{formatNumber(stock.gainPercent)}%
                                                </p>
                                                <p className="text-slate-400 text-sm">{formatCurrency(stock.gain)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* All Holdings */}
                    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-white mb-6">All Holdings</h3>

                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                                        <div className="space-y-2 flex-1">
                                            <div className="h-4 bg-slate-700 rounded w-24"></div>
                                            <div className="h-3 bg-slate-700 rounded w-32"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : stocks.length === 0 ? (
                            <div className="text-center py-12">
                                <Activity className="mx-auto text-slate-600 mb-4" size={48} />
                                <p className="text-slate-400 mb-4">No stocks in your portfolio yet</p>
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition"
                                >
                                    Start Trading
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-800">
                                            <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Stock</th>
                                            <th className="text-right py-3 px-4 text-slate-400 font-medium text-sm">Shares</th>
                                            <th className="text-right py-3 px-4 text-slate-400 font-medium text-sm">Avg Price</th>
                                            <th className="text-right py-3 px-4 text-slate-400 font-medium text-sm">Current Price</th>
                                            <th className="text-right py-3 px-4 text-slate-400 font-medium text-sm">Value</th>
                                            <th className="text-right py-3 px-4 text-slate-400 font-medium text-sm">Gain/Loss</th>
                                            <th className="text-right py-3 px-4 text-slate-400 font-medium text-sm">Return</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stocks.map((stock) => (
                                            <tr
                                                key={stock.symbol}
                                                onClick={() => handleStockClick(stock.symbol)}
                                                className="border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer transition"
                                            >
                                                <td className="py-4 px-4">
                                                    <div>
                                                        <p className="text-white font-semibold">{stock.symbol}</p>
                                                        <p className="text-slate-400 text-sm">{stock.name}</p>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-right text-white">{stock.shares}</td>
                                                <td className="py-4 px-4 text-right text-white">{formatCurrency(stock.avgPrice)}</td>
                                                <td className="py-4 px-4 text-right text-white">{formatCurrency(stock.currentPrice)}</td>
                                                <td className="py-4 px-4 text-right text-white font-semibold">{formatCurrency(stock.value)}</td>
                                                <td className={`py-4 px-4 text-right font-semibold ${stock.gain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {stock.gain >= 0 ? '+' : ''}{formatCurrency(stock.gain)}
                                                </td>
                                                <td className={`py-4 px-4 text-right font-semibold ${stock.gainPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {stock.gainPercent >= 0 ? '+' : ''}{formatNumber(stock.gainPercent)}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Transaction History */}
                    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-4 sm:p-6">
                        <div className="space-y-4 mb-6">
                            <h3 className="text-xl font-bold text-white">Recent Transactions</h3>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                {/* Filter Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setFilterType('ALL')}
                                        className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition ${filterType === 'ALL'
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                            }`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setFilterType('BUY')}
                                        className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition ${filterType === 'BUY'
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                            }`}
                                    >
                                        Buy
                                    </button>
                                    <button
                                        onClick={() => setFilterType('SELL')}
                                        className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition ${filterType === 'SELL'
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                            }`}
                                    >
                                        Sell
                                    </button>
                                </div>

                                {/* Search */}
                                <div className="relative flex-1 sm:max-w-xs">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search symbol..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
                                    />
                                </div>
                            </div>
                        </div>

                        {transactionsLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                                        <div className="space-y-2 flex-1">
                                            <div className="h-4 bg-slate-700 rounded w-32"></div>
                                            <div className="h-3 bg-slate-700 rounded w-24"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredTransactions.length === 0 ? (
                            <div className="text-center py-8">
                                <Clock className="mx-auto text-slate-600 mb-3" size={40} />
                                <p className="text-slate-400">No transactions found</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredTransactions.map((transaction) => (
                                    <div
                                        key={transaction._id}
                                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl transition"
                                    >
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${transaction.type === 'BUY'
                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                    : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                {transaction.type === 'BUY' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-white font-semibold truncate">{transaction.symbol}</p>
                                                <p className="text-slate-400 text-xs sm:text-sm truncate">
                                                    {transaction.type} {transaction.shares} shares @ {formatCurrency(transaction.price)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end sm:text-right gap-4 sm:gap-0 sm:flex-col sm:items-end">
                                            <p className={`font-semibold text-base sm:text-lg ${transaction.type === 'BUY' ? 'text-red-400' : 'text-emerald-400'
                                                }`}>
                                                {transaction.type === 'BUY' ? '-' : '+'}{formatCurrency(transaction.total)}
                                            </p>
                                            <p className="text-slate-400 text-xs sm:text-sm">{formatDate(transaction.timestamp)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}