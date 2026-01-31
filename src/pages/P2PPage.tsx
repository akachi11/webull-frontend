import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Filter, Star, ArrowLeftRight, BadgeCheck } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

interface Trader {
    _id: string;
    username: string;
    firstName: string;
    totalTrades: number;
    completedTrades: number;
    rating: number;
    totalReviews: number;
    completionRate: number;
    isVerified: boolean;
    averageResponseTime: number;
    badges: string[];
}

interface P2POffer {
    _id: string;
    offerType: 'BUY' | 'SELL' | 'SWAP';
    stockSymbol: string;
    stockName: string;
    minQuantity: number;
    maxQuantity: number;
    pricePerShare: number;
    totalValue: number;
    swapStockSymbol?: string;
    swapStockName?: string;
    swapRatio?: number;
    paymentMethods: string[];
    minTradeAmount: number;
    maxTradeAmount: number;
    totalMatches: number;
    completedTrades: number;
    createdAt: string;
    trader: Trader;
}

export default function P2PTrading() {
    const { symbol } = useParams<{ symbol?: string }>();
    const navigate = useNavigate();

    const [offers, setOffers] = useState<P2POffer[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [searchSymbol, setSearchSymbol] = useState(symbol?.toUpperCase() || '');
    const [offerType, setOfferType] = useState<'ALL' | 'BUY' | 'SELL' | 'SWAP'>('ALL');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [quantity, setQuantity] = useState('');
    const [swapStock, setSwapStock] = useState('');
    const [sortBy, setSortBy] = useState('rating');
    const [showFilters, setShowFilters] = useState(false);

    // Update searchSymbol when URL symbol changes
    useEffect(() => {
        if (symbol) {
            setSearchSymbol(symbol.toUpperCase());
            setPage(1);
        }
    }, [symbol]);

    useEffect(() => {
        fetchOffers();
    }, [page, offerType, sortBy, searchSymbol]);

    const fetchOffers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                sortBy
            });

            if (searchSymbol) params.append('stockSymbol', searchSymbol);
            if (offerType !== 'ALL') params.append('offerType', offerType);
            if (minAmount) params.append('minAmount', minAmount);
            if (maxAmount) params.append('maxAmount', maxAmount);
            if (quantity) params.append('quantity', quantity);
            if (swapStock) params.append('swapStock', swapStock);

            const response = await fetch(`${API_BASE_URL}/p2p/offers?${params}`);
            if (!response.ok) throw new Error('Failed to fetch offers');

            const data = await response.json();
            setOffers(data.offers);
            setTotalPages(data.pagination.totalPages);
        } catch (error) {
            console.error('Error fetching offers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilters = () => {
        setPage(1);
        fetchOffers();
        setShowFilters(false);
    };

    const handleClearFilters = () => {
        setSearchSymbol(symbol?.toUpperCase() || '');
        setOfferType('ALL');
        setMinAmount('');
        setMaxAmount('');
        setQuantity('');
        setSwapStock('');
        setPage(1);
        fetchOffers();
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchSymbol.trim()) {
            // Update URL and trigger search
            navigate(`/p2p/${searchSymbol.toUpperCase()}`);
        } else {
            navigate('/p2p');
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value);
    };

    const getBadgeColor = (badge: string) => {
        const colors: Record<string, string> = {
            'Verified Trader': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            'Top Trader': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            'Highly Rated': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
            'Reliable': 'bg-green-500/10 text-green-400 border-green-500/20',
            'Fast Responder': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            'High Volume': 'bg-orange-500/10 text-orange-400 border-orange-500/20'
        };
        return colors[badge] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-slate-400 hover:text-white mb-4 flex items-center gap-2 transition"
                    >
                        ← Back to Dashboard
                    </button>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                        P2P Trading {symbol && `- ${symbol.toUpperCase()}`}
                    </h1>
                    <p className="text-slate-400">Trade stocks directly with other users</p>
                </div>

                {/* Search & Filters */}
                <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 mb-6">
                    <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by stock symbol..."
                                    value={searchSymbol}
                                    onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        {/* Offer Type */}
                        <select
                            value={offerType}
                            onChange={(e) => setOfferType(e.target.value as any)}
                            className="px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="ALL">All Offers</option>
                            <option value="BUY">Buy Offers</option>
                            <option value="SELL">Sell Offers</option>
                            <option value="SWAP">Swap Offers</option>
                        </select>

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="rating">Best Rated</option>
                            <option value="totalTrades">Most Trades</option>
                            <option value="price">Best Price</option>
                            <option value="createdAt">Newest</option>
                        </select>

                        {/* Advanced Filters Button */}
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition flex items-center gap-2 justify-center"
                        >
                            <Filter size={20} />
                            Filters
                        </button>
                    </form>

                    {/* Advanced Filters */}
                    {showFilters && (
                        <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <input
                                type="number"
                                placeholder="Min Amount ($)"
                                value={minAmount}
                                onChange={(e) => setMinAmount(e.target.value)}
                                className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <input
                                type="number"
                                placeholder="Max Amount ($)"
                                value={maxAmount}
                                onChange={(e) => setMaxAmount(e.target.value)}
                                className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <input
                                type="number"
                                placeholder="Quantity"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <input
                                type="text"
                                placeholder="Swap Stock Symbol"
                                value={swapStock}
                                onChange={(e) => setSwapStock(e.target.value.toUpperCase())}
                                className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />

                            <div className="col-span-full flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleApplyFilters}
                                    className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
                                >
                                    Apply Filters
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClearFilters}
                                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Active Filters Display */}
                {(searchSymbol || offerType !== 'ALL' || quantity || minAmount || maxAmount || swapStock) && (
                    <div className="mb-4 flex flex-wrap gap-2">
                        {searchSymbol && (
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm flex items-center gap-2">
                                Stock: {searchSymbol}
                                <button onClick={() => setSearchSymbol('')} className="hover:text-emerald-300">×</button>
                            </span>
                        )}
                        {offerType !== 'ALL' && (
                            <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg text-sm flex items-center gap-2">
                                Type: {offerType}
                                <button onClick={() => setOfferType('ALL')} className="hover:text-purple-300">×</button>
                            </span>
                        )}
                        {quantity && (
                            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-sm flex items-center gap-2">
                                Quantity: {quantity}
                                <button onClick={() => setQuantity('')} className="hover:text-blue-300">×</button>
                            </span>
                        )}
                        {(minAmount || maxAmount) && (
                            <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-lg text-sm flex items-center gap-2">
                                Amount: {minAmount && `$${minAmount}`}{minAmount && maxAmount && ' - '}{maxAmount && `$${maxAmount}`}
                                <button onClick={() => { setMinAmount(''); setMaxAmount(''); }} className="hover:text-yellow-300">×</button>
                            </span>
                        )}
                        {swapStock && (
                            <span className="px-3 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-lg text-sm flex items-center gap-2">
                                Swap for: {swapStock}
                                <button onClick={() => setSwapStock('')} className="hover:text-orange-300">×</button>
                            </span>
                        )}
                    </div>
                )}

                {/* Offers List */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="animate-pulse bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
                                <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
                                <div className="h-4 bg-slate-700 rounded w-2/3"></div>
                            </div>
                        ))}
                    </div>
                ) : offers.length === 0 ? (
                    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-12 text-center">
                        <p className="text-slate-400 text-lg mb-4">
                            {searchSymbol
                                ? `No P2P offers found for ${searchSymbol}`
                                : 'No P2P offers found'
                            }
                        </p>
                        <p className="text-slate-500 text-sm mb-6">Try adjusting your filters or check back later</p>
                        {searchSymbol && (
                            <button
                                onClick={() => {
                                    setSearchSymbol('');
                                    navigate('/p2p');
                                }}
                                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
                            >
                                View All Offers
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {offers.map((offer) => (
                            <div
                                key={offer._id}
                                className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/50 transition"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                    {/* Left: Trader Info */}
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 min-w-12 bg-linear-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                            {offer.trader.firstName[0]}
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-semibold text-white">{offer.trader.username}</h3>
                                                {offer.trader.isVerified && (
                                                    <BadgeCheck className="fill-green-500 text-black" size={22} />
                                                )}
                                            </div>

                                            <div className="text-slate-400 mb-2 text-xs flex items-center gap-1">
                                                <Star className="text-yellow-400" size={14} fill="currentColor" />
                                                <span>{offer.trader.rating.toFixed(1)}</span>
                                                <span className="text-slate-600">({offer.trader.totalReviews})</span>
                                            </div>

                                            <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
                                                <span>{offer.trader.completedTrades} trades</span>
                                                <span>•</span>
                                                <span>{offer.trader.completionRate.toFixed(0)}% completion</span>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {offer.trader.badges.slice(0, 3).map((badge) => (
                                                    <span
                                                        key={badge}
                                                        className={`text-xs px-2 py-1 rounded border ${getBadgeColor(badge)}`}
                                                    >
                                                        {badge}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Center: Offer Details */}
                                    <div className="flex-1">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${offer.offerType === 'BUY'
                                                        ? 'bg-green-500/10 text-green-400'
                                                        : offer.offerType === 'SELL'
                                                            ? 'bg-red-500/10 text-red-400'
                                                            : 'bg-purple-500/10 text-purple-400'
                                                        }`}>
                                                        {offer.offerType}
                                                    </span>
                                                    <span className="text-white font-semibold text-lg">{offer.stockSymbol}</span>
                                                </div>
                                                <p className="text-slate-400 text-sm">{offer.stockName}</p>
                                            </div>

                                            <div>
                                                <p className="text-slate-400 text-sm mb-1">Price per share</p>
                                                <p className="text-white font-semibold text-xl">{formatCurrency(offer.pricePerShare)}</p>
                                            </div>

                                            <div>
                                                <p className="text-slate-400 text-sm mb-1">Quantity Range</p>
                                                <p className="text-white font-medium">
                                                    {offer.minQuantity} - {offer.maxQuantity} shares
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-slate-400 text-sm mb-1">Total Value</p>
                                                <p className="text-white font-medium">{formatCurrency(offer.totalValue)}</p>
                                            </div>

                                            {offer.offerType === 'SWAP' && offer.swapStockSymbol && (
                                                <div className="col-span-2">
                                                    <div className="flex items-center gap-2 text-purple-400">
                                                        <ArrowLeftRight size={16} />
                                                        <span className="font-medium">
                                                            Swap for {offer.swapStockSymbol} ({offer.swapStockName})
                                                        </span>
                                                        <span className="text-slate-500">
                                                            Ratio: 1:{offer.swapRatio}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {offer.paymentMethods.map((method) => (
                                                <span
                                                    key={method}
                                                    className="text-xs px-2 py-1 bg-slate-700/50 text-slate-300 rounded"
                                                >
                                                    {method}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Right: Action */}
                                    <div className="flex flex-col items-end gap-2">
                                        <button
                                            onClick={() => navigate(`/p2p/trade/${offer._id}`)}
                                            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition whitespace-nowrap"
                                        >
                                            Trade Now
                                        </button>
                                        <p className="text-xs text-slate-500">
                                            {offer.completedTrades} completed
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-8 flex justify-center items-center gap-2">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition"
                        >
                            Previous
                        </button>

                        <div className="flex gap-2">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const pageNum = page <= 3 ? i + 1 : page - 2 + i;
                                if (pageNum > totalPages) return null;

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        className={`w-10 h-10 rounded-lg transition ${page === pageNum
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-800 hover:bg-slate-700 text-white'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}