import { useState, useEffect } from 'react';
import { ArrowLeft, Shield, BadgeCheck, Star, AlertCircle, Copy, Check, X, Flag, Ban, Wallet } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { sendP2PTradeStatusEmail } from '../utils/emailService';
import { API_BASE_URL } from '../utils';

interface Trader {
    username: string;
    firstName: string;
    totalTrades: number;
    completedTrades: number;
    rating: number;
    totalReviews: number;
    completionRate: number;
    isVerified: boolean;
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
    termsAndConditions?: string;
    trader: Trader;
}

const CRYPTO_WALLETS = {
    Bitcoin: { address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', qr: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' },
    Ethereum: { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', qr: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' },
    USDT: { address: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9', qr: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9' },
    BNB: { address: 'bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2', qr: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2' },
    Solana: { address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', qr: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU' }
};

export default function P2PTradePage() {
    const { id } = useParams()

    const [offer, setOffer] = useState<P2POffer | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState('');
    const [amountUSD, setAmountUSD] = useState('');
    const [selectedPayment, setSelectedPayment] = useState('');
    const [showCryptoModal, setShowCryptoModal] = useState(false);
    const [selectedCrypto, setSelectedCrypto] = useState<keyof typeof CRYPTO_WALLETS>('Bitcoin');
    const [copiedAddress, setCopiedAddress] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const { fetchUnreadCount } = useApp()

    useEffect(() => {
        fetchOffer();
    }, [id]);

    const fetchOffer = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/p2p/offers/${id}`);
            if (!response.ok) throw new Error('Failed to fetch offer');
            const data = await response.json();
            setOffer(data.offer);
        } catch (error) {
            console.error('Error fetching offer:', error);
        } finally {
            setLoading(false);
        }
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

    const handleQuantityChange = (value: string) => {
        setQuantity(value);
        if (offer && value) {
            const amount = parseFloat(value) * offer.pricePerShare;
            setAmountUSD(amount.toFixed(2));
        } else {
            setAmountUSD('');
        }
    };

    const handleAmountChange = (value: string) => {
        setAmountUSD(value);
        if (offer && value) {
            const qty = parseFloat(value) / offer.pricePerShare;
            setQuantity(qty.toFixed(2));
        } else {
            setQuantity('');
        }
    };

    const showToastMessage = (message: string) => {
        setToastMessage(message);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const handlePaymentSelect = (method: string) => {
        setSelectedPayment(method);

        if (method === 'PayPal' || method === 'Bank Transfer') {
            showToastMessage(`${method} is currently unavailable. Please select another payment method.`);
            setSelectedPayment('');
        } else if (method === 'Crypto') {
            setShowCryptoModal(true);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
    };

    const handleCashPayment = async () => {
        if (!quantity || !offer) return;

        const qty = parseFloat(quantity);
        if (qty < offer.minQuantity || qty > offer.maxQuantity) {
            showToastMessage(`Quantity must be between ${offer.minQuantity} and ${offer.maxQuantity} shares`);
            return;
        }

        setIsProcessing(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/p2p/trades/initiate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    offerId: offer._id,
                    quantity: qty,
                    paymentMethod: 'Cash Balance'
                })
            });

            if (!response.ok) throw new Error('Failed to initiate trade');

            const data = await response.json();

            // Send trade initiation email to seller
            try {
                // await sendP2PTradeStatusEmail(
                //     data.sellerEmail,
                //     'New P2P Trade Request',
                //     `A buyer wants to buy ${qty} shares of ${offer.stockSymbol}`,
                //     {
                //         tradeId: data.trade._id,
                //         stockSymbol: offer.stockSymbol,
                //         quantity: qty,
                //         pricePerShare: offer.pricePerShare,
                //         totalAmount: parseFloat(amountUSD),
                //         status: 'INITIATED'
                //     },
                //     `/p2p/trades/${data.trade._id}`,
                //     'View Trade Details'
                // );
                // console.log('Seller email sent successfully');

                // // Add small delay before sending admin email to avoid rate limiting
                // await new Promise(resolve => setTimeout(resolve, 500));

                // Send notification to admin
                await sendP2PTradeStatusEmail(
                    'admin@tradehub.com',
                    'New P2P Trade Initiated - Admin Review Required',
                    `A new P2P trade has been initiated for ${qty} shares of ${offer.stockSymbol}`,
                    {
                        tradeId: data.trade._id,
                        stockSymbol: offer.stockSymbol,
                        quantity: qty,
                        pricePerShare: offer.pricePerShare,
                        totalAmount: parseFloat(amountUSD),
                        status: 'INITIATED'
                    },
                    `/p2p/confirm/${data.trade._id}`,
                    'Review Trade'
                );
                console.log('Admin email sent successfully');
            } catch (emailError) {
                console.error('Failed to send email:', emailError);
                // Don't block the trade if email fails
            }

            fetchUnreadCount();

            showToastMessage('Trade initiated successfully! Email sent to seller. Redirecting...');
            setTimeout(() => window.location.href = `/p2p/trades/${data.trade._id}`, 2000);
        } catch (error) {
            showToastMessage('Failed to initiate trade. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    // Update handleInitiateTrade
    const handleInitiateTrade = async () => {
        if (!quantity || !offer) return;

        const qty = parseFloat(quantity);
        if (qty < offer.minQuantity || qty > offer.maxQuantity) {
            showToastMessage(`Quantity must be between ${offer.minQuantity} and ${offer.maxQuantity} shares`);
            return;
        }

        setIsProcessing(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/p2p/trades/initiate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    offerId: offer._id,
                    quantity: qty,
                    paymentMethod: 'Asset'
                })
            });

            if (!response.ok) throw new Error('Failed to initiate trade');

            const data = await response.json();

            // Send trade initiation email to buyer
            try {
                // await sendP2PTradeStatusEmail(
                //     data.buyerEmail,
                //     'New P2P Trade Request',
                //     `A seller wants to sell ${qty} shares of ${offer.stockSymbol}`,
                //     {
                //         tradeId: data.trade._id,
                //         stockSymbol: offer.stockSymbol,
                //         quantity: qty,
                //         pricePerShare: offer.pricePerShare,
                //         totalAmount: parseFloat(amountUSD),
                //         status: 'INITIATED'
                //     },
                //     `/p2p/trades/${data.trade._id}`,
                //     'View Trade Details'
                // );
                // console.log('Buyer email sent successfully');

                // // Add small delay before sending admin email to avoid rate limiting
                // await new Promise(resolve => setTimeout(resolve, 500));

                // Send notification to admin
                await sendP2PTradeStatusEmail(
                    'admin@tradehub.com',
                    'New P2P Trade Initiated - Admin Review Required',
                    `A new P2P trade has been initiated for ${qty} shares of ${offer.stockSymbol}`,
                    {
                        tradeId: data.trade._id,
                        stockSymbol: offer.stockSymbol,
                        quantity: qty,
                        pricePerShare: offer.pricePerShare,
                        totalAmount: parseFloat(amountUSD),
                        status: 'INITIATED'
                    },
                    `/p2p/confirm/${data.trade._id}`,
                    'Review Trade'
                );
                console.log('Admin email sent successfully');
            } catch (emailError) {
                console.error('Failed to send email:', emailError);
            }

            fetchUnreadCount();

            showToastMessage('Trade initiated successfully! Email sent. Redirecting...');
            setTimeout(() => window.location.href = `/p2p/trades/${data.trade._id}`, 2000);
        } catch (error) {
            showToastMessage('Failed to initiate trade. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value);
    };

    const shouldShowPaymentOptions = () => {
        if (!offer) return false;
        // Only show payment when user is BUYING (i.e., accepting a BUY offer means you're buying)
        return offer.offerType === 'BUY';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    if (!offer) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-white text-lg mb-4">Offer not found</p>
                    <button onClick={() => window.location.href = '/p2p'} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition">
                        Back to P2P
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <button
                    onClick={() => window.location.href = '/p2p'}
                    className="text-slate-400 hover:text-white mb-6 flex items-center gap-2 transition"
                >
                    <ArrowLeft size={20} />
                    Back to Offers
                </button>

                {/* Security Banner */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <Shield className="text-emerald-400 shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                        <p className="text-emerald-400 font-semibold text-sm mb-1">Secure P2P Trading</p>
                        <p className="text-emerald-400/80 text-xs">
                            All funds and stocks are held securely by TradeHub escrow until both parties complete the transaction.
                            Your assets are fully protected throughout the trade.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Offer Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Trader Info */}
                        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Trader Information</h2>

                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-16 h-16 min-w-16 bg-linear-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shrink-0">
                                    {offer.trader.firstName[0]}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-lg font-semibold text-white">{offer.trader.username}</h3>
                                        {offer.trader.isVerified && (
                                            <BadgeCheck className="text-black fill-green-500" size={22} />
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1 text-sm text-slate-400 mb-3">
                                        <Star className="text-yellow-400" size={14} fill="currentColor" />
                                        <span>{offer.trader.rating.toFixed(1)}</span>
                                        <span className="text-slate-600">({offer.trader.totalReviews})</span>
                                    </div>

                                    <div className="flex items-center gap-3 text-sm text-slate-400 mb-3">
                                        <span>{offer.trader.completedTrades} trades</span>
                                        <span>•</span>
                                        <span>{offer.trader.completionRate.toFixed(0)}% completion</span>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {offer.trader.badges.map((badge) => (
                                            <span key={badge} className={`text-xs px-2 py-1 ${getBadgeColor(badge)} rounded`}>
                                                {badge}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Offer Details */}
                        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Offer Details</h2>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p className="text-slate-400 text-sm mb-1">Type</p>
                                    <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${offer.offerType === 'BUY'
                                        ? 'bg-green-500/10 text-green-400'
                                        : offer.offerType === 'SELL'
                                            ? 'bg-red-500/10 text-red-400'
                                            : 'bg-purple-500/10 text-purple-400'
                                        }`}>
                                        {offer.offerType}
                                    </span>
                                </div>

                                <div>
                                    <p className="text-slate-400 text-sm mb-1">Stock</p>
                                    <p className="text-white font-semibold">{offer.stockSymbol}</p>
                                    <p className="text-slate-500 text-xs">{offer.stockName}</p>
                                </div>

                                <div>
                                    <p className="text-slate-400 text-sm mb-1">Price per Share</p>
                                    <p className="text-white font-semibold text-lg">{formatCurrency(offer.pricePerShare)}</p>
                                </div>

                                <div>
                                    <p className="text-slate-400 text-sm mb-1">Quantity Range</p>
                                    <p className="text-white font-semibold">{offer.minQuantity} - {offer.maxQuantity} shares</p>
                                </div>
                            </div>

                            {offer.termsAndConditions && (
                                <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                    <p className="text-slate-400 text-xs mb-1">Terms & Conditions</p>
                                    <p className="text-white text-sm">{offer.termsAndConditions}</p>
                                </div>
                            )}
                        </div>

                        {/* Trade Amount */}
                        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Enter Trade Amount</h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Quantity (shares)
                                    </label>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => handleQuantityChange(e.target.value)}
                                        placeholder={`${offer.minQuantity} - ${offer.maxQuantity}`}
                                        min={offer.minQuantity}
                                        max={offer.maxQuantity}
                                        step="0.01"
                                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Amount (USD)
                                    </label>
                                    <input
                                        type="number"
                                        value={amountUSD}
                                        onChange={(e) => handleAmountChange(e.target.value)}
                                        placeholder="0.00"
                                        step="0.01"
                                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            {quantity && (
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                    <p className="text-emerald-400 text-sm">
                                        Total: <span className="font-semibold">{formatCurrency(parseFloat(amountUSD || '0'))}</span> for <span className="font-semibold">{quantity}</span> shares
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Payment Method - Only for SELL offers (user is buying) */}
                        {shouldShowPaymentOptions() && (
                            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
                                <h2 className="text-xl font-bold text-white mb-4">Payment Method</h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {offer.paymentMethods.map((method) => {
                                        const isDisabled = method === 'PayPal' || method === 'Bank Transfer';
                                        const isCrypto = method === 'Crypto';

                                        return (
                                            <button
                                                key={method}
                                                onClick={() => handlePaymentSelect(method)}
                                                disabled={isDisabled && !isCrypto}
                                                className={`p-4 rounded-lg border-2 transition text-left ${selectedPayment === method
                                                    ? 'border-emerald-500 bg-emerald-500/10'
                                                    : isDisabled && !isCrypto
                                                        ? 'border-slate-700 bg-slate-800/30 opacity-50 cursor-not-allowed'
                                                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-white font-medium">{method}</span>
                                                    {isDisabled && !isCrypto && (
                                                        <span className="text-xs text-slate-500">Unavailable</span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {selectedPayment === 'Cash Balance' && quantity && (
                                    <button
                                        onClick={handleCashPayment}
                                        disabled={isProcessing}
                                        className="w-full mt-6 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
                                    >
                                        {isProcessing ? 'Processing...' : `Pay ${formatCurrency(parseFloat(amountUSD))} Now`}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* For BUY and SWAP offers - User is selling/swapping stocks */}
                        {!shouldShowPaymentOptions() && quantity && (
                            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
                                <button
                                    onClick={handleInitiateTrade}
                                    disabled={isProcessing}
                                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
                                >
                                    {isProcessing ? 'Processing...' :
                                        offer.offerType === 'SELL'
                                            ? `Sell ${quantity} Shares`
                                            : `Initiate Swap`
                                    }
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right: Actions & Info */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Actions</h3>

                            <div className="space-y-3">
                                <button className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg transition">
                                    <Flag size={18} />
                                    <span className="text-sm font-medium">Report Transaction</span>
                                </button>

                                <button className="w-full flex items-center gap-3 px-4 py-3 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-lg transition">
                                    <AlertCircle size={18} />
                                    <span className="text-sm font-medium">File Complaint</span>
                                </button>

                                <button className="w-full flex items-center gap-3 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded-lg transition">
                                    <Ban size={18} />
                                    <span className="text-sm font-medium">Cancel Trade</span>
                                </button>
                            </div>
                        </div>

                        {/* Security Info */}
                        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Security & Protection</h3>

                            <div className="space-y-4 text-sm">
                                <div className="flex gap-3">
                                    <Shield className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                                    <div>
                                        <p className="text-white font-medium mb-1">Escrow Protection</p>
                                        <p className="text-slate-400 text-xs">All funds held in secure escrow until trade completion</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Check className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                                    <div>
                                        <p className="text-white font-medium mb-1">Verified Transfers</p>
                                        <p className="text-slate-400 text-xs">Stock transfers verified before release</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <AlertCircle className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                                    <div>
                                        <p className="text-white font-medium mb-1">Dispute Resolution</p>
                                        <p className="text-slate-400 text-xs">24/7 support for dispute handling</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Wallet className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                                    <div>
                                        <p className="text-white font-medium mb-1">Refund Guarantee</p>
                                        <p className="text-slate-400 text-xs">Full refund if transaction fails</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Crypto Payment Modal */}
            {showCryptoModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
                            <h2 className="text-xl font-bold text-white">Pay with Cryptocurrency</h2>
                            <button onClick={() => setShowCryptoModal(false)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Crypto Tabs */}
                            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                                {(Object.keys(CRYPTO_WALLETS) as Array<keyof typeof CRYPTO_WALLETS>).map((crypto) => (
                                    <button
                                        key={crypto}
                                        onClick={() => setSelectedCrypto(crypto)}
                                        className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${selectedCrypto === crypto
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                            }`}
                                    >
                                        {crypto}
                                    </button>
                                ))}
                            </div>

                            {/* QR Code & Address */}
                            <div className="text-center mb-6">
                                <div className="inline-block p-4 bg-white rounded-xl mb-4">
                                    <img
                                        src={CRYPTO_WALLETS[selectedCrypto].qr}
                                        alt={`${selectedCrypto} QR Code`}
                                        className="w-48 h-48"
                                    />
                                </div>

                                <p className="text-slate-400 text-sm mb-2">Wallet Address</p>
                                <div className="flex items-center gap-2 justify-center bg-slate-800/50 border border-slate-700 rounded-lg p-3 max-w-md mx-auto">
                                    <code className="text-white text-sm break-all">{CRYPTO_WALLETS[selectedCrypto].address}</code>
                                    <button
                                        onClick={() => copyToClipboard(CRYPTO_WALLETS[selectedCrypto].address)}
                                        className="shrink-0 p-2 hover:bg-slate-700 rounded transition"
                                    >
                                        {copiedAddress ? (
                                            <Check className="text-green-400" size={18} />
                                        ) : (
                                            <Copy className="text-slate-400" size={18} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Info Message */}
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                                <div className="flex gap-3">
                                    <AlertCircle className="text-blue-400 shrink-0 mt-0.5" size={20} />
                                    <div className="flex-1">
                                        <p className="text-blue-400 font-semibold text-sm mb-2">Official TradeHub Wallet</p>
                                        <p className="text-blue-400/80 text-xs leading-relaxed">
                                            This is TradeHub's official {selectedCrypto} wallet address. All payments made to this address are secure and protected by our escrow system.
                                            In case of failed P2P transactions, your funds will be automatically refunded within 24-48 hours.
                                            Once payment is verified on the blockchain, your stocks will be transferred to your account.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => setShowCryptoModal(false)}
                                    className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        showToastMessage('Payment instruction sent. Please complete the payment and wait for confirmation.');
                                        setShowCryptoModal(false);
                                    }}
                                    className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition"
                                >
                                    I've Sent Payment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {showToast && (
                <div className="fixed bottom-4 right-4 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-4 max-w-md z-50 animate-slide-up">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="text-emerald-400 shrink-0" size={20} />
                        <p className="text-white text-sm">{toastMessage}</p>
                    </div>
                </div>
            )}
        </div>
    );
}