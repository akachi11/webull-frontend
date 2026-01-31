import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, Shield, Edit2, Save, X, Camera, DollarSign } from 'lucide-react';
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

export default function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState<UserData | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        email: ''
    });

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/signin');
                return;
            }

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

            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }

            const data = await response.json();
            setUser(data);
            setEditForm({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email
            });
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        if (user) {
            setEditForm({
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            });
        }
        setIsEditing(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/user/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editForm)
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            const data = await response.json();
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value);
    };

    const formatDate = (dateString?: string): string => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <Navbar />
                <main className="lg:pl-64 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="animate-pulse space-y-6">
                            <div className="h-48 bg-slate-800 rounded-2xl"></div>
                            <div className="h-96 bg-slate-800 rounded-2xl"></div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <Navbar />

            <main className="lg:pl-64 p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header Card */}
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-white relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                        </div>

                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30 relative group cursor-pointer">
                                    <User size={40} className="text-white" />
                                    <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                        <Camera size={24} className="text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold mb-1">
                                        {user?.firstName} {user?.lastName}
                                    </h1>
                                    <p className="text-emerald-100 flex items-center gap-2">
                                        <Mail size={16} />
                                        {user?.email}
                                    </p>
                                </div>
                            </div>

                            {!isEditing && (
                                <button
                                    onClick={handleEdit}
                                    className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-xl font-semibold transition flex items-center gap-2"
                                >
                                    <Edit2 size={18} />
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Account Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <DollarSign size={20} className="text-emerald-400" />
                                </div>
                                <p className="text-slate-400 text-sm">Account Balance</p>
                            </div>
                            <p className="text-2xl font-bold text-white">{formatCurrency(user?.balance || 0)}</p>
                        </div>

                        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <Shield size={20} className="text-emerald-400" />
                                </div>
                                <p className="text-slate-400 text-sm">Verification Status</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${user?.isVerified
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-amber-500/20 text-amber-400'
                                    }`}>
                                    {user?.isVerified ? 'Verified' : 'Unverified'}
                                </span>
                            </div>
                        </div>

                        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <Calendar size={20} className="text-emerald-400" />
                                </div>
                                <p className="text-slate-400 text-sm">Member Since</p>
                            </div>
                            <p className="text-lg font-semibold text-white">{formatDate(user?.createdAt)}</p>
                        </div>
                    </div>

                    {/* Profile Details */}
                    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Profile Information</h3>
                            {isEditing && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleCancel}
                                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition flex items-center gap-2"
                                    >
                                        <X size={18} />
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <Save size={18} />
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-slate-400 text-sm font-medium mb-2">
                                        First Name
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editForm.firstName}
                                            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition"
                                        />
                                    ) : (
                                        <div className="px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white">
                                            {user?.firstName}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-slate-400 text-sm font-medium mb-2">
                                        Last Name
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editForm.lastName}
                                            onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition"
                                        />
                                    ) : (
                                        <div className="px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white">
                                            {user?.lastName}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 text-sm font-medium mb-2">
                                    Email Address
                                </label>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition"
                                    />
                                ) : (
                                    <div className="px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white">
                                        {user?.email}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Security Section */}
                    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-white mb-6">Security</h3>
                        <div className="space-y-4">
                            <button className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl transition group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                                        <Shield size={24} className="text-white" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-white font-semibold group-hover:text-emerald-400 transition">Change Password</p>
                                        <p className="text-slate-400 text-sm">Update your account password</p>
                                    </div>
                                </div>
                                <div className="text-slate-400 group-hover:text-emerald-400 transition">→</div>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}