import { Flame, Github, Twitter, Linkedin, Mail } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="relative z-10 border-t border-blue-100/20 bg-black-100/80 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-9 h-9 rounded-xl bg-black-200 flex items-center justify-center">
                                <Flame className="w-5 h-5 text-white-50" />
                            </div>
                            <span className="font-bold text-lg text-white-50">MockMind</span>
                        </div>
                        <p className="text-sm text-blue-50/60">
                            Your AI-powered career operating system. Learn, practice, build, and grow.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4 text-white-50">Platform</h4>
                        <div className="space-y-2">
                            {['Dashboard', 'Learning Paths', 'AI Chatbot', 'Mock Interview', 'Resume Upload'].map((item) => (
                                <a key={item} href="#" className="block text-sm text-blue-50/60 hover:text-white-50 transition-colors duration-300">
                                    {item}
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4 text-white-50">Resources</h4>
                        <div className="space-y-2">
                            {['Documentation', 'API Reference', 'Community', 'Blog', 'Changelog'].map((item) => (
                                <a key={item} href="#" className="block text-sm text-blue-50/60 hover:text-white-50 transition-colors duration-300">
                                    {item}
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4 text-white-50">Connect</h4>
                        <div className="flex gap-3">
                            {[Github, Twitter, Linkedin, Mail].map((Icon, i) => (
                                <a key={i} href="#" className="p-2.5 rounded-xl bg-black-200 text-blue-50 hover:text-white-50 hover:bg-blue-100 transition-all duration-300">
                                    <Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-blue-100/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-blue-50/40">© 2026 MockMind. All rights reserved.</p>
                    <p className="text-sm text-blue-50/40">Open Source • MIT License</p>
                </div>
            </div>
        </footer>
    );
}
