import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from "../assets/logo.png"
import { sendVerificationEmail } from '../utils/sendVerificationEmail';
import { API_BASE_URL } from '../utils';

interface FormData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
}

interface FormErrors {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    api?: string;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PASSWORD_MIN_LENGTH = 8;

export default function SignUp() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<FormData>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    const validateField = (name: keyof FormData, value: string): string | undefined => {
        switch (name) {
            case 'firstName':
                if (!value.trim()) return 'First name is required';
                if (value.trim().length < 2) return 'First name must be at least 2 characters';
                break;
            case 'lastName':
                if (!value.trim()) return 'Last name is required';
                if (value.trim().length < 2) return 'Last name must be at least 2 characters';
                break;
            case 'email':
                if (!value.trim()) return 'Email is required';
                if (!EMAIL_REGEX.test(value)) return 'Please enter a valid email address';
                break;
            case 'password':
                if (!value) return 'Password is required';
                if (value.length < PASSWORD_MIN_LENGTH) return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
                if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
                if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter';
                if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
                break;
            case 'confirmPassword':
                if (!value) return 'Please confirm your password';
                if (value !== formData.password) return 'Passwords do not match';
                break;
        }
        return undefined;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (touched[name]) {
            const error = validateField(name as keyof FormData, value);
            setErrors(prev => ({ ...prev, [name]: error, api: undefined }));
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        const error = validateField(name as keyof FormData, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        let isValid = true;

        (Object.keys(formData) as Array<keyof FormData>).forEach(key => {
            const error = validateField(key, formData[key]);
            if (error) {
                newErrors[key] = error;
                isValid = false;
            }
        });

        if (!termsAccepted) {
            newErrors.api = 'You must accept the Terms of Service and Privacy Policy';
            isValid = false;
        }

        setErrors(newErrors);
        setTouched({
            firstName: true,
            lastName: true,
            email: true,
            password: true,
            confirmPassword: true
        });

        return isValid;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        setErrors(prev => ({ ...prev, api: undefined }));

        try {
            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: formData.firstName.trim(),
                    lastName: formData.lastName.trim(),
                    email: formData.email.toLowerCase().trim(),
                    password: formData.password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create account');
            } else {
                sendVerificationEmail(data.email, data.verificationCode, data.firstName)
            }

            navigate('/verify-email', { state: { email: formData.email } });
        } catch (error) {
            setErrors(prev => ({
                ...prev,
                api: error instanceof Error ? error.message : 'An error occurred. Please try again.'
            }));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex">
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <div className="mb-8">
                        <div className="w-24 h-24 rounded-lg mb-4">
                            <img src={logo} className='h-full w-full object-contain' alt="" />
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-2">Start Trading Today</h1>
                        <p className="text-slate-400">Create your account in minutes</p>
                    </div>

                    {errors.api && (
                        <div className="mb-5 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                            <p className="text-red-400 text-sm">{errors.api}</p>
                        </div>
                    )}

                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    disabled={isLoading}
                                    className={`w-full px-4 py-3 bg-slate-800/50 border ${errors.firstName && touched.firstName ? 'border-red-500' : 'border-slate-700'
                                        } rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed`}
                                    placeholder="John"
                                />
                                {errors.firstName && touched.firstName && (
                                    <p className="mt-1 text-sm text-red-400">{errors.firstName}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    disabled={isLoading}
                                    className={`w-full px-4 py-3 bg-slate-800/50 border ${errors.lastName && touched.lastName ? 'border-red-500' : 'border-slate-700'
                                        } rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed`}
                                    placeholder="Doe"
                                />
                                {errors.lastName && touched.lastName && (
                                    <p className="mt-1 text-sm text-red-400">{errors.lastName}</p>
                                )}
                            </div>
                        </div>

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
                                className={`w-full px-4 py-3 bg-slate-800/50 border ${errors.email && touched.email ? 'border-red-500' : 'border-slate-700'
                                    } rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed`}
                                placeholder="you@example.com"
                            />
                            {errors.email && touched.email && (
                                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={isLoading}
                                className={`w-full px-4 py-3 bg-slate-800/50 border ${errors.password && touched.password ? 'border-red-500' : 'border-slate-700'
                                    } rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed`}
                                placeholder="••••••••"
                            />
                            {errors.password && touched.password && (
                                <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={isLoading}
                                className={`w-full px-4 py-3 bg-slate-800/50 border ${errors.confirmPassword && touched.confirmPassword ? 'border-red-500' : 'border-slate-700'
                                    } rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed`}
                                placeholder="••••••••"
                            />
                            {errors.confirmPassword && touched.confirmPassword && (
                                <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
                            )}
                        </div>

                        <div className="flex items-start">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                disabled={isLoading}
                                className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <label htmlFor="terms" className="ml-3 text-sm text-slate-400">
                                I agree to the{' '}
                                <a href="#" className="text-emerald-500 hover:text-emerald-400">
                                    Terms of Service
                                </a>{' '}
                                and{' '}
                                <a href="#" className="text-emerald-500 hover:text-emerald-400">
                                    Privacy Policy
                                </a>
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
                                    Creating Account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </div>

                    <p className="mt-6 text-center text-slate-400 text-sm">
                        Already have an account?{' '}
                        <a href="/signin" className="text-emerald-500 hover:text-emerald-400 font-medium">
                            Sign in
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
                        <img className='h-full w-full object-contain' src="https://img.capital.com/imgs/lp/976x848x1/704x641-2_CC_LP-BANNER_NEW-MAIN-BLOCK_STOCKS_PHONE_1_MCT-7987_EN_0.png" alt="" />
                    </div>

                    <h2 className="text-3xl font-bold mb-4">Trade with Confidence</h2>
                    <p className="text-emerald-50 text-lg mb-6">
                        Access real-time market data, advanced charting tools, and expert insights all in one platform.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <span className="text-emerald-50">Commission-free trading</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <span className="text-emerald-50">Advanced security features</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <span className="text-emerald-50">24/7 customer support</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}