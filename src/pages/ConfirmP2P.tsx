import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { sendP2PTradeStatusEmail } from '../utils/emailService';

const API_BASE_URL = 'http://localhost:5000/api';

export default function P2PTradeConfirmationPage() {
    const { tradeId } = useParams();
    const [trade, setTrade] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTrade();
    }, [tradeId]);

    const fetchTrade = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/p2p/trades/${tradeId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch trade');

            const data = await response.json();
            setTrade(data.trade);

            // Check if already completed
            if (data.trade.status === 'COMPLETED') {
                setCompleted(true);
            }
        } catch (error) {
            console.error('Error fetching trade:', error);
            setError('Failed to load trade details');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmCompletion = async () => {
        setConfirming(true);
        try {
            const token = localStorage.getItem('token');

            // First, confirm payment if not already accepted/sent
            if (trade.status === 'PENDING') {
                const confirmPaymentResponse = await fetch(`${API_BASE_URL}/p2p/trades/${tradeId}/confirm-payment`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!confirmPaymentResponse.ok) {
                    throw new Error('Failed to confirm payment');
                }

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
            }

            // Then complete the trade
            const response = await fetch(`${API_BASE_URL}/p2p/trades/${tradeId}/complete`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to complete trade');
            }

            const data = await response.json();

            // Send completion email to the other party
            try {
                const isUserBuyer = trade.userIsBuyer;
                const recipientEmail = isUserBuyer ? data.sellerEmail : data.buyerEmail;
                const recipientName = isUserBuyer ? data.sellerName : data.buyerName;

                await sendP2PTradeStatusEmail(
                    recipientEmail,
                    'P2P Trade Completed',
                    `Your P2P trade for ${trade.quantity} shares of ${trade.stockSymbol} has been completed successfully!`,
                    {
                        tradeId: trade._id,
                        stockSymbol: trade.stockSymbol,
                        quantity: trade.quantity,
                        pricePerShare: trade.pricePerShare,
                        totalAmount: trade.totalAmount,
                        status: 'COMPLETED'
                    }
                );
            } catch (emailError) {
                console.error('Failed to send completion email:', emailError);
            }

            setCompleted(true);
            setTimeout(() => {
                window.location.href = '/p2p/trades';
                // Force a hard reload to refresh all data including balance
                setTimeout(() => window.location.reload(), 500);
            }, 3000);
        } catch (error) {
            console.error('Error completing trade:', error);
            setError(error instanceof Error ? error.message : 'Failed to complete trade. Please try again.');
        } finally {
            setConfirming(false);
        }
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
                <Loader className="animate-spin text-emerald-400" size={40} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-red-500 rounded-2xl p-8 max-w-md w-full text-center">
                    <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
                    <p className="text-white text-lg mb-2">Error</p>
                    <p className="text-slate-400 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.href = '/p2p/trades'}
                        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
                    >
                        Back to Trades
                    </button>
                </div>
            </div>
        );
    }

    if (completed) {
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full">
                <div className="p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="text-emerald-400" size={24} />
                        <h1 className="text-2xl font-bold text-white">Confirm Trade Completion</h1>
                    </div>
                    <p className="text-slate-400 text-sm">
                        Please review the trade details and confirm completion
                    </p>
                </div>

                <div className="p-6">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Trade Details</h2>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Stock Symbol:</span>
                                <span className="text-white font-semibold">{trade?.stockSymbol}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Quantity:</span>
                                <span className="text-white font-semibold">{trade?.quantity} shares</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Price per Share:</span>
                                <span className="text-white font-semibold">{formatCurrency(trade?.pricePerShare)}</span>
                            </div>
                            <div className="flex justify-between pt-3 border-t border-slate-700">
                                <span className="text-slate-400 font-semibold">Total Amount:</span>
                                <span className="text-emerald-400 font-bold text-lg">{formatCurrency(trade?.totalAmount)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                        <div className="flex gap-3">
                            <AlertCircle className="text-blue-400 shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="text-blue-400 font-semibold text-sm mb-1">Important</p>
                                <p className="text-blue-400/80 text-xs">
                                    By confirming, you acknowledge that you have received the payment/stocks and the trade will be marked as complete.
                                    The other party will be notified via email.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => window.location.href = '/p2p/trades'}
                            className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmCompletion}
                            disabled={confirming}
                            className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                        >
                            {confirming ? (
                                <>
                                    <Loader className="animate-spin" size={18} />
                                    Confirming...
                                </>
                            ) : (
                                'Confirm Completion'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}