import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Menu, X, LogOut, Flame } from 'lucide-react';

const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/learning', label: 'Learning' },
    { to: '/chat', label: 'AI Buddy' },
    { to: '/interview', label: 'Interview' },
    { to: '/resume', label: 'Resume' },
];

export default function Navbar() {
    const { isAuthenticated, user, logout } = useAuthStore();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 left-0 right-0 z-50"
        >
            <div
                className={`mx-4 mt-4 rounded-2xl px-6 py-3 flex items-center justify-between transition-all duration-500 ${scrolled
                    ? 'bg-black-100/90 backdrop-blur-xl border border-blue-100/30 shadow-lg shadow-black/30'
                    : 'bg-transparent border border-transparent'
                    }`}
            >
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="w-9 h-9 rounded-xl bg-black-200 flex items-center justify-center group-hover:bg-blue-100 transition-all duration-300">
                        <Flame className="w-5 h-5 text-white-50" />
                    </div>
                    <span className="font-bold text-lg text-white-50 hidden sm:inline">
                        MockMind
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-1">
                    {navLinks.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${location.pathname === link.to
                                ? 'text-white'
                                : 'text-blue-50 hover:text-white-50'
                                }`}
                        >
                            {location.pathname === link.to && (
                                <motion.div
                                    layoutId="nav-active"
                                    className="absolute inset-0 bg-black-200 rounded-xl border border-blue-100/20"
                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                />
                            )}
                            <span className="relative z-10">{link.label}</span>
                        </Link>
                    ))}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    {isAuthenticated ? (
                        <div className="hidden md:flex items-center gap-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black-200">
                                <img src={user?.avatar} alt={user?.name} className="w-6 h-6 rounded-full" />
                                <span className="text-sm font-medium text-blue-50">{user?.name}</span>
                            </div>
                            <button onClick={handleLogout} className="p-2 rounded-xl text-blue-50 hover:bg-black-200 hover:text-red-400 transition-all">
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <Link to="/login" className="hidden md:inline-flex glow-btn !py-2 !px-5 !text-sm !rounded-xl">
                            Login
                        </Link>
                    )}

                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden p-2 rounded-xl text-blue-50 hover:text-white-50 transition-colors"
                    >
                        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="mx-4 mt-2 rounded-2xl p-4 md:hidden bg-black-100/95 border border-blue-100/20 backdrop-blur-xl"
                    >
                        {navLinks.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => setMobileOpen(false)}
                                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all ${location.pathname === link.to
                                    ? 'bg-black-200 text-white-50'
                                    : 'text-blue-50 hover:text-white-50 hover:bg-black-200/50'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        {!isAuthenticated && (
                            <Link to="/login" onClick={() => setMobileOpen(false)} className="block mt-2 text-center glow-btn !text-sm">
                                Login
                            </Link>
                        )}
                        {isAuthenticated && (
                            <button onClick={() => { handleLogout(); setMobileOpen(false); }}
                                className="block w-full mt-2 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-black-200/50">
                                Logout
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}
