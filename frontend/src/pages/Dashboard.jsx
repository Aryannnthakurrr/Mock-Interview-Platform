import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Dashboard.css'

const API = 'http://localhost:8000'

export default function Dashboard() {
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`${API}/api/interviews`)
            .then(r => r.json())
            .then(data => { setSessions(data); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    const completedSessions = sessions.filter(s => s.status === 'completed')
    const avgScore = completedSessions.length
        ? Math.round(completedSessions.reduce((a, s) => a + (s.overall_score || 0), 0) / completedSessions.length)
        : 0

    return (
        <div className="page-wrapper dashboard container">
            <div className="dashboard-header animate-fadeIn">
                <div>
                    <h1>Your Dashboard</h1>
                    <p className="text-secondary">Track your interview performance and progress</p>
                </div>
                <Link to="/setup" className="btn btn-primary">+ New Interview</Link>
            </div>

            {/* ── Stats Row ──────────────────────────── */}
            <div className="stats-row animate-fadeInUp stagger-1">
                <div className="stat-card glass-card">
                    <div className="stat-card-icon">📊</div>
                    <div className="stat-card-value">{sessions.length}</div>
                    <div className="stat-card-label">Total Sessions</div>
                </div>
                <div className="stat-card glass-card">
                    <div className="stat-card-icon">✅</div>
                    <div className="stat-card-value">{completedSessions.length}</div>
                    <div className="stat-card-label">Completed</div>
                </div>
                <div className="stat-card glass-card">
                    <div className="stat-card-icon">🎯</div>
                    <div className="stat-card-value">{avgScore || '—'}</div>
                    <div className="stat-card-label">Avg Score</div>
                </div>
                <div className="stat-card glass-card">
                    <div className="stat-card-icon">⏱️</div>
                    <div className="stat-card-value">
                        {completedSessions.length
                            ? Math.round(completedSessions.reduce((a, s) => a + s.duration_seconds, 0) / 60)
                            : 0}m
                    </div>
                    <div className="stat-card-label">Total Practice</div>
                </div>
            </div>

            {/* ── Session History ────────────────────── */}
            <div className="sessions-section animate-fadeInUp stagger-2">
                <h2>Interview History</h2>
                {loading ? (
                    <div className="loading-state"><div className="spinner"></div></div>
                ) : sessions.length === 0 ? (
                    <div className="empty-state glass-card">
                        <div className="empty-icon">🎤</div>
                        <h3>No interviews yet</h3>
                        <p>Start your first mock interview to see your progress here.</p>
                        <Link to="/setup" className="btn btn-primary" style={{ marginTop: 16 }}>Start Now</Link>
                    </div>
                ) : (
                    <div className="sessions-list">
                        {sessions.map((session, i) => (
                            <div key={session.id} className="session-card glass-card" style={{ animationDelay: `${i * 0.05}s` }}>
                                <div className="session-card-left">
                                    <div className="session-type-badge">
                                        {session.session_type === 'topic' ? '📝' : '📄'}
                                    </div>
                                    <div className="session-info">
                                        <h4>
                                            {session.session_type === 'topic'
                                                ? (session.topic_name || 'Topic Interview')
                                                : (session.job_title || 'Custom Interview')}
                                        </h4>
                                        <div className="session-meta">
                                            <span className={`badge badge-${session.status === 'completed' ? 'emerald' : session.status === 'active' ? 'blue' : 'amber'}`}>
                                                {session.status}
                                            </span>
                                            <span className="meta-dot">•</span>
                                            <span>{new Date(session.created_at).toLocaleDateString()}</span>
                                            <span className="meta-dot">•</span>
                                            <span>{Math.round(session.duration_seconds / 60)}min</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="session-card-right">
                                    {session.overall_score !== null && session.overall_score !== undefined ? (
                                        <div className="session-score" data-score={session.overall_score >= 70 ? 'good' : session.overall_score >= 50 ? 'fair' : 'poor'}>
                                            {Math.round(session.overall_score)}
                                        </div>
                                    ) : null}
                                    {session.status === 'completed' ? (
                                        <Link to={`/feedback/${session.id}`} className="btn btn-secondary btn-sm">
                                            View Report
                                        </Link>
                                    ) : session.status === 'active' ? (
                                        <Link to={`/interview/${session.id}`} className="btn btn-primary btn-sm">
                                            Resume
                                        </Link>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
