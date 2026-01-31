// src/pages/SignIn.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../utils';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function SignIn() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState<{ email?: string; password?: string; api?: string }>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const validateField = (name: string, value: string): string | undefined => {
        switch (name) {
            case 'email':
                if (!value.trim()) return 'Email is required';
                if (!EMAIL_REGEX.test(value)) return 'Please enter a valid email address';
                break;
            case 'password':
                if (!value) return 'Password is required';
                break;
        }
        return undefined;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (touched[name]) {
            const error = validateField(name, value);
            setErrors(prev => ({ ...prev, [name]: error, api: undefined }));
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleSubmit = async () => {
        const emailError = validateField('email', formData.email);
        const passwordError = validateField('password', formData.password);

        if (emailError || passwordError) {
            setErrors({ email: emailError, password: passwordError });
            setTouched({ email: true, password: true });
            return;
        }

        setIsLoading(true);
        setErrors(prev => ({ ...prev, api: undefined }));

        try {
            const response = await fetch(`${API_BASE_URL}/auth/signin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email.toLowerCase().trim(),
                    password: formData.password,
                    rememberMe
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to sign in');
            }

            // Store token
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            navigate('/dashboard');
        } catch (error) {
            setErrors(prev => ({
                ...prev,
                api: error instanceof Error ? error.message : 'An error occurred. Please try again.'
            }));
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex">
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <div className="mb-8">
                        <div className="w-12 h-12 bg-emerald-500 rounded-lg mb-4"></div>
                        <h1 className="text-4xl font-bold text-white mb-2">Welcome Back</h1>
                        <p className="text-slate-400">Sign in to continue trading</p>
                    </div>

                    {errors.api && (
                        <div className="mb-5 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                            <p className="text-red-400 text-sm">{errors.api}</p>
                        </div>
                    )}

                    <div className="space-y-5" onKeyPress={handleKeyPress}>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={isLoading}
                                autoComplete="email"
                                className={`w-full px-4 py-3 bg-slate-800/50 border ${errors.email && touched.email ? 'border-red-500' : 'border-slate-700'
                                    } rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed`}
                                placeholder="you@example.com"
                            />
                            {errors.email && touched.email && (
                                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-slate-300">
                                    Password
                                </label>
                                <a href="/forgot-password" className="text-sm text-emerald-500 hover:text-emerald-400">
                                    Forgot password?
                                </a>
                            </div>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={isLoading}
                                autoComplete="current-password"
                                className={`w-full px-4 py-3 bg-slate-800/50 border ${errors.password && touched.password ? 'border-red-500' : 'border-slate-700'
                                    } rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed`}
                                placeholder="••••••••"
                            />
                            {errors.password && touched.password && (
                                <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                            )}
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="remember"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                disabled={isLoading}
                                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <label htmlFor="remember" className="ml-3 text-sm text-slate-400">
                                Remember me for 30 days
                            </label>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition duration-200 shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-500 flex items-center justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing In...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </div>

                    <p className="mt-6 text-center text-slate-400 text-sm">
                        Don't have an account?{' '}
                        <a href="/signup" className="text-emerald-500 hover:text-emerald-400 font-medium">
                            Sign up
                        </a>
                    </p>

                    <div className="mt-8 pt-8 border-t border-slate-800">
                        <p className="text-xs text-slate-500 text-center mb-4">Trusted by over 2M investors</p>
                        <div className="flex justify-center gap-6 opacity-40">
                            <div className="w-20 h-8 bg-slate-700 rounded"></div>
                            <div className="w-20 h-8 bg-slate-700 rounded"></div>
                            <div className="w-20 h-8 bg-slate-700 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-emerald-500 to-teal-600 items-center justify-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 text-white max-w-lg">
                    <div className="w-full h-96 bg-white/10 backdrop-blur-sm rounded-2xl mb-8 flex items-center justify-center border border-white/20">
                        <span className="text-white/60">Your Hero Image Here</span>
                    </div>

                    <h2 className="text-3xl font-bold mb-4">Your Portfolio Awaits</h2>
                    <p className="text-emerald-50 text-lg mb-6">
                        Pick up right where you left off. Monitor your investments and execute trades with ease.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <span className="text-emerald-50">Real-time market updates</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <span className="text-emerald-50">Instant trade execution</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <span className="text-emerald-50">Portfolio analytics</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}