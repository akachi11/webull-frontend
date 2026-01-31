import { useState, useEffect } from 'react';
import { ArrowLeft, Shield, BadgeCheck, Clock, AlertCircle, Flag, Ban, CheckCircle, Wallet, X, XCircle } from 'lucide-react';
import { API_BASE_URL } from '../utils';

export default function P2PPendingTradePage() {
    const [trade, setTrade] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRemaining, setTimeRemaining] = useState(30 * 60);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const tradeId = window.location.pathname.split('/').pop();

    useEffect(() => {
        if (tradeId) fetchTrade();
    }, [tradeId]);

    // Auto-fetch trade info every 3 seconds
    useEffect(() => {
        if (!tradeId) return;

        const interval = setInterval(() => {
            fetchTrade(false); // false = don't show loading state
        }, 3000);

        return () => clearInterval(interval);
    }, [tradeId]);

    useEffect(() => {
        if (!trade) return;

        const initiatedAt = new Date(trade.initiatedAt).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - initiatedAt) / 1000);
        const remaining = Math.max(0, (30 * 60) - elapsed);
        setTimeRemaining(remaining);

        // Show payment modal if user is buyer and status is pending
        if (trade.userIsBuyer && trade.status === 'PENDING') {
            setShowPaymentModal(true);
        }

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleTradeExpired();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [trade]);

    const fetchTrade = async (showLoading = true) => {
        if (showLoading && isInitialLoad) {
            setLoading(true);
        }

        try {
            const token = localStorage.getItem('token');
            if (!tradeId) throw new Error('Missing tradeId');
            const response = await fetch(`${API_BASE_URL}/p2p/trades/${tradeId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch trade');
            const data = await response.json();
            setTrade(data.trade);

            // Handle completed or failed status
            if (data.trade.status === 'COMPLETED') {
                setTimeout(() => {
                    window.location.href = '/p2p/trades';
                }, 3000);
            } else if (data.trade.status === 'FAILED' || data.trade.status === 'CANCELLED') {
                setTimeout(() => {
                    window.location.href = '/p2p/trades';
                }, 3000);
            }
        } catch (error) {
            console.error('Error fetching trade:', error);
            if (isInitialLoad) {
                showToastMessage('Failed to load trade details');
            }
        } finally {
            if (showLoading && isInitialLoad) {
                setLoading(false);
                setIsInitialLoad(false);
            }
        }
    };

    const handleTradeExpired = async () => {
        showToastMessage('Trade expired. Redirecting...');
        setTimeout(() => window.location.href = '/p2p/trades', 2000);
    };

    const handleConfirmPayment = async () => {
        setIsProcessing(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/p2p/trades/${tradeId}/confirm-payment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Payment confirmation failed');

            // Refresh user balance after payment confirmation
            try {
                const userResponse = await fetch(`${API_BASE_URL}/user/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    // Dispatch event to update balance in sidebar/navbar
                    window.dispatchEvent(new CustomEvent('userBalanceUpdated', { detail: userData.user }));
                }
            } catch (e) {
                console.error('Failed to refresh user balance:', e);
            }

            showToastMessage('Payment confirmed! Funds/stocks deducted.');
            setShowPaymentModal(false);
            fetchTrade(false);
        } catch (error) {
            showToastMessage('Failed to confirm payment. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePaymentSent = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/p2p/trades/${tradeId}/payment-sent`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to mark payment as sent');

            showToastMessage('Payment marked as sent. Waiting for seller confirmation.');
            fetchTrade(false);
        } catch (error) {
            showToastMessage('Failed to update payment status.');
        }
    };

    const handleCancelTrade = async () => {
        if (!confirm('Are you sure you want to cancel this trade?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/p2p/trades/${tradeId}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason: 'User cancelled' })
            });

            if (!response.ok) throw new Error('Failed to cancel trade');

            showToastMessage('Trade cancelled successfully.');
            setTimeout(() => window.location.href = '/p2p/trades', 1500);
        } catch (error) {
            showToastMessage('Failed to cancel trade.');
        }
    };

    const showToastMessage = (message: string) => {
        setToastMessage(message);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-white">Loading trade details...</div>
            </div>
        );
    }

    if (!trade) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-white text-lg mb-4">Trade not found</p>
                    <button onClick={() => window.location.href = '/p2p/trades'} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition">
                        Back to Trades
                    </button>
                </div>
            </div>
        );
    }

    // Trade Completed Screen
    if (trade.status === 'COMPLETED') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-emerald-500 rounded-2xl p-8 max-w-md w-full text-center">
                    <CheckCircle className="text-emerald-400 mx-auto mb-4" size={48} />
                    <h1 className="text-2xl font-bold text-white mb-2">Trade Completed!</h1>
                    <p className="text-slate-400 mb-6">
                        The trade has been successfully completed. Both parties have been notified via email.
                    </p>
                    <p className="text-sm text-slate-500">Redirecting to trades page...</p>
                </div>
            </div>
        );
    }

    // Trade Failed Screen
    if (trade.status === 'FAILED' || trade.status === 'CANCELLED') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-red-500 rounded-2xl p-8 max-w-md w-full text-center">
                    <XCircle className="text-red-400 mx-auto mb-4" size={48} />
                    <h1 className="text-2xl font-bold text-white mb-2">Trade {trade.status === 'FAILED' ? 'Failed' : 'Cancelled'}</h1>
                    <p className="text-slate-400 mb-6">
                        {trade.status === 'FAILED'
                            ? 'The trade has failed. Your funds have been returned to your account.'
                            : 'The trade has been cancelled. Any escrowed funds have been returned.'}
                    </p>
                    <p className="text-sm text-slate-500">Redirecting to trades page...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
                <button
                    onClick={() => window.location.href = '/p2p/trades'}
                    className="text-slate-400 hover:text-white mb-6 flex items-center gap-2 transition"
                >
                    <ArrowLeft size={20} />
                    Back to Trades
                </button>

                {/* Countdown Timer */}
                <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Clock className="text-red-400" size={24} />
                            <div>
                                <p className="text-red-400 font-semibold">Time Remaining</p>
                                <p className="text-red-300 text-sm">Complete payment before time expires</p>
                            </div>
                        </div>
                        <div className="text-4xl font-bold text-red-400">
                            {formatTime(timeRemaining)}
                        </div>
                    </div>
                </div>

                {/* Security Banner */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <Shield className="text-emerald-400 shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                        <p className="text-emerald-400 font-semibold text-sm mb-1">Funds Protected by Escrow</p>
                        <p className="text-emerald-400/80 text-xs">
                            Your {trade.isSwapTrade ? 'stocks are' : 'money is'} held securely until both parties confirm the transaction.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Trade Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Trade Partner Info */}
                        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
                            <h2 className="text-xl font-bold text-white mb-4">
                                Trade Partner
                            </h2>

                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 min-w-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shrink-0">
                                    {trade.tradePartner?.firstName?.[0] || 'U'}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-lg font-semibold text-white">
                                            {trade.tradePartner?.firstName} {trade.tradePartner?.lastName}
                                        </h3>
                                        <BadgeCheck className="text-black fill-green-500" size={22} />
                                    </div>
                                    <p className="text-slate-400 text-sm">
                                        {trade.currentUserRole === 'owner' ? 'Trade Initiator' : 'Offer Creator'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Trade Details */}
                        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Trade Details</h2>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-slate-400 text-sm mb-1">Status</p>
                                    <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${trade.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400' :
                                        trade.status === 'ACCEPTED' ? 'bg-blue-500/10 text-blue-400' :
                                            trade.status === 'PAYMENT_SENT' ? 'bg-purple-500/10 text-purple-400' :
                                                trade.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' :
                                                    'bg-red-500/10 text-red-400'
                                        }`}>
                                        {trade.status}
                                    </span>
                                </div>

                                <div>
                                    <p className="text-slate-400 text-sm mb-1">Stock</p>
                                    <p className="text-white font-semibold">{trade.stockSymbol}</p>
                                </div>

                                <div>
                                    <p className="text-slate-400 text-sm mb-1">Quantity</p>
                                    <p className="text-white font-semibold">{trade.quantity} shares</p>
                                </div>

                                <div>
                                    <p className="text-slate-400 text-sm mb-1">Price per Share</p>
                                    <p className="text-white font-semibold">{formatCurrency(trade.pricePerShare)}</p>
                                </div>

                                <div className="col-span-2">
                                    <p className="text-slate-400 text-sm mb-1">Total Amount</p>
                                    <p className="text-emerald-400 font-bold text-2xl">{formatCurrency(trade.totalAmount)}</p>
                                </div>

                                <div>
                                    <p className="text-slate-400 text-sm mb-1">Payment Method</p>
                                    <p className="text-white font-semibold">{trade.paymentMethod}</p>
                                </div>

                                <div>
                                    <p className="text-slate-400 text-sm mb-1">Your Role</p>
                                    <p className="text-white font-semibold">{trade.userIsBuyer ? 'Buyer' : 'Seller'}</p>
                                </div>

                                {trade.isSwapTrade && (
                                    <>
                                        <div>
                                            <p className="text-slate-400 text-sm mb-1">Swap Stock</p>
                                            <p className="text-white font-semibold">{trade.swapStockSymbol}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-sm mb-1">Swap Quantity</p>
                                            <p className="text-white font-semibold">{trade.swapQuantity} shares</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Trade Actions</h2>

                            <div className="space-y-3">
                                {trade.userIsBuyer && trade.status === 'ACCEPTED' && (
                                    <button
                                        onClick={handlePaymentSent}
                                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition"
                                    >
                                        <CheckCircle size={20} />
                                        I Have Made Payment
                                    </button>
                                )}

                                {trade.userIsSeller && trade.status === 'PAYMENT_SENT' && (
                                    <button
                                        onClick={() => showToastMessage('Confirm payment receipt feature coming soon')}
                                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition"
                                    >
                                        <CheckCircle size={20} />
                                        I Have Received Payment
                                    </button>
                                )}

                                {trade.status === 'PENDING' && !trade.userIsBuyer && (
                                    <div className="text-center text-slate-400 text-sm py-4">
                                        Waiting for buyer to confirm payment...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions & Info */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>

                            <div className="space-y-3">
                                <button className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg transition">
                                    <Flag size={18} />
                                    <span className="text-sm font-medium">Report Issue</span>
                                </button>

                                <button className="w-full flex items-center gap-3 px-4 py-3 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-lg transition">
                                    <AlertCircle size={18} />
                                    <span className="text-sm font-medium">File Complaint</span>
                                </button>

                                <button
                                    onClick={handleCancelTrade}
                                    className="w-full flex items-center gap-3 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded-lg transition"
                                >
                                    <Ban size={18} />
                                    <span className="text-sm font-medium">Cancel Trade</span>
                                </button>
                            </div>
                        </div>

                        {/* Security Info */}
                        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Protection Details</h3>

                            <div className="space-y-4 text-sm">
                                <div className="flex gap-3">
                                    <Shield className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                                    <div>
                                        <p className="text-white font-medium mb-1">Escrow Active</p>
                                        <p className="text-slate-400 text-xs">Funds locked until completion</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Wallet className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                                    <div>
                                        <p className="text-white font-medium mb-1">Refund Protection</p>
                                        <p className="text-slate-400 text-xs">Auto-refund if trade expires</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <AlertCircle className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                                    <div>
                                        <p className="text-white font-medium mb-1">24/7 Support</p>
                                        <p className="text-slate-400 text-xs">Help available anytime</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Confirmation Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Confirm Payment</h2>
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                                <div className="flex gap-3">
                                    <AlertCircle className="text-yellow-400 shrink-0 mt-0.5" size={20} />
                                    <div>
                                        <p className="text-yellow-400 font-semibold text-sm mb-2">
                                            {trade.isSwapTrade ? 'Stock Swap Required' : 'Payment Required'}
                                        </p>
                                        <p className="text-yellow-400/80 text-xs">
                                            {trade.isSwapTrade
                                                ? `This is a swap trade. You will exchange ${trade.swapQuantity} shares of ${trade.swapStockSymbol} for ${trade.quantity} shares of ${trade.stockSymbol}.`
                                                : `You need to pay ${formatCurrency(trade.totalAmount)} to proceed with this trade. Funds will be held in escrow until the seller releases the stocks.`
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">You Release:</span>
                                    <span className="text-white font-semibold">
                                        {trade.isSwapTrade
                                            ? `${trade.swapQuantity} ${trade.swapStockSymbol} shares`
                                            : formatCurrency(trade.totalAmount)
                                        }
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">You Receive:</span>
                                    <span className="text-emerald-400 font-semibold">
                                        {trade.quantity} {trade.stockSymbol} shares
                                    </span>
                                </div>
                            </div>

                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-6">
                                <p className="text-blue-400 text-xs">
                                    By confirming, your {trade.isSwapTrade ? 'stocks' : 'payment'} will be deducted and held in escrow.
                                    The trade will complete once the seller releases the {trade.stockSymbol} stocks.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmPayment}
                                    disabled={isProcessing}
                                    className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold rounded-lg transition"
                                >
                                    {isProcessing ? 'Processing...' : 'Confirm & Release'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {showToast && (
                <div className="fixed bottom-4 right-4 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-4 max-w-md z-50 animate-fade-in">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="text-emerald-400 shrink-0" size={20} />
                        <p className="text-white text-sm">{toastMessage}</p>
                    </div>
                </div>
            )}
        </div>
    );
}