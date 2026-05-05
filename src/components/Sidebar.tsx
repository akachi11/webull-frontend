import { useNavigate, useLocation } from 'react-router-dom';
import {
    LogOut, Activity, DollarSign, TrendingUp,
    X, ChevronRight, Wallet, ArrowLeftRight, User
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isSidebarOpen, setIsSidebarOpen } = useApp();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/signin');
    };

    const go = (path: string) => {
        navigate(path);
        setIsSidebarOpen(false);
    };

    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

    // Mask email: ogo***@****.com
    const maskedEmail = (() => {
        const email = user?.email ?? '';
        const [local, domain] = email.split('@');
        if (!local || !domain) return email || 'user@example.com';
        const visibleLocal = local.slice(0, 3);
        const [domainName, ...tld] = domain.split('.');
        return `${visibleLocal}***@${'*'.repeat(Math.min(domainName.length, 4))}.${tld.join('.')}`;
    })();

    const navItems = [
        { label: 'Dashboard', path: '/dashboard', icon: <Activity size={20} /> },
        { label: 'All Stocks', path: '/stocks', icon: <TrendingUp size={20} /> },
        { label: 'Portfolio', path: '/portfolio', icon: <DollarSign size={20} /> },
        { label: 'Deposit', path: '/deposit', icon: <Wallet size={20} /> },
        { label: 'Convert', path: '/convert', icon: <ArrowLeftRight size={20} /> },
    ];

    const quickCards = [
        { label: 'Profile', sub: 'View & edit', icon: <User size={22} />, onClick: () => go('/profile') },
        { label: 'Deposit', sub: 'Add funds', icon: <Wallet size={22} />, onClick: () => go('/deposit') },
        { label: 'P2P Trading', sub: 'Trade now', icon: <ArrowLeftRight size={22} />, onClick: () => go('/p2p') },
    ];

    return (
        <>
            {/* Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar panel */}
            <aside
                className={`
                    fixed top-0 left-0 z-[65]
                    h-screen
                    w-full lg:w-[320px]
                    bg-[#0f1117]
                    flex flex-col
                    transform transition-transform duration-300 ease-in-out
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                {/* ── Top bar ── */}
                <div className="flex items-center justify-between px-5 pt-12 pb-5">
                    <span className="text-white font-bold text-lg">My Account</span>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-6">

                    {/* ── Profile card ── */}
                    <button
                        onClick={() => go('/profile')}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800 transition group"
                    >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xl font-bold">
                                {(user?.firstName?.[0] ?? 'U').toUpperCase()}
                            </div>
                            {/* Verified tick */}
                            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#0f1117] flex items-center justify-center">
                                <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-left min-w-0">
                            <p className="text-white font-semibold text-base truncate">
                                {user?.firstName} {user?.lastName}
                            </p>
                            <p className="text-slate-400 text-xs truncate mt-0.5">{maskedEmail}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Verified
                                </span>
                                <span className="text-[10px] text-slate-500 bg-slate-700/60 border border-slate-700 px-2 py-0.5 rounded-full">
                                    Standard
                                </span>
                            </div>
                        </div>

                        <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition shrink-0" />
                    </button>

                    {/* ── Quick action cards 2×2 grid ── */}
                    <div>
                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">Quick Actions</p>
                        <div className="grid grid-cols-2 gap-3">
                            {quickCards.map(card => (
                                <button
                                    key={card.label}
                                    onClick={card.onClick}
                                    className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition group text-left"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-slate-700/60 group-hover:bg-emerald-500/20 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 transition shrink-0">
                                        {card.icon}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-white text-sm font-semibold leading-none">{card.label}</p>
                                        <p className="text-slate-500 text-[11px] mt-0.5">{card.sub}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Navigation ── */}
                    <div>
                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">Navigation</p>
                        <div className="space-y-1">
                            {navItems.map(item => {
                                const active = isActive(item.path);
                                return (
                                    <button
                                        key={item.label}
                                        onClick={() => go(item.path)}
                                        className={`
                                            w-full flex items-center justify-between px-4 py-3 rounded-xl transition
                                            ${active
                                                ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-400'
                                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={active ? 'text-emerald-400' : ''}>{item.icon}</span>
                                            <span className={`font-medium text-sm ${active ? 'text-emerald-400' : ''}`}>
                                                {item.label}
                                            </span>
                                        </div>
                                        {active && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                </div>

                {/* ── Footer: Logout ── */}
                <div className="px-5 py-5 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition"
                    >
                        <LogOut size={20} />
                        <span className="font-medium text-sm">Log Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
}