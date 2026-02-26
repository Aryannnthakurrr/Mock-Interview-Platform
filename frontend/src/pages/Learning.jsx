import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ScrollReveal from '../components/ScrollReveal';
import {
    BookOpen, Code, Database, Brain, Layers, ChevronDown, ExternalLink,
    CheckCircle2, Circle, Star, Clock,
} from 'lucide-react';

const learningPaths = [
    {
        id: 'dsa', title: 'Data Structures & Algorithms', icon: Code, progress: 72,
        totalTopics: 25, completedTopics: 18, difficulty: 'Intermediate', estimatedTime: '8 weeks',
        topics: [
            { name: 'Arrays & Strings', done: true, links: [{ name: 'LeetCode', url: 'https://leetcode.com/tag/array/' }] },
            { name: 'Linked Lists', done: true, links: [{ name: 'LeetCode', url: 'https://leetcode.com/tag/linked-list/' }] },
            { name: 'Stacks & Queues', done: true, links: [{ name: 'HackerRank', url: 'https://www.hackerrank.com/domains/data-structures' }] },
            { name: 'Trees & BST', done: true, links: [{ name: 'LeetCode', url: 'https://leetcode.com/tag/tree/' }] },
            { name: 'Graphs & BFS/DFS', done: false, links: [{ name: 'LeetCode', url: 'https://leetcode.com/tag/graph/' }] },
            { name: 'Dynamic Programming', done: false, links: [{ name: 'LeetCode', url: 'https://leetcode.com/tag/dynamic-programming/' }] },
        ],
    },
    {
        id: 'java', title: 'Java Programming', icon: Database, progress: 60,
        totalTopics: 20, completedTopics: 12, difficulty: 'Beginner', estimatedTime: '6 weeks',
        topics: [
            { name: 'Java Basics & OOP', done: true, links: [{ name: 'GFG', url: 'https://www.geeksforgeeks.org/java/' }] },
            { name: 'Collections Framework', done: true, links: [{ name: 'GFG', url: 'https://www.geeksforgeeks.org/collections-in-java-2/' }] },
            { name: 'Multithreading', done: false, links: [{ name: 'GFG', url: 'https://www.geeksforgeeks.org/multithreading-in-java/' }] },
        ],
    },
    {
        id: 'mern', title: 'MERN Stack', icon: Layers, progress: 45,
        totalTopics: 30, completedTopics: 13, difficulty: 'Intermediate', estimatedTime: '10 weeks',
        topics: [
            { name: 'React Fundamentals', done: true, links: [{ name: 'React Docs', url: 'https://react.dev' }] },
            { name: 'Node.js & Express', done: true, links: [{ name: 'Express', url: 'https://expressjs.com/' }] },
            { name: 'MongoDB & Mongoose', done: false, links: [{ name: 'MongoDB', url: 'https://www.mongodb.com/docs/' }] },
        ],
    },
    {
        id: 'aiml', title: 'AI / Machine Learning', icon: Brain, progress: 30,
        totalTopics: 22, completedTopics: 7, difficulty: 'Advanced', estimatedTime: '12 weeks',
        topics: [
            { name: 'Python for ML', done: true, links: [{ name: 'Kaggle', url: 'https://www.kaggle.com/learn/python' }] },
            { name: 'NumPy & Pandas', done: true, links: [{ name: 'Kaggle', url: 'https://www.kaggle.com/learn/pandas' }] },
            { name: 'Deep Learning Basics', done: false, links: [{ name: 'Fast.ai', url: 'https://www.fast.ai/' }] },
        ],
    },
    {
        id: 'datascience', title: 'Data Science', icon: BookOpen, progress: 25,
        totalTopics: 18, completedTopics: 4, difficulty: 'Intermediate', estimatedTime: '8 weeks',
        topics: [
            { name: 'Statistics & Probability', done: true, links: [{ name: 'Khan Academy', url: 'https://www.khanacademy.org/math/statistics-probability' }] },
            { name: 'SQL & Databases', done: false, links: [{ name: 'LeetCode', url: 'https://leetcode.com/study-plan/top-sql-50/' }] },
        ],
    },
];

export default function Learning() {
    const [expandedPath, setExpandedPath] = useState(null);
    const [completedTopics, setCompletedTopics] = useState({});

    const toggleTopic = (pathId, topicName) => {
        setCompletedTopics((prev) => ({ ...prev, [`${pathId}-${topicName}`]: !prev[`${pathId}-${topicName}`] }));
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 md:px-8">
            <div className="vignette" />
            <div className="max-w-5xl mx-auto relative z-10">
                <ScrollReveal>
                    <div className="text-center mb-12">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-blue-50 bg-black-200 mb-4">
                            <BookOpen className="w-3 h-3" /> Learning Paths
                        </span>
                        <h1 className="text-4xl font-bold mb-4 text-white-50">Master Your <span className="gradient-text">Skills</span></h1>
                        <p className="max-w-xl mx-auto text-blue-50/60">Structured learning paths with progress tracking and curated practice resources.</p>
                    </div>
                </ScrollReveal>

                <div className="space-y-4">
                    {learningPaths.map((path, i) => (
                        <ScrollReveal key={path.id} delay={i * 0.1}>
                            <div className="glass-card overflow-hidden">
                                <motion.div whileHover={{ x: 4 }} onClick={() => setExpandedPath(expandedPath === path.id ? null : path.id)}
                                    className="p-6 cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-black-200 flex items-center justify-center">
                                                <path.icon className="w-6 h-6 text-blue-50" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white-50">{path.title}</h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-xs flex items-center gap-1 text-blue-50/50"><Star className="w-3 h-3" /> {path.difficulty}</span>
                                                    <span className="text-xs flex items-center gap-1 text-blue-50/50"><Clock className="w-3 h-3" /> {path.estimatedTime}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right hidden sm:block">
                                                <div className="text-sm font-bold text-white-50">{path.progress}%</div>
                                                <div className="text-xs text-blue-50/50">{path.completedTopics}/{path.totalTopics}</div>
                                            </div>
                                            <div className="w-24 h-2 rounded-full overflow-hidden hidden sm:block bg-blue-100/20">
                                                <div className="h-full rounded-full bg-blue-50" style={{ width: `${path.progress}%` }} />
                                            </div>
                                            <motion.div animate={{ rotate: expandedPath === path.id ? 180 : 0 }} className="text-blue-50">
                                                <ChevronDown className="w-5 h-5" />
                                            </motion.div>
                                        </div>
                                    </div>
                                </motion.div>

                                <AnimatePresence>
                                    {expandedPath === path.id && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                                            <div className="px-6 pb-6 border-t border-blue-100/10 pt-4 space-y-2">
                                                {path.topics.map((topic, j) => {
                                                    const isCompleted = completedTopics[`${path.id}-${topic.name}`] ?? topic.done;
                                                    return (
                                                        <motion.div key={j} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                                                            transition={{ delay: j * 0.05 }}
                                                            className="flex items-center justify-between p-3 rounded-xl hover:bg-black-200/50 transition-all">
                                                            <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => toggleTopic(path.id, topic.name)}>
                                                                {isCompleted ? <CheckCircle2 className="w-5 h-5 text-blue-50 flex-shrink-0" /> : <Circle className="w-5 h-5 text-blue-100 flex-shrink-0" />}
                                                                <span className={`text-sm ${isCompleted ? 'text-blue-50/40 line-through' : 'text-white-50'}`}>{topic.name}</span>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                {topic.links.map((link, k) => (
                                                                    <a key={k} href={link.url} target="_blank" rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-black-200 text-blue-50 hover:text-white-50 transition-all">
                                                                        {link.name} <ExternalLink className="w-3 h-3" />
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </div>
    );
}
