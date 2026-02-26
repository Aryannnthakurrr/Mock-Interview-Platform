import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { Mail, Lock, Eye, EyeOff, Flame, ArrowRight } from 'lucide-react';

export default function Login() {
    const { login } = useAuthStore();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email || !password) return setError('Please fill all fields');
        login(email, password);
        navigate('/dashboard');
    };

    const inputClass = 'w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all bg-black-200 text-white-50 placeholder-blue-50/40 border border-blue-100/10 focus:border-blue-50/30';

    return (
        <div className="min-h-screen flex items-center justify-center px-6 py-24">
            <div className="vignette" />
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-md relative z-10">
                <div className="glass-card p-8 md:p-10">
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-black-200 flex items-center justify-center mx-auto mb-4">
                            <Flame className="w-7 h-7 text-blue-50" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2 text-white-50">Welcome Back</h1>
                        <p className="text-sm text-blue-50/60">Sign in to continue your journey</p>
                    </div>

                    {error && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-blue-50">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-50/40" />
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-blue-50">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-50/40" />
                                <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                                    className={`${inputClass} !pr-12`} />
                                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-50/40 hover:text-blue-50">
                                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" className="glow-btn w-full !py-3 flex items-center justify-center gap-2">
                            Sign In <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-blue-50/50">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-white-50 hover:underline font-medium">Sign Up</Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
