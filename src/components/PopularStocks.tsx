import { TrendingUp, TrendingDown } from 'lucide-react';

interface Stock {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    logo: string;
}

interface PopularStocksProps {
    stocks: Stock[];
    isLoading: boolean;
    onStockClick: (symbol: string) => void;
    formatNumber: (value: number) => string;
}

export default function PopularStocks({ stocks, isLoading, onStockClick, formatNumber }: PopularStocksProps) {

    return (
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Popular Stocks</h3>

            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="animate-pulse flex items-center justify-between p-3 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-700 rounded-lg"></div>
                                <div className="space-y-2">
                                    <div className="h-3 bg-slate-700 rounded w-16"></div>
                                    <div className="h-2 bg-slate-700 rounded w-24"></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-3 bg-slate-700 rounded w-16"></div>
                                <div className="h-2 bg-slate-700 rounded w-12"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : stocks.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-slate-400 text-sm">Unable to load popular stocks</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {stocks.map((stock) => (
                        <button
                            key={stock.symbol}
                            onClick={() => onStockClick(stock.symbol)}
                            className="w-full flex items-center justify-between p-3 hover:bg-slate-800/50 rounded-xl transition group"
                        >
                            <div className="flex items-center gap-3">
                                {stock.logo ? (
                                    <img
                                        src={stock.logo}
                                        alt={stock.symbol}
                                        className="w-10 h-10 rounded-lg object-cover bg-white"
                                        onError={(e) => {
                                            // Fallback if image fails to load
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                ) : null}
                                <div className={`w-10 h-10 bg-linear-to-br from-slate-700 to-slate-600 rounded-lg flex items-center justify-center ${stock.logo ? 'hidden' : ''}`}>
                                    <span className="text-white font-bold text-sm">{stock.symbol.slice(0, 2)}</span>
                                </div>

                                <div className="text-left">
                                    <p className="text-white font-medium text-sm group-hover:text-emerald-400 transition">{stock.symbol}</p>
                                    <p className="text-slate-500 text-xs truncate max-w-25">{stock.name}</p>
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="text-white font-semibold text-sm">${formatNumber(stock.price)}</p>
                                <div className="flex items-center gap-1 justify-end">
                                    {stock.changePercent >= 0 ? (
                                        <TrendingUp size={12} className="text-emerald-400" />
                                    ) : (
                                        <TrendingDown size={12} className="text-red-400" />
                                    )}
                                    <span className={`text-xs ${stock.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {stock.changePercent >= 0 ? '+' : ''}{formatNumber(stock.changePercent)}%
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
