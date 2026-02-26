import { Link } from 'react-router-dom'
import './Landing.css'

export default function Landing() {
    return (
        <div className="page-wrapper landing-page">
            {/* ── Hero Section ──────────────────────────── */}
            <section className="hero">
                <div className="hero-bg">
                    <div className="hero-orb hero-orb-1"></div>
                    <div className="hero-orb hero-orb-2"></div>
                    <div className="hero-orb hero-orb-3"></div>
                </div>
                <div className="container hero-content">
                    <div className="hero-badge animate-fadeIn">
                        <span className="pulse-dot"></span>
                        AI-Powered Interview Platform
                    </div>
                    <h1 className="hero-title animate-fadeInUp stagger-1">
                        Master Your Next
                        <span className="gradient-text"> Interview</span>
                    </h1>
                    <p className="hero-subtitle animate-fadeInUp stagger-2">
                        Practice with an AI interviewer that adapts to your skill level, analyzes your
                        emotions in real-time, and gives you personalized feedback to crush your next interview.
                    </p>
                    <div className="hero-actions animate-fadeInUp stagger-3">
                        <Link to="/setup" className="btn btn-primary btn-lg">
                            🚀 Start Mock Interview
                        </Link>
                        <Link to="/dashboard" className="btn btn-secondary btn-lg">
                            📊 View Dashboard
                        </Link>
                    </div>
                    <div className="hero-stats animate-fadeInUp stagger-4">
                        <div className="stat-item">
                            <span className="stat-value">10+</span>
                            <span className="stat-label">Interview Topics</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <span className="stat-value">AI</span>
                            <span className="stat-label">Voice Conversation</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <span className="stat-value">Live</span>
                            <span className="stat-label">Emotion Analysis</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Features Section ──────────────────────── */}
            <section className="features container">
                <h2 className="section-title">Everything You Need to Ace Interviews</h2>
                <p className="section-subtitle">
                    Powered by Google Gemini AI for realistic, adaptive interview experiences
                </p>
                <div className="features-grid">
                    <div className="feature-card glass-card animate-fadeInUp stagger-1">
                        <div className="feature-icon" style={{ background: 'var(--accent-blue-glow)' }}>🎙️</div>
                        <h3>Voice Conversations</h3>
                        <p>Natural voice-based interviews with real-time AI responses. Just talk like you would in a real interview.</p>
                    </div>
                    <div className="feature-card glass-card animate-fadeInUp stagger-2">
                        <div className="feature-icon" style={{ background: 'var(--accent-purple-glow)' }}>📸</div>
                        <h3>Emotion Analysis</h3>
                        <p>Camera captures your expressions to measure stress, confidence, and engagement throughout the interview.</p>
                    </div>
                    <div className="feature-card glass-card animate-fadeInUp stagger-3">
                        <div className="feature-icon" style={{ background: 'var(--accent-emerald-glow)' }}>📄</div>
                        <h3>Resume-Based</h3>
                        <p>Upload your resume and job description for a fully personalized interview tailored to your profile.</p>
                    </div>
                    <div className="feature-card glass-card animate-fadeInUp stagger-4">
                        <div className="feature-icon" style={{ background: 'var(--accent-amber-glow)' }}>📊</div>
                        <h3>Deep Feedback</h3>
                        <p>Get detailed scoring, strengths, weaknesses, and actionable suggestions after every session.</p>
                    </div>
                    <div className="feature-card glass-card animate-fadeInUp stagger-5">
                        <div className="feature-icon" style={{ background: 'var(--accent-rose-glow)' }}>🎯</div>
                        <h3>Topic Focus</h3>
                        <p>Quick-start interviews on DBMS, OOPs, OS, DSA, System Design, and more core CS topics.</p>
                    </div>
                    <div className="feature-card glass-card animate-fadeInUp stagger-6">
                        <div className="feature-icon" style={{ background: 'rgba(6, 182, 212, 0.2)' }}>🧠</div>
                        <h3>Adaptive AI</h3>
                        <p>The AI follows up on weak areas, probes deeper on interesting answers, and adjusts difficulty dynamically.</p>
                    </div>
                </div>
            </section>

            {/* ── How It Works ──────────────────────────── */}
            <section className="how-it-works container">
                <h2 className="section-title">How It Works</h2>
                <div className="steps-grid">
                    <div className="step-card">
                        <div className="step-number">01</div>
                        <h3>Choose Your Path</h3>
                        <p>Select a topic for quick practice, or upload your resume for a tailored experience</p>
                    </div>
                    <div className="step-connector">→</div>
                    <div className="step-card">
                        <div className="step-number">02</div>
                        <h3>Talk to AI</h3>
                        <p>Have a natural voice conversation with your AI interviewer while we analyze in the background</p>
                    </div>
                    <div className="step-connector">→</div>
                    <div className="step-card">
                        <div className="step-number">03</div>
                        <h3>Get Feedback</h3>
                        <p>Receive comprehensive feedback with scores, emotion analysis, and improvement tips</p>
                    </div>
                </div>
            </section>

            {/* ── Footer ────────────────────────────────── */}
            <footer className="landing-footer">
                <div className="container">
                    <p>Built with ❤️ using Google Gemini AI • MockMaster © 2026</p>
                </div>
            </footer>
        </div>
    )
}
