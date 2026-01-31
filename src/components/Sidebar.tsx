import { useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, Activity, DollarSign, TrendingUp } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export default function Sidebar() {
    const navigate = useNavigate();
    const { user, isSidebarOpen, setIsSidebarOpen } = useApp();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/signin');
    };

    return (
        <>
            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-60 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 h-screen w-64 bg-slate-900 border-r border-slate-800 z-65 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="h-full flex flex-col">
                    {/* Sidebar Header */}
                    <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
                        <span className="text-xl font-bold text-white">Menu</span>
                    </div>

                    {/* Sidebar Content */}
                    <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                        {/* Profile Section */}
                        <div className="pb-6 border-b border-slate-800">
                            <button
                                onClick={() => {
                                    navigate('/profile');
                                    setIsSidebarOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition"
                            >
                                <UserIcon size={16} />
                                <span>View Profile</span>
                            </button>
                        </div>

                        {/* Menu */}
                        <div>
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Navigation</h3>
                            <nav className="space-y-2">
                                <button
                                    onClick={() => {
                                        navigate('/dashboard');
                                        setIsSidebarOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-white bg-emerald-500/10 border border-emerald-500/20 rounded-lg font-medium transition"
                                >
                                    <Activity size={20} />
                                    <span>Dashboard</span>
                                </button>
                                <button
                                    onClick={() => {
                                        navigate('/stocks');
                                        setIsSidebarOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition"
                                >
                                    <TrendingUp size={20} />
                                    <span>All Stocks</span>
                                </button>
                                <button
                                    onClick={() => {
                                        navigate('/portfolio');
                                        setIsSidebarOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition"
                                >
                                    <DollarSign size={20} />
                                    <span>Portfolio</span>
                                </button>
                            </nav>
                        </div>

                        {/* Logout */}
                        <div className="pt-6 border-t border-slate-800">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                            >
                                <LogOut size={20} />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}