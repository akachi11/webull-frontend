import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface Notification {
    _id: string;
    type: 'STOCK_BUY' | 'STOCK_SELL' | 'P2P_TRADE_INITIATED' | 'P2P_TRADE_ACCEPTED' | 'P2P_TRADE_COMPLETED' | 'P2P_TRADE_CANCELLED';
    title: string;
    message: string;
    transactionId?: string;
    p2pTradeId?: string;
    offerId?: string;
    stockSymbol?: string;
    quantity?: number;
    amount?: number;
    isRead: boolean;
    createdAt: string;
}

interface User {
    firstName: string;
    lastName: string;
    email: string;
}

interface AppContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
    isNotificationOpen: boolean;
    setIsNotificationOpen: (open: boolean) => void;
    notifications: Notification[];
    unreadCount: number;
    isLoadingNotifications: boolean;
    fetchNotifications: () => Promise<void>;
    fetchUnreadCount: () => Promise<void>;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (notificationId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const API_BASE_URL = 'http://localhost:5000/api';

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
            fetchUnreadCount();
        }
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            setIsLoadingNotifications(true);
            setUnreadCount(0); // Immediately zero out the badge

            const response = await fetch(`${API_BASE_URL}/notifications?page=1&limit=20`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);

                // Mark all unread notifications as read
                const unreadIds = data.notifications
                    .filter((n: Notification) => !n.isRead)
                    .map((n: Notification) => n._id);

                if (unreadIds.length > 0) {
                    // Mark them as read in the background
                    fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}` }
                    }).catch(err => console.error('Error marking as read:', err));
                }
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoadingNotifications(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Optimistically update UI
            setNotifications(prev =>
                prev.map(notif =>
                    notif._id === notificationId ? { ...notif, isRead: true } : notif
                )
            );

            const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                await fetchUnreadCount();
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Optimistically update UI
            setNotifications(prev =>
                prev.map(notif => ({ ...notif, isRead: true }))
            );
            setUnreadCount(0);

            const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                // Revert on failure
                await fetchNotifications();
                await fetchUnreadCount();
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
            // Revert on failure
            await fetchNotifications();
            await fetchUnreadCount();
        }
    };

    const deleteNotification = async (notificationId: string) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const deletedNotif = notifications.find(n => n._id === notificationId);

            // Optimistically update UI
            setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
            if (deletedNotif && !deletedNotif.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }

            const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                // Revert on failure
                await fetchNotifications();
                await fetchUnreadCount();
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
            // Revert on failure
            await fetchNotifications();
            await fetchUnreadCount();
        }
    };

    return (
        <AppContext.Provider
            value={{
                user,
                setUser,
                isSidebarOpen,
                setIsSidebarOpen,
                isNotificationOpen,
                setIsNotificationOpen,
                notifications,
                unreadCount,
                isLoadingNotifications,
                fetchNotifications,
                fetchUnreadCount,
                markAsRead,
                markAllAsRead,
                deleteNotification
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
};