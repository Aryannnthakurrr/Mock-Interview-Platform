import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ParticleBackground from '../components/ParticleBackground';
import GlowCard from '../components/ui/GlowCard';
import ScrollReveal from '../components/ScrollReveal';
import Footer from '../components/Footer';
import {
    BookOpen, Bot, Mic, FileText, BarChart3, Shield, ArrowDown, Search,
    Sparkles, Zap, Target, Rocket, ChevronRight, Star,
} from 'lucide-react';

const roles = ['Software Engineer', 'Data Scientist', 'AI Engineer', 'Full Stack Developer', 'Product Manager', 'DevOps Engineer'];

const features = [
    { icon: BookOpen, title: 'Structured Learning', desc: 'DSA, Java, MERN, AI/ML, Data Science with progress tracking and external practice links.', color: 'bg-black-200' },
    { icon: Bot, title: 'AI Study Buddy', desc: 'Doubt solving, career guidance, resume tips, and interview simulation in one chat.', color: 'bg-black-200' },
    { icon: Mic, title: 'Voice Interviews', desc: 'Real-time AI voice interviews powered by Gemini Live with emotion tracking.', color: 'bg-black-200' },
    { icon: FileText, title: 'Resume Analysis', desc: 'Upload your PDF resume, get AI parsing, and start custom interviews.', color: 'bg-black-200' },
    { icon: BarChart3, title: 'Smart Dashboard', desc: 'Interview history, scores, AI feedback, and performance trends.', color: 'bg-black-200' },
    { icon: Shield, title: 'Role-Based Access', desc: 'Student and Admin profiles with personalized dashboards.', color: 'bg-black-200' },
];

const stats = [
    { value: '10+', label: 'Interview Topics' },
    { value: 'AI', label: 'Voice Powered' },
    { value: 'Live', label: 'Emotion Analysis' },
    { value: '∞', label: 'Mock Interviews' },
];

export default function Landing() {
    const [roleIndex, setRoleIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => setRoleIndex((i) => (i + 1) % roles.length), 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative min-h-screen overflow-hidden">
            <ParticleBackground />
            <div className="vignette" />

            {/* Hero */}
            <section className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-24">
                <div className="max-w-5xl mx-auto text-center">


                    <ScrollReveal delay={0.1}>
                        <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-tight mb-6">
                            <span className="text-white-50">Forge Your</span><br />
                            <span className="gradient-text">Career Path</span>
                        </h1>
                    </ScrollReveal>

                    <ScrollReveal delay={0.2}>
                        <div className="h-12 mb-8 flex items-center justify-center">
                            <span className="text-xl text-blue-50">Become a </span>
                            <AnimatePresence mode="wait">
                                <motion.span key={roleIndex}
                                    initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -30, opacity: 0 }} transition={{ duration: 0.4 }}
                                    className="ml-2 text-xl font-bold text-white-50"
                                >{roles[roleIndex]}</motion.span>
                            </AnimatePresence>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal delay={0.3}>
                        <p className="text-lg max-w-2xl mx-auto mb-10 text-blue-50/70">
                            Upload your resume, practice with real-time AI voice interviews, get instant feedback — all in one platform.
                        </p>
                    </ScrollReveal>

                    <ScrollReveal delay={0.4}>
                        <div className="flex justify-center mb-12">
                            <Link to="/register" className="cta-wrapper">
                                <div className="cta-button group">
                                    <div className="bg-circle" />
                                    <p className="text">Get Started Free</p>
                                    <div className="arrow-wrapper">
                                        <ArrowDown className="w-5 h-5 animate-bounce" />
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal delay={0.5}>
                        <div className="flex flex-wrap justify-center gap-8">
                            {stats.map((stat, i) => (
                                <motion.div key={i} whileHover={{ scale: 1.05, y: -4 }}
                                    className="text-center px-6 py-3 rounded-xl bg-black-200 border border-blue-100/10 transition-all"
                                >
                                    <div className="text-2xl font-bold text-white-50">{stat.value}</div>
                                    <div className="text-xs text-blue-50/60">{stat.label}</div>
                                </motion.div>
                            ))}
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            <div className="section-divider" />

            {/* Features */}
            <section className="relative z-10 py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <ScrollReveal>
                        <div className="text-center mb-16">
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-blue-50 bg-black-200 mb-4">
                                <Zap className="w-3 h-3" /> Features
                            </span>
                            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white-50">
                                Everything you need to <span className="gradient-text">accelerate</span>
                            </h2>
                            <p className="text-lg max-w-2xl mx-auto text-blue-50/70">
                                From learning to landing your dream job — one platform, infinite possibilities.
                            </p>
                        </div>
                    </ScrollReveal>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, i) => (
                            <ScrollReveal key={i} delay={i * 0.1}>
                                <GlowCard className="h-full">
                                    <div className="p-8 flex flex-col items-start h-full group">
                                        <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6`}>
                                            <feature.icon className="w-7 h-7 text-blue-50" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-3 text-white-50">{feature.title}</h3>
                                        <p className="text-sm leading-relaxed text-blue-50/70">{feature.desc}</p>
                                        <div className="mt-auto pt-6 flex items-center gap-1 text-sm font-medium text-blue-50/40 group-hover:text-white-50 transition-all duration-300">
                                            Explore <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </GlowCard>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>

            <div className="section-divider" />

            {/* CTA */}
            <section className="relative z-10 py-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <ScrollReveal>
                        <div className="glass-card p-12 md:p-16 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-100/10 to-black-200/20" />
                            <div className="relative z-10">
                                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white-50">
                                    Ready to <span className="gradient-text">forge</span> your future?
                                </h2>
                                <p className="text-lg mb-8 max-w-xl mx-auto text-blue-50/70">
                                    Join students building their careers with AI-powered voice interviews.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link to="/register" className="glow-btn !py-4 !px-8 !text-base flex items-center gap-2 justify-center">
                                        Get Started Free <ArrowDown className="w-5 h-5 animate-bounce" />
                                    </Link>
                                    <Link to="/learning" className="px-8 py-4 rounded-xl text-base font-semibold bg-black-200 text-white-50 border border-blue-100/20 hover:bg-blue-100 transition-all duration-300">
                                        Explore Learning Paths
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            <Footer />
        </div>
    );
}
