import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Menu, X, Bell } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import logo from '../assets/logo.png';
import NotificationPanel from './NotificationPanel';
import Sidebar from './Sidebar';

export default function Navbar() {
    const navigate = useNavigate();
    const { user, isSidebarOpen, setIsSidebarOpen, isNotificationOpen, setIsNotificationOpen, unreadCount } = useApp();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/trade/${searchQuery.toUpperCase()}`);
            setSearchQuery('');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/signin');
    };

    return (
        <>
            {/* Top Navigation */}
            <nav className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                    className="lg:hidden text-slate-400 hover:text-white transition"
                                >
                                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                                </button>
                                <div className="w-15 h-15 rounded-lg flex items-center justify-center cursor-pointer" onClick={() => navigate('/dashboard')}>
                                    <img src={logo} alt="TradeHub" />
                                </div>
                                <span className="text-xl font-bold text-white hidden sm:block">TradeHub</span>
                            </div>

                            <div className="hidden md:block">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search stocks..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        className="w-64 pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* User Info - VISIBLE */}
                            <div className="flex flex-col items-end pr-3 border-r border-slate-700">
                                <p className="text-sm font-medium text-white whitespace-nowrap">{user?.firstName} {user?.lastName}</p>
                                <p className="text-xs text-slate-400 whitespace-nowrap">Premium Account</p>
                            </div>

                            {/* Notifications */}
                            <button
                                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                className="p-2 text-slate-400 hover:text-white transition relative"
                            >
                                <Bell size={20} fill={unreadCount > 0 ? "currentColor" : "none"} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center font-semibold">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Search */}
                <div className="md:hidden px-4 pb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search stocks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        />
                    </div>
                </div>
            </nav>

            {/* Sidebar */}
            <Sidebar />

            {/* Notification Panel */}
            <NotificationPanel />
        </>
    );
}