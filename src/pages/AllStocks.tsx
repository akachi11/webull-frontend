import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import Navbar from '../components/Navbar';
import PopularStocks from '../components/PopularStocks';

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

interface Stock {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    logo: string;
}

export default function AllStocks() {
    const navigate = useNavigate();
    const [allStocks, setAllStocks] = useState<PortfolioStock[]>([]);
    const [popularStocks, setPopularStocks] = useState<Stock[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [popularStocksLoading, setPopularStocksLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        // Get stocks from localStorage (passed from Dashboard)
        const storedStocks = localStorage.getItem('allStocks');
        if (storedStocks) {
            setAllStocks(JSON.parse(storedStocks));
        }
        setIsLoading(false);

        fetchPopularStocks();
    }, []);

    const fetchPopularStocks = async () => {
        setPopularStocksLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/stocks/popular`);
            if (response.ok) {
                const data = await response.json();
                setPopularStocks(data.stocks || []);
            }
        } catch (error) {
            console.error('Error fetching popular stocks:', error);
        } finally {
            setPopularStocksLoading(false);
        }
    };

    const handleStockClick = (symbol: string) => {
        navigate(`/trade/${symbol}`);
    };

    const formatNumber = (value: number): string => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value);
    };

    const filteredStocks = allStocks.filter((stock) =>
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
            <Navbar />

            {/* Main Content */}
            <main className="lg:pl-64 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="space-y-4">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">All Stocks</h1>
                            <p className="text-slate-400">Browse all your stocks</p>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* All Stocks */}
                        <div className="xl:col-span-2">
                            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-white">
                                        {searchQuery ? `Search Results (${filteredStocks.length})` : `All Stocks (${allStocks.length})`}
                                    </h3>
                                </div>

                                {isLoading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3, 4, 5].map((i) => (
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
                                ) : filteredStocks.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Activity className="mx-auto text-slate-600 mb-4" size={48} />
                                        <p className="text-slate-400 mb-4">
                                            {searchQuery ? 'No stocks found matching your search' : 'No stocks in your portfolio'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {filteredStocks.map((stock) => (
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
                                                        <p className="text-slate-400 text-sm">{stock.shares} shares @ ${formatNumber(stock.avgPrice)}</p>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <p className="text-white font-semibold">{formatCurrency(stock.value)}</p>
                                                    <div className="flex items-center gap-2 justify-end">
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

                        {/* Popular Stocks Sidebar */}
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
