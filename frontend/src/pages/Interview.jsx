import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiGet, apiPost } from '../services/api';
import ScrollReveal from '../components/ScrollReveal';
import GlowCard from '../components/ui/GlowCard';
import { Mic, Play, Loader2, AlertCircle } from 'lucide-react';

export default function Interview() {
    const navigate = useNavigate();
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [difficulty, setDifficulty] = useState('intermediate');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        apiGet('/topics')
            .then(setTopics)
            .catch(() => setError('Failed to load topics'))
            .finally(() => setLoading(false));
    }, []);

    const startInterview = async () => {
        if (!selectedTopic) return;
        setCreating(true);
        setError('');
        try {
            const session = await apiPost('/interviews', {
                session_type: 'topic',
                topic_id: selectedTopic.id,
                difficulty,
            });
            navigate(`/interview/${session.id}`);
        } catch (err) {
            setError(err.message || 'Failed to create session');
            setCreating(false);
        }
    };

    const selectedTopicData = topics.find((t) => t.id === selectedTopic?.id);

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 md:px-8">
            <div className="vignette" />
            <div className="max-w-4xl mx-auto relative z-10">
                <ScrollReveal>
                    <div className="text-center mb-12">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-blue-50 bg-black-200 mb-4">
                            <Mic className="w-3 h-3" /> Mock Interview
                        </span>
                        <h1 className="text-4xl font-bold mb-4 text-white-50">
                            Practice <span className="gradient-text">Interviews</span>
                        </h1>
                        <p className="max-w-xl mx-auto text-blue-50/60">
                            Choose a topic and difficulty, then start a real-time AI voice interview.
                        </p>
                    </div>
                </ScrollReveal>

                {loading ? (
                    <div className="text-center py-12 text-blue-50/50"><Loader2 className="w-8 h-8 mx-auto animate-spin mb-2" /> Loading topics...</div>
                ) : (
                    <>
                        {/* Topic Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                            {topics.map((topic, i) => (
                                <ScrollReveal key={topic.id} delay={i * 0.05}>
                                    <motion.div whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                        onClick={() => setSelectedTopic(topic)}
                                        className={`glass-card p-5 cursor-pointer text-center transition-all ${selectedTopic?.id === topic.id ? '!border-blue-50/40 shadow-lg shadow-blue-50/5' : ''
                                            }`}>
                                        <div className="text-3xl mb-3">{topic.icon}</div>
                                        <h3 className="font-semibold text-sm mb-1 text-white-50">{topic.name}</h3>
                                        <p className="text-xs text-blue-50/40">{topic.category}</p>
                                        {selectedTopic?.id === topic.id && (
                                            <motion.div layoutId="topic-sel" className="mt-3 w-full h-1 rounded-full bg-blue-50" />
                                        )}
                                    </motion.div>
                                </ScrollReveal>
                            ))}
                        </div>

                        {/* Selected Topic Details + Difficulty */}
                        {selectedTopicData && (
                            <ScrollReveal>
                                <div className="glass-card p-6 mb-8">
                                    <div className="flex items-start gap-4 mb-4">
                                        <span className="text-3xl">{selectedTopicData.icon}</span>
                                        <div>
                                            <h3 className="text-lg font-bold text-white-50">{selectedTopicData.name}</h3>
                                            <p className="text-sm text-blue-50/60 mt-1">{selectedTopicData.description}</p>
                                        </div>
                                    </div>

                                    {/* Subtopics */}
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {selectedTopicData.subtopics.map((s) => (
                                            <span key={s} className="px-3 py-1 rounded-lg text-xs bg-black-200 text-blue-50">{s}</span>
                                        ))}
                                    </div>

                                    {/* Difficulty */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium mb-2 text-blue-50">Difficulty</label>
                                        <div className="flex gap-3">
                                            {(selectedTopicData.difficulty_levels || ['beginner', 'intermediate', 'advanced']).map((d) => (
                                                <button key={d} onClick={() => setDifficulty(d)}
                                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${difficulty === d
                                                            ? 'bg-white-50 text-black-100'
                                                            : 'bg-black-200 text-blue-50 hover:text-white-50'
                                                        }`}>{d}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </ScrollReveal>
                        )}

                        {error && (
                            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> {error}
                            </div>
                        )}

                        <div className="text-center">
                            <button onClick={startInterview} disabled={!selectedTopic || creating}
                                className={`glow-btn !py-4 !px-10 !text-base flex items-center gap-2 mx-auto ${(!selectedTopic || creating) ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}>
                                {creating ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating...</>
                                    : <><Play className="w-5 h-5" /> Start Interview</>}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
