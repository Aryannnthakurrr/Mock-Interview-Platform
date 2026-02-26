import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { apiGet } from '../services/api';
import ScrollReveal from '../components/ScrollReveal';
import {
    BarChart3, Target, Calendar, Clock, TrendingUp, CheckCircle2, Circle,
    ChevronRight, Flame, Zap, Trophy, Brain, ExternalLink,
} from 'lucide-react';

export default function Dashboard() {
    const { user } = useAuthStore();
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiGet('/interviews')
            .then(setInterviews)
            .catch(() => setInterviews([]))
            .finally(() => setLoading(false));
    }, []);

    const completedInterviews = interviews.filter((i) => i.status === 'completed');
    const avgScore = completedInterviews.length
        ? Math.round(completedInterviews.reduce((sum, i) => sum + (i.overall_score || 0), 0) / completedInterviews.length)
        : 0;

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 md:px-8">
            <div className="vignette" />
            <div className="max-w-7xl mx-auto relative z-10">
                <ScrollReveal>
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2 text-white-50">
                            Welcome back, <span className="gradient-text">{user?.name || 'Student'}</span> 👋
                        </h1>
                        <p className="text-blue-50/60">Here's your interview performance overview.</p>
                    </div>
                </ScrollReveal>

                {/* Quick Stats */}
                <ScrollReveal delay={0.1}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {[
                            { icon: Flame, label: 'Total Interviews', value: interviews.length, color: 'text-blue-50' },
                            { icon: Trophy, label: 'Completed', value: completedInterviews.length, color: 'text-blue-50' },
                            { icon: Zap, label: 'Avg Score', value: `${avgScore}%`, color: 'text-blue-50' },
                            { icon: Brain, label: 'Active', value: interviews.filter((i) => i.status === 'active').length, color: 'text-blue-50' },
                        ].map((stat, i) => (
                            <motion.div key={i} whileHover={{ y: -4, scale: 1.02 }}
                                className="glass-card p-5">
                                <stat.icon className={`w-6 h-6 ${stat.color} mb-3`} />
                                <div className="text-2xl font-bold text-white-50">{stat.value}</div>
                                <div className="text-xs text-blue-50/50">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </ScrollReveal>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Interview History */}
                    <div className="lg:col-span-2">
                        <ScrollReveal delay={0.2}>
                            <div className="glass-card p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-bold flex items-center gap-2 text-white-50">
                                        <TrendingUp className="w-5 h-5 text-blue-50" /> Interview History
                                    </h2>
                                    <Link to="/interview" className="text-xs text-blue-50 hover:text-white-50 flex items-center gap-1 transition-colors">
                                        New Interview <ChevronRight className="w-3 h-3" />
                                    </Link>
                                </div>

                                {loading ? (
                                    <div className="text-center py-8 text-blue-50/50">Loading...</div>
                                ) : interviews.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Trophy className="w-12 h-12 mx-auto mb-3 text-blue-50/30" />
                                        <p className="text-blue-50/50 mb-4">No interviews yet</p>
                                        <Link to="/interview" className="glow-btn !py-2 !px-5 !text-sm">
                                            Start Your First Interview
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {interviews.slice(0, 10).map((item) => (
                                            <motion.div key={item.id} whileHover={{ x: 4 }}
                                                className="flex items-center justify-between p-4 rounded-xl bg-black-200/50 hover:bg-black-200 transition-all cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100/30 text-blue-50">
                                                        {item.session_type === 'topic' ? <BarChart3 className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-sm text-white-50">
                                                            {item.topic_name || item.job_title || 'Interview'}
                                                        </div>
                                                        <div className="text-xs text-blue-50/50">
                                                            {item.session_type} • {item.difficulty} • {new Date(item.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-xs px-2 py-1 rounded-lg ${item.status === 'completed' ? 'bg-green-500/10 text-green-400'
                                                            : item.status === 'active' ? 'bg-yellow-500/10 text-yellow-400'
                                                                : 'bg-blue-100/20 text-blue-50'
                                                        }`}>{item.status}</span>
                                                    {item.overall_score != null && (
                                                        <div className="text-lg font-bold text-white-50">{Math.round(item.overall_score)}%</div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </ScrollReveal>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-6">
                        <ScrollReveal delay={0.2}>
                            <div className="glass-card p-6">
                                <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-white-50">
                                    <Zap className="w-5 h-5 text-blue-50" /> Quick Actions
                                </h2>
                                <div className="space-y-3">
                                    <Link to="/interview" className="flex items-center gap-3 p-3 rounded-xl bg-black-200/50 hover:bg-black-200 transition-all group">
                                        <BarChart3 className="w-5 h-5 text-blue-50" />
                                        <span className="text-sm text-blue-50 group-hover:text-white-50">Topic Interview</span>
                                    </Link>
                                    <Link to="/resume" className="flex items-center gap-3 p-3 rounded-xl bg-black-200/50 hover:bg-black-200 transition-all group">
                                        <Target className="w-5 h-5 text-blue-50" />
                                        <span className="text-sm text-blue-50 group-hover:text-white-50">Custom Interview (Resume)</span>
                                    </Link>
                                    <Link to="/learning" className="flex items-center gap-3 p-3 rounded-xl bg-black-200/50 hover:bg-black-200 transition-all group">
                                        <Brain className="w-5 h-5 text-blue-50" />
                                        <span className="text-sm text-blue-50 group-hover:text-white-50">Learning Paths</span>
                                    </Link>
                                    <Link to="/chat" className="flex items-center gap-3 p-3 rounded-xl bg-black-200/50 hover:bg-black-200 transition-all group">
                                        <Calendar className="w-5 h-5 text-blue-50" />
                                        <span className="text-sm text-blue-50 group-hover:text-white-50">AI Study Buddy</span>
                                    </Link>
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>
                </div>
            </div>
        </div>
    );
}
