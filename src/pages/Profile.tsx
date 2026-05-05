import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Mail, Calendar, Shield, Edit2, Save, X,
    Camera, DollarSign, ChevronRight, ArrowLeft, Eye, EyeOff
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { API_BASE_URL } from '../utils';

interface UserData {
    firstName: string;
    lastName: string;
    email: string;
    balance: number;
    isVerified: boolean;
    createdAt?: string;
}

type TabKey = 'info' | 'security';

export default function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState<UserData | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>('info');
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '' });
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) { navigate('/signin'); return; }

            const response = await fetch(`${API_BASE_URL}/user/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/signin');
                return;
            }

            if (!response.ok) throw new Error('Failed to fetch user data');

            const data: UserData = await response.json();
            setUser(data);
            setEditForm({ firstName: data.firstName, lastName: data.lastName, email: data.email });
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/user/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token ?? ''}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editForm)
            });

            if (!response.ok) throw new Error('Failed to update profile');

            const data: UserData = await response.json();
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (user) {
            setEditForm({ firstName: user.firstName, lastName: user.lastName, email: user.email });
        }
        setIsEditing(false);
    };

    const handleChangePassword = async () => {
        setPasswordError('');
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            setPasswordError('All fields are required.');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('New passwords do not match.');
            return;
        }
        if (passwordForm.newPassword.length < 8) {
            setPasswordError('New password must be at least 8 characters.');
            return;
        }
        setIsChangingPassword(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/user/change-password`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token ?? ''}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword
                })
            });
            if (response.status === 401) {
                setPasswordError('Current password is incorrect.');
                return;
            }
            if (!response.ok) throw new Error('Failed to change password');
            setPasswordSuccess(true);
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setPasswordSuccess(false), 3000);
        } catch (error) {
            console.error('Error changing password:', error);
            setPasswordError('Something went wrong. Please try again.');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const formatCurrency = (value: number): string =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);

    const formatDate = (dateString?: string): string => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <main className="lg:pl-64 p-6">
                    <div className="max-w-lg mx-auto animate-pulse space-y-4 pt-8">
                        <div className="h-20 bg-slate-800 rounded-2xl" />
                        <div className="h-96 bg-slate-800 rounded-2xl" />
                    </div>
                </main>
            </div>
        );
    }

    const tabs: { key: TabKey; label: string }[] = [
        { key: 'info', label: 'My Info' },
        { key: 'security', label: 'Security' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            <Navbar />

            <main className="lg:pl-64">
                <div className="max-w-lg mx-auto px-4 pb-16">

                    {/* Top Bar */}
                    <div className="flex items-center justify-between py-5">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 -ml-2 text-white hover:text-slate-400 transition"
                        >
                            <ArrowLeft size={22} />
                        </button>
                        <h1 className="text-lg font-semibold">User Center</h1>
                        <div className="w-8" />
                    </div>

                    {/* Profile Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center flex-shrink-0 group cursor-pointer overflow-hidden">
                            <User size={28} className="text-emerald-400" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                <Camera size={18} className="text-white" />
                            </div>
                        </div>
                        <div>
                            <p className="text-lg font-bold">{user?.firstName} {user?.lastName}</p>
                            <p className="text-slate-400 text-sm">{user?.email}</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-slate-700 mb-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 py-3 text-sm font-medium transition relative ${activeTab === tab.key ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                {tab.label}
                                {activeTab === tab.key && (
                                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-emerald-500 rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* My Info Tab */}
                    {activeTab === 'info' && (
                        <div className="mt-1">
                            {isEditing && (
                                <div className="flex gap-2 py-3">
                                    <button
                                        onClick={handleCancel}
                                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition"
                                    >
                                        <X size={15} /> Cancel
                                    </button>
                                    <button
                                        onClick={() => void handleSave()}
                                        disabled={isSaving}
                                        className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
                                    >
                                        <Save size={15} /> {isSaving ? 'Saving…' : 'Save Changes'}
                                    </button>
                                </div>
                            )}

                            <div className="divide-y divide-slate-800">

                                {/* First Name */}
                                <div className="flex items-center justify-between py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center">
                                            <User size={16} className="text-emerald-400" />
                                        </div>
                                        <span className="text-sm text-slate-300">First Name</span>
                                    </div>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editForm.firstName}
                                            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                            className="w-40 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm text-right focus:outline-none focus:border-emerald-500 transition"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-slate-400">{user?.firstName}</span>
                                            <ChevronRight size={16} className="text-slate-600" />
                                        </div>
                                    )}
                                </div>

                                {/* Last Name */}
                                <div className="flex items-center justify-between py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center">
                                            <User size={16} className="text-emerald-400" />
                                        </div>
                                        <span className="text-sm text-slate-300">Last Name</span>
                                    </div>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editForm.lastName}
                                            onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                            className="w-40 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm text-right focus:outline-none focus:border-emerald-500 transition"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-slate-400">{user?.lastName}</span>
                                            <ChevronRight size={16} className="text-slate-600" />
                                        </div>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="flex items-center justify-between py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center">
                                            <Mail size={16} className="text-emerald-400" />
                                        </div>
                                        <span className="text-sm text-slate-300">Email</span>
                                    </div>
                                    {isEditing ? (
                                        <input
                                            type="email"
                                            value={editForm.email}
                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                            className="w-48 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm text-right focus:outline-none focus:border-emerald-500 transition"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-slate-400">{user?.email}</span>
                                            <ChevronRight size={16} className="text-slate-600" />
                                        </div>
                                    )}
                                </div>

                                {/* Balance */}
                                <div className="flex items-center justify-between py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center">
                                            <DollarSign size={16} className="text-emerald-400" />
                                        </div>
                                        <span className="text-sm text-slate-300">Account Balance</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-slate-400 font-medium">{formatCurrency(user?.balance ?? 0)}</span>
                                        <ChevronRight size={16} className="text-slate-600" />
                                    </div>
                                </div>

                                {/* Verification */}
                                <div className="flex items-center justify-between py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center">
                                            <Shield size={16} className="text-emerald-400" />
                                        </div>
                                        <span className="text-sm text-slate-300">Verification Status</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${user?.isVerified === true
                                            ? 'bg-emerald-500/20 text-emerald-400'
                                            : 'bg-amber-500/20 text-amber-400'
                                            }`}>
                                            {user?.isVerified === true ? 'Verified' : 'Unverified'}
                                        </span>
                                        <ChevronRight size={16} className="text-slate-600" />
                                    </div>
                                </div>

                                {/* Member Since */}
                                <div className="flex items-center justify-between py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center">
                                            <Calendar size={16} className="text-emerald-400" />
                                        </div>
                                        <span className="text-sm text-slate-300">Member Since</span>
                                    </div>
                                    <span className="text-sm text-slate-400">{formatDate(user?.createdAt)}</span>
                                </div>

                            </div>

                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="mt-6 w-full py-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm font-semibold rounded-2xl flex items-center justify-center gap-2 transition"
                                >
                                    <Edit2 size={16} />
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div className="mt-1 divide-y divide-slate-800">

                            {/* Row */}
                            <button
                                type="button"
                                onClick={() => {
                                    (document.activeElement as HTMLElement)?.blur();
                                    setShowPasswordForm(!showPasswordForm);
                                    setPasswordError('');
                                    setPasswordSuccess(false);
                                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                }}
                                className="w-full flex items-center justify-between py-4 group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center">
                                        <Shield size={16} className="text-emerald-400" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-white group-hover:text-emerald-400 transition">Change Password</p>
                                        <p className="text-xs text-slate-500">Update your account password</p>
                                    </div>
                                </div>
                                <ChevronRight
                                    size={16}
                                    className={`text-slate-600 group-hover:text-emerald-400 transition-transform duration-200 ${showPasswordForm ? 'rotate-90' : ''}`}
                                />
                            </button>

                            {/* Form */}
                            {showPasswordForm && (
                                <div className="py-4 space-y-4">

                                    {/* Current Password */}
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1.5">Current Password</label>
                                        <div className="relative">
                                            <input type="text" name="fake-username" style={{ display: 'none' }} />
                                            <input
                                                type={showPasswords.current ? 'text' : 'password'}
                                                value={passwordForm.currentPassword}
                                                autoComplete="new-password"
                                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                                placeholder="Enter current password"
                                                className="w-full px-4 py-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition placeholder:text-slate-600"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                                            >
                                                {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* New Password */}
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1.5">New Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.new ? 'text' : 'password'}
                                                value={passwordForm.newPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                placeholder="Enter new password"
                                                className="w-full px-4 py-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition placeholder:text-slate-600"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                                            >
                                                {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm Password */}
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1.5">Confirm New Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.confirm ? 'text' : 'password'}
                                                value={passwordForm.confirmPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                placeholder="Confirm new password"
                                                className="w-full px-4 py-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition placeholder:text-slate-600"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                                            >
                                                {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Error */}
                                    {passwordError !== '' && (
                                        <p className="text-xs text-red-400 flex items-center gap-1.5">
                                            <X size={13} /> {passwordError}
                                        </p>
                                    )}

                                    {/* Success */}
                                    {passwordSuccess && (
                                        <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                                            <Shield size={13} /> Password updated successfully.
                                        </p>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-1">
                                        <button
                                            onClick={() => { setShowPasswordForm(false); setPasswordError(''); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}
                                            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition"
                                        >
                                            <X size={15} /> Cancel
                                        </button>
                                        <button
                                            onClick={() => void handleChangePassword()}
                                            disabled={isChangingPassword}
                                            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
                                        >
                                            <Save size={15} /> {isChangingPassword ? 'Updating…' : 'Update'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}