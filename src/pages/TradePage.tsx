import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TrendingUp, TrendingDown, ArrowLeft, Users, Globe, Building2, Calendar, X, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import logo from "../assets/logo.png"
import { useApp } from '../contexts/AppContext';

const API_BASE_URL = 'http://localhost:5000/api';
const MINIMUM_TRADE_AMOUNT = 5000;

interface StockDetails {
    symbol: string;
    name: string;
    logo?: string;
    price: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    open: number;
    previousClose: number;
    marketCap?: number;
    sharesOutstanding?: number;
    country?: string;
    currency?: string;
    exchange?: string;
    ipo?: string;
    industry?: string;
    weburl?: string;
    news?: any[];
}

interface ChartData {
    time: string;
    price: number;
}

export default function TradePage() {
    const { symbol } = useParams<{ symbol: string }>();
    const navigate = useNavigate();
    const [stock, setStock] = useState<StockDetails | null>(null);
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(true);
    const [showTradeModal, setShowTradeModal] = useState(false);
    const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
    const [inputMode, setInputMode] = useState<'shares' | 'amount'>('amount');
    const [shares, setShares] = useState<string>('');
    const [amount, setAmount] = useState<string>('5000');
    const [portfolio, setPortfolio] = useState<any>(null);
    const [isTrading, setIsTrading] = useState(false);
    const [tradeError, setTradeError] = useState('');
    const [timeRange, setTimeRange] = useState('1D');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const { fetchUnreadCount } = useApp()

    useEffect(() => {
        if (symbol) {
            fetchStockDetails();
            fetchChartData('1D');
            fetchPortfolio();
        }
    }, [symbol]);

    useEffect(() => {
        if (stock && inputMode === 'amount' && amount) {
            const calculatedShares = parseFloat(amount) / stock.price;
            setShares(calculatedShares.toFixed(6));
        } else if (stock && inputMode === 'shares' && shares) {
            const calculatedAmount = parseFloat(shares) * stock.price;
            setAmount(calculatedAmount.toFixed(2));
        }
    }, [amount, shares, inputMode, stock]);

    const fetchStockDetails = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/stocks/details/${symbol}`);
            const data = await response.json();
            setStock(data);
        } catch (error) {
            console.error('Error fetching stock details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchChartData = async (range: string) => {
        setChartLoading(true);
        try {
            const now = Math.floor(Date.now() / 1000);
            let from = now;
            let resolution = 'D';

            switch (range) {
                case '1D':
                    from = now - (24 * 60 * 60);
                    resolution = '5';
                    break;
                case '1W':
                    from = now - (7 * 24 * 60 * 60);
                    resolution = '30';
                    break;
                case '1M':
                    from = now - (30 * 24 * 60 * 60);
                    resolution = 'D';
                    break;
                case '3M':
                    from = now - (90 * 24 * 60 * 60);
                    resolution = 'D';
                    break;
                case '1Y':
                    from = now - (365 * 24 * 60 * 60);
                    resolution = 'W';
                    break;
            }

            const response = await fetch(`${API_BASE_URL}/stocks/candles/${symbol}?resolution=${resolution}&from=${from}&to=${now}`);
            const data = await response.json();

            if (data.t && data.c) {
                const chartData = data.t.map((time: number, index: number) => ({
                    time: new Date(time * 1000).toLocaleDateString(),
                    price: data.c[index]
                }));
                setChartData(chartData);
            }
        } catch (error) {
            console.error('Error fetching chart data:', error);
        } finally {
            setChartLoading(false);
        }
    };

    const fetchPortfolio = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/portfolio`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            setPortfolio(data);
        } catch (error) {
            console.error('Error fetching portfolio:', error);
        }
    };

    const handleTimeRangeChange = (range: string) => {
        setTimeRange(range);
        fetchChartData(range);
    };

    const handleTradeClick = () => {
        if (!stock) return;

        const tradeShares = parseFloat(shares);
        const tradeAmount = parseFloat(amount);

        if (!tradeShares || tradeShares <= 0 || !tradeAmount || tradeAmount <= 0) {
            setTradeError('Enter a valid amount');
            return;
        }

        if (tradeAmount < MINIMUM_TRADE_AMOUNT) {
            setTradeError(`Minimum is $${MINIMUM_TRADE_AMOUNT.toLocaleString()}. Use P2P for smaller amounts.`);
            return;
        }

        setTradeError('');
        setShowConfirmModal(true);
    };

    const handleTrade = async () => {
        if (!stock) return;

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/signin');
            return;
        }

        const tradeShares = parseFloat(shares);
        const tradeAmount = parseFloat(amount);

        setIsTrading(true);
        setTradeError('');

        try {
            const response = await fetch(`${API_BASE_URL}/portfolio/trade`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    symbol: stock.symbol,
                    name: stock.name,
                    type: tradeType,
                    shares: tradeShares,
                    price: stock.price
                })
            });

            const data = await response.json();

            if (data.success) {
                setShowTradeModal(false);
                setShowConfirmModal(false);
                setShares('');
                setAmount('5000');
                fetchPortfolio();
                fetchUnreadCount()
                alert(`Successfully ${tradeType === 'BUY' ? 'bought' : 'sold'} ${tradeShares.toFixed(6)} shares of ${stock.symbol}`);
            } else {
                setTradeError(data.message || 'Trade failed');
            }
        } catch (error: any) {
            setTradeError(error.message || 'Trade failed');
        } finally {
            setIsTrading(false);
        }
    };

    const openTradeModal = (type: 'BUY' | 'SELL') => {
        setTradeType(type);
        setShowTradeModal(true);
        setTradeError('');
        setInputMode('amount');
        setAmount(type === 'BUY' ? '5000' : '');
        setShares('');
    };

    const goToP2P = () => {
        if (stock) {
            navigate(`/p2p/${stock.symbol}`, { state: { stock } });
        }
    };

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value);
    };

    const formatLargeNumber = (value: number): string => {
        if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
        if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
        if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
        return formatCurrency(value);
    };

    const getHoldingInfo = () => {
        if (!portfolio || !stock) return null;
        const holding = portfolio.stocks?.find((s: any) => s.symbol === stock.symbol);
        return holding;
    };

    const holding = getHoldingInfo();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
                    <img
                        src={logo}
                        alt="Loading"
                        className="w-24 h-24 relative z-10 animate-pulse"
                    />
                </div>
            </div>
        );
    }

    if (!stock) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-white">Stock not found</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <div className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition"
                    >
                        <ArrowLeft size={20} />
                        <span>Back to Dashboard</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Stock Info & Chart */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Stock Header */}
                        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    {stock.logo && (
                                        <img
                                            src={stock.logo}
                                            alt={stock.symbol}
                                            className="w-16 h-16 rounded-xl object-cover bg-white"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    )}
                                    <div>
                                        <h1 className="text-3xl font-bold text-white">{stock.symbol}</h1>
                                        <p className="text-slate-400">{stock.name}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-slate-400 text-sm mb-1">Price</p>
                                    <p className="text-2xl font-bold text-white">{formatCurrency(stock.price)}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-sm mb-1">Change</p>
                                    <div className="flex items-center gap-2">
                                        {stock.changePercent >= 0 ? (
                                            <TrendingUp size={20} className="text-emerald-400" />
                                        ) : (
                                            <TrendingDown size={20} className="text-red-400" />
                                        )}
                                        <span className={`text-lg font-bold ${stock.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-sm mb-1">Day High</p>
                                    <p className="text-lg font-semibold text-white">{formatCurrency(stock.high)}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-sm mb-1">Day Low</p>
                                    <p className="text-lg font-semibold text-white">{formatCurrency(stock.low)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                                <h2 className="text-xl font-bold text-white">Price Chart</h2>
                                <div className="flex gap-2">
                                    {['1D', '1W', '1M', '3M', '1Y'].map((range) => (
                                        <button
                                            key={range}
                                            onClick={() => handleTimeRangeChange(range)}
                                            className={`px-3 py-1 rounded-lg text-sm font-medium transition ${timeRange === range
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-slate-800 text-slate-400 hover:text-white'
                                                }`}
                                        >
                                            {range}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {chartLoading ? (
                                <div className="h-64 sm:h-80 flex items-center justify-center">
                                    <div className="text-slate-400">Loading chart...</div>
                                </div>
                            ) : chartData.length > 0 ? (
                                <div className="overflow-x-auto -mx-4 sm:mx-0">
                                    <div className="min-w-125 px-4 sm:px-0">
                                        <ResponsiveContainer width="100%" height={280}>
                                            <LineChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                <XAxis
                                                    dataKey="time"
                                                    stroke="#94a3b8"
                                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                    angle={-45}
                                                    textAnchor="end"
                                                    height={60}
                                                    interval="preserveStartEnd"
                                                />
                                                <YAxis
                                                    stroke="#94a3b8"
                                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                    domain={['auto', 'auto']}
                                                    width={60}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#1e293b',
                                                        border: '1px solid #334155',
                                                        borderRadius: '8px'
                                                    }}
                                                    labelStyle={{ color: '#94a3b8' }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="price"
                                                    stroke={stock.changePercent >= 0 ? '#10b981' : '#ef4444'}
                                                    strokeWidth={2}
                                                    dot={false}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-64 sm:h-80 flex items-center justify-center">
                                    <div className="text-slate-400">No chart data available</div>
                                </div>
                            )}
                        </div>

                        {/* Trading Panel - Mobile Only (appears after chart) */}
                        <div className="lg:hidden">
                            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
                                <h2 className="text-xl font-bold text-white mb-6">Trade {stock.symbol}</h2>

                                {holding && (
                                    <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                        <p className="text-emerald-400 text-sm mb-2">Your Holdings</p>
                                        <p className="text-white text-2xl font-bold">{holding.shares.toFixed(6)} shares</p>
                                        <p className="text-slate-400 text-sm">Avg. Price: {formatCurrency(holding.avgPrice)}</p>
                                        <p className={`text-sm ${holding.gainPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {holding.gainPercent >= 0 ? '+' : ''}{holding.gainPercent.toFixed(2)}% ({formatCurrency(holding.gain)})
                                        </p>
                                    </div>
                                )}

                                <div className="mb-6 p-4 bg-slate-800/50 rounded-xl">
                                    <p className="text-slate-400 text-sm mb-1">Available Cash</p>
                                    <p className="text-white text-2xl font-bold">
                                        {portfolio ? formatCurrency(portfolio.cash) : '---'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <button
                                        onClick={() => openTradeModal('BUY')}
                                        className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition"
                                    >
                                        Buy
                                    </button>
                                    <button
                                        onClick={() => openTradeModal('SELL')}
                                        className="py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition"
                                        disabled={!holding || holding.shares === 0}
                                    >
                                        Sell
                                    </button>
                                </div>

                                <button
                                    onClick={goToP2P}
                                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                                >
                                    <Users size={20} />
                                    P2P Trading (Under $5,000)
                                </button>

                                <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400 text-sm">Open</span>
                                        <span className="text-white font-semibold">{formatCurrency(stock.open)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400 text-sm">Previous Close</span>
                                        <span className="text-white font-semibold">{formatCurrency(stock.previousClose)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400 text-sm">Day Range</span>
                                        <span className="text-white font-semibold">
                                            {formatCurrency(stock.low)} - {formatCurrency(stock.high)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Company Info */}
                        {stock.marketCap && (
                            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
                                <h2 className="text-xl font-bold text-white mb-4">Company Information</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {stock.marketCap && (
                                        <div className="flex items-center gap-3">
                                            <Building2 className="text-emerald-500" size={20} />
                                            <div>
                                                <p className="text-slate-400 text-sm">Market Cap</p>
                                                <p className="text-white font-semibold">{formatLargeNumber(stock.marketCap * 1000000)}</p>
                                            </div>
                                        </div>
                                    )}
                                    {stock.industry && (
                                        <div className="flex items-center gap-3">
                                            <Building2 className="text-emerald-500" size={20} />
                                            <div>
                                                <p className="text-slate-400 text-sm">Industry</p>
                                                <p className="text-white font-semibold">{stock.industry}</p>
                                            </div>
                                        </div>
                                    )}
                                    {stock.country && (
                                        <div className="flex items-center gap-3">
                                            <Globe className="text-emerald-500" size={20} />
                                            <div>
                                                <p className="text-slate-400 text-sm">Country</p>
                                                <p className="text-white font-semibold">{stock.country}</p>
                                            </div>
                                        </div>
                                    )}
                                    {stock.ipo && (
                                        <div className="flex items-center gap-3">
                                            <Calendar className="text-emerald-500" size={20} />
                                            <div>
                                                <p className="text-slate-400 text-sm">IPO Date</p>
                                                <p className="text-white font-semibold">{stock.ipo}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {stock.weburl && (
                                    <a
                                        href={stock.weburl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-4 inline-flex items-center gap-2 text-emerald-500 hover:text-emerald-400 transition"
                                    >
                                        <Globe size={16} />
                                        Visit Website
                                    </a>
                                )}
                            </div>
                        )}

                        {/* News */}
                        {stock.news && stock.news.length > 0 && (
                            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
                                <h2 className="text-xl font-bold text-white mb-4">Recent News</h2>
                                <div className="space-y-4">
                                    {stock.news.slice(0, 5).map((article: any, index: number) => (
                                        <a
                                            key={index}
                                            href={article.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition"
                                        >
                                            <div className="flex gap-4">
                                                {article.image && (
                                                    <img
                                                        src={article.image}
                                                        alt=""
                                                        className="w-20 h-20 rounded-lg object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                        }}
                                                    />
                                                )}
                                                <div className="flex-1">
                                                    <h3 className="text-white font-semibold mb-1 line-clamp-2">
                                                        {article.headline}
                                                    </h3>
                                                    <p className="text-slate-400 text-sm mb-2 line-clamp-2">
                                                        {article.summary}
                                                    </p>
                                                    <p className="text-slate-500 text-xs">
                                                        {new Date(article.datetime * 1000).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Trading Panel (Desktop Only) */}
                    <div className="hidden lg:block lg:col-span-1">
                        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 sticky top-24">
                            <h2 className="text-xl font-bold text-white mb-6">Trade {stock.symbol}</h2>

                            {holding && (
                                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                    <p className="text-emerald-400 text-sm mb-2">Your Holdings</p>
                                    <p className="text-white text-2xl font-bold">{holding.shares.toFixed(6)} shares</p>
                                    <p className="text-slate-400 text-sm">Avg. Price: {formatCurrency(holding.avgPrice)}</p>
                                    <p className={`text-sm ${holding.gainPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {holding.gainPercent >= 0 ? '+' : ''}{holding.gainPercent.toFixed(2)}% ({formatCurrency(holding.gain)})
                                    </p>
                                </div>
                            )}

                            <div className="mb-6 p-4 bg-slate-800/50 rounded-xl">
                                <p className="text-slate-400 text-sm mb-1">Available Cash</p>
                                <p className="text-white text-2xl font-bold">
                                    {portfolio ? formatCurrency(portfolio.cash) : '---'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <button
                                    onClick={() => openTradeModal('BUY')}
                                    className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition"
                                >
                                    Buy
                                </button>
                                <button
                                    onClick={() => openTradeModal('SELL')}
                                    className="py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition"
                                    disabled={!holding || holding.shares === 0}
                                >
                                    Sell
                                </button>
                            </div>

                            <button
                                onClick={goToP2P}
                                className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 mb-6"
                            >
                                <Users size={20} />
                                P2P Trading
                            </button>

                            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <p className="text-blue-400 text-xs">
                                    💡 Min. $5,000 for direct trading. Use P2P for smaller amounts.
                                </p>
                            </div>

                            <div className="pt-6 border-t border-slate-800 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-slate-400 text-sm">Open</span>
                                    <span className="text-white font-semibold">{formatCurrency(stock.open)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400 text-sm">Previous Close</span>
                                    <span className="text-white font-semibold">{formatCurrency(stock.previousClose)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400 text-sm">Day Range</span>
                                    <span className="text-white font-semibold text-right">
                                        {formatCurrency(stock.low)} - {formatCurrency(stock.high)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trade Modal */}
            {showTradeModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">
                                {tradeType === 'BUY' ? 'Buy' : 'Sell'} {stock.symbol}
                            </h2>
                            <button
                                onClick={() => setShowTradeModal(false)}
                                className="text-slate-400 hover:text-white transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="mb-6 p-4 bg-slate-800/50 rounded-xl">
                            <p className="text-slate-400 text-sm mb-1">Current Price</p>
                            <p className="text-white text-2xl font-bold">{formatCurrency(stock.price)}</p>
                        </div>

                        {/* Input Mode Toggle */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setInputMode('amount')}
                                className={`flex-1 py-2 rounded-lg font-medium transition ${inputMode === 'amount'
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-800 text-slate-400'
                                    }`}
                            >
                                By Amount
                            </button>
                            <button
                                onClick={() => setInputMode('shares')}
                                className={`flex-1 py-2 rounded-lg font-medium transition ${inputMode === 'shares'
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-800 text-slate-400'
                                    }`}
                            >
                                By Shares
                            </button>
                        </div>

                        {/* Input Fields */}
                        <div className="space-y-4 mb-6">
                            {inputMode === 'amount' ? (
                                <div>
                                    <label className="block text-slate-400 text-sm mb-2">Amount (USD)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="5000"
                                            className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <p className="text-slate-500 text-xs mt-1">
                                        ≈ {shares || '0'} shares
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-slate-400 text-sm mb-2">Number of Shares</label>
                                    <input
                                        type="number"
                                        value={shares}
                                        onChange={(e) => setShares(e.target.value)}
                                        placeholder="0"
                                        step="0.000001"
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                    <p className="text-slate-500 text-xs mt-1">
                                        ≈ {formatCurrency(parseFloat(amount || '0'))}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Error Message */}
                        {tradeError && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <p className="text-red-400 text-sm">{tradeError}</p>
                            </div>
                        )}

                        {/* Trade Summary */}
                        <div className="mb-6 p-4 bg-slate-800/50 rounded-xl space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-400 text-sm">Total Cost</span>
                                <span className="text-white font-semibold">{formatCurrency(parseFloat(amount || '0'))}</span>
                            </div>
                            {tradeType === 'BUY' && portfolio && (
                                <div className="flex justify-between">
                                    <span className="text-slate-400 text-sm">Available</span>
                                    <span className={`font-semibold ${parseFloat(amount || '0') > portfolio.cash ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {formatCurrency(portfolio.cash)}
                                    </span>
                                </div>
                            )}
                            {tradeType === 'SELL' && holding && (
                                <div className="flex justify-between">
                                    <span className="text-slate-400 text-sm">Available Shares</span>
                                    <span className={`font-semibold ${parseFloat(shares || '0') > holding.shares ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {holding.shares.toFixed(6)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={handleTradeClick}
                                disabled={isTrading ||
                                    (tradeType === 'BUY' && portfolio && parseFloat(amount || '0') > portfolio.cash) ||
                                    (tradeType === 'SELL' && holding && parseFloat(shares || '0') > holding.shares)}
                                className={`w-full py-3 rounded-lg font-semibold transition ${tradeType === 'BUY'
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                    : 'bg-red-500 hover:bg-red-600 text-white'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isTrading ? 'Processing...' : `${tradeType === 'BUY' ? 'Buy' : 'Sell'} ${stock.symbol}`}
                            </button>
                            <button
                                onClick={() => setShowTradeModal(false)}
                                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-white mb-2">Confirm Your Trade</h2>
                            <p className="text-slate-400">Please review the details before confirming</p>
                        </div>

                        {/* Trade Details Summary */}
                        <div className="mb-6 p-4 bg-slate-800/50 rounded-xl space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Action</span>
                                <span className={`text-lg font-bold ${tradeType === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {tradeType === 'BUY' ? 'BUY' : 'SELL'}
                                </span>
                            </div>
                            <div className="border-t border-slate-700"></div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Stock</span>
                                <span className="text-white font-semibold">{stock.symbol}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Shares</span>
                                <span className="text-white font-semibold">{parseFloat(shares).toFixed(6)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Price Per Share</span>
                                <span className="text-white font-semibold">{formatCurrency(stock.price)}</span>
                            </div>
                            <div className="border-t border-slate-700"></div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-300 font-medium">Total Amount</span>
                                <span className="text-white text-lg font-bold">{formatCurrency(parseFloat(amount))}</span>
                            </div>
                        </div>

                        {/* Warning for Buy Orders */}
                        {tradeType === 'BUY' && (
                            <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                <p className="text-yellow-400 text-sm">
                                    ⚠️ Make sure you have sufficient funds. {formatCurrency(parseFloat(amount))} will be deducted from your account.
                                </p>
                            </div>
                        )}

                        {/* Warning for Sell Orders */}
                        {tradeType === 'SELL' && (
                            <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                <p className="text-yellow-400 text-sm">
                                    ⚠️ You are about to sell {parseFloat(shares).toFixed(6)} shares. This action cannot be undone immediately.
                                </p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={handleTrade}
                                disabled={isTrading}
                                className={`w-full py-3 rounded-lg font-semibold transition ${tradeType === 'BUY'
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                    : 'bg-red-500 hover:bg-red-600 text-white'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isTrading ? 'Processing...' : `Confirm ${tradeType === 'BUY' ? 'Buy' : 'Sell'}`}
                            </button>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                disabled={isTrading}
                                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}