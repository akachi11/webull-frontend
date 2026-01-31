import { useNavigate } from 'react-router-dom';
import { X, Check, Trash2, TrendingUp, TrendingDown, ArrowLeftRight, Clock, Bell } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useEffect } from 'react';

export default function NotificationPanel() {
    const navigate = useNavigate();
    const {
        isNotificationOpen,
        setIsNotificationOpen,
        notifications,
        isLoadingNotifications,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification
    } = useApp();

    // Fetch notifications every time panel opens
    useEffect(() => {
        if (isNotificationOpen) {
            fetchNotifications();
        }
    }, [isNotificationOpen]);

    const handleNotificationClick = async (notification: any) => {
        // Mark as read
        if (!notification.isRead) {
            await markAsRead(notification._id);
        }

        // Navigate based on type
        setIsNotificationOpen(false);

        switch (notification.type) {
            case 'STOCK_BUY':
            case 'STOCK_SELL':
                navigate('/portfolio');
                break;
            case 'P2P_TRADE_INITIATED':
            case 'P2P_TRADE_ACCEPTED':
            case 'P2P_TRADE_COMPLETED':
            case 'P2P_TRADE_CANCELLED':
                navigate(`/p2p/trade/${notification.p2pTradeId}`);
                break;
        }
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
        // Immediately reflect in UI - context already handles this optimistically
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'STOCK_BUY':
                return <TrendingUp className="text-green-400" size={20} />;
            case 'STOCK_SELL':
                return <TrendingDown className="text-red-400" size={20} />;
            case 'P2P_TRADE_INITIATED':
            case 'P2P_TRADE_ACCEPTED':
            case 'P2P_TRADE_COMPLETED':
            case 'P2P_TRADE_CANCELLED':
                return <ArrowLeftRight className="text-purple-400" size={20} />;
            default:
                return <Clock className="text-slate-400" size={20} />;
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    // Calculate current unread count from notifications
    const currentUnreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <>
            {/* Overlay */}
            {isNotificationOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-60"
                    onClick={() => setIsNotificationOpen(false)}
                />
            )}

            {/* Notification Panel */}
            <div
                className={`fixed top-0 right-0 h-screen w-full sm:w-96 bg-slate-900 border-l border-slate-800 z-65 transform transition-transform duration-300 ${isNotificationOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="p-4 border-b border-slate-800 bg-slate-900">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold text-white">Notifications</h2>
                        <button
                            onClick={() => setIsNotificationOpen(false)}
                            className="p-1 text-slate-400 hover:text-white transition"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {currentUnreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition"
                        >
                            <Check size={16} />
                            <span>Mark all as read ({currentUnreadCount})</span>
                        </button>
                    )}
                </div>

                {/* Notifications List */}
                <div className="overflow-y-auto" style={{ height: 'calc(100vh - 13rem)' }}>
                    {isLoadingNotifications ? (
                        // Skeleton Loaders
                        <div className="divide-y divide-slate-800">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="p-4 animate-pulse">
                                    <div className="flex gap-3">
                                        <div className="w-5 h-5 bg-slate-700 rounded mt-1"></div>
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                                                <div className="w-2 h-2 bg-slate-700 rounded-full"></div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="h-3 bg-slate-700 rounded w-full"></div>
                                                <div className="h-3 bg-slate-700 rounded w-2/3"></div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="h-3 bg-slate-700 rounded w-20"></div>
                                                <div className="h-3 bg-slate-700 rounded w-8"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <Bell className="text-slate-600 mb-4" size={48} />
                            <p className="text-slate-400 text-sm">No notifications yet</p>
                            <p className="text-slate-500 text-xs mt-2">We'll notify you when something happens</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-800">
                            {notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`p-4 hover:bg-slate-800/50 transition cursor-pointer ${!notification.isRead ? 'bg-emerald-500/5' : ''
                                        }`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex gap-3">
                                        <div className="flex-shrink-0 mt-1">
                                            {getNotificationIcon(notification.type)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h3 className="text-sm font-semibold text-white">{notification.title}</h3>
                                                {!notification.isRead && (
                                                    <span className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 mt-1"></span>
                                                )}
                                            </div>

                                            <p className="text-sm text-slate-400 mb-2 line-clamp-2">
                                                {notification.message}
                                            </p>

                                            {notification.stockSymbol && (
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs px-2 py-1 bg-slate-800 text-slate-300 rounded">
                                                        {notification.stockSymbol}
                                                    </span>
                                                    {notification.quantity && (
                                                        <span className="text-xs text-slate-500">
                                                            {notification.quantity} shares
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-slate-500">
                                                    {formatTimeAgo(notification.createdAt)}
                                                </span>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteNotification(notification._id);
                                                    }}
                                                    className="p-1 text-slate-500 hover:text-red-400 transition"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}