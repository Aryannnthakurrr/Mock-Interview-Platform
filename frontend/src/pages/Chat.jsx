import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../store/chatStore';
import { Send, Bot, User, Trash2, Sparkles } from 'lucide-react';

export default function Chat() {
    const { messages, isTyping, sendMessage, clearChat } = useChatStore();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

    const handleSend = () => {
        if (!input.trim()) return;
        sendMessage(input.trim());
        setInput('');
    };

    const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

    const quickActions = ['Help me with DSA', 'Review my resume', 'Mock interview tips', 'Career guidance'];

    return (
        <div className="min-h-screen pt-24 pb-6 px-4 md:px-8">
            <div className="vignette" />
            <div className="max-w-5xl mx-auto relative z-10 flex flex-col h-[calc(100vh-7rem)]">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-black-200 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-blue-50" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white-50">AI Study Buddy</h1>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-xs text-blue-50/50">Online</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={clearChat} className="p-2 rounded-xl text-blue-50/50 hover:text-red-400 hover:bg-black-200 transition-all">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto rounded-2xl p-4 space-y-4 glass">
                    <AnimatePresence>
                        {messages.map((msg) => (
                            <motion.div key={msg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.sender === 'ai' ? 'bg-black-200' : 'bg-blue-100'}`}>
                                    {msg.sender === 'ai' ? <Bot className="w-4 h-4 text-blue-50" /> : <User className="w-4 h-4 text-white-50" />}
                                </div>
                                <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${msg.sender === 'user'
                                        ? 'bg-black-200 text-white-50 rounded-tr-sm border border-blue-100/20'
                                        : 'bg-black-50/50 text-blue-50 rounded-tl-sm border border-blue-100/10'
                                    }`}>{msg.text}</div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {isTyping && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                            <div className="w-8 h-8 rounded-xl bg-black-200 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-blue-50" />
                            </div>
                            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-black-50/50 border border-blue-100/10">
                                <div className="flex gap-1">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div key={i} className="w-2 h-2 rounded-full bg-blue-50"
                                            animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {messages.length <= 1 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {quickActions.map((action) => (
                            <button key={action} onClick={() => sendMessage(action)}
                                className="px-3 py-2 rounded-xl text-xs font-medium bg-black-200 text-blue-50 hover:text-white-50 border border-blue-100/10 hover:border-blue-100/30 transition-all duration-300">
                                <Sparkles className="w-3 h-3 inline mr-1" />{action}
                            </button>
                        ))}
                    </div>
                )}

                <div className="mt-3 rounded-2xl p-2 flex items-end gap-2 glass">
                    <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey}
                        placeholder="Ask me anything..." rows={1}
                        className="flex-1 resize-none px-4 py-3 rounded-xl text-sm outline-none bg-transparent text-white-50 placeholder-blue-50/40"
                        style={{ minHeight: '44px', maxHeight: '120px' }} />
                    <button onClick={handleSend} disabled={!input.trim()}
                        className={`p-3 rounded-xl transition-all ${input.trim() ? 'glow-btn !p-3' : 'bg-black-200 text-blue-50/30'}`}>
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
