import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import './FeedbackReport.css'

const API = 'http://localhost:8000'

export default function FeedbackReport() {
    const { sessionId } = useParams()
    const [session, setSession] = useState(null)
    const [feedback, setFeedback] = useState(null)
    const [emotions, setEmotions] = useState([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)

    useEffect(() => {
        loadData()
    }, [sessionId])

    const loadData = async () => {
        try {
            const [sessRes, emRes] = await Promise.all([
                fetch(`${API}/api/interviews/${sessionId}`),
                fetch(`${API}/api/interviews/${sessionId}/emotions`),
            ])
            const sessData = await sessRes.json()
            const emData = await emRes.json()

            setSession(sessData)
            setEmotions(emData)

            if (sessData.feedback && Object.keys(sessData.feedback).length > 0) {
                setFeedback(sessData.feedback)
            } else {
                // Try to fetch standalone feedback
                try {
                    const fbRes = await fetch(`${API}/api/feedback/${sessionId}`)
                    if (fbRes.ok) {
                        setFeedback(await fbRes.json())
                    }
                } catch { }
            }
        } catch (err) {
            console.error('Failed to load data:', err)
        } finally {
            setLoading(false)
        }
    }

    const generateFeedback = async () => {
        setGenerating(true)
        try {
            const res = await fetch(`${API}/api/feedback/${sessionId}`, { method: 'POST' })
            if (res.ok) {
                const data = await res.json()
                setFeedback(data)
            }
        } catch (err) {
            console.error('Feedback generation error:', err)
        } finally {
            setGenerating(false)
        }
    }

    if (loading) {
        return (
            <div className="page-wrapper feedback-page container">
                <div className="loading-state"><div className="spinner"></div></div>
            </div>
        )
    }

    const score = feedback?.overall_score ?? session?.overall_score ?? 0
    const scoreColor = score >= 70 ? 'emerald' : score >= 50 ? 'amber' : 'rose'

    // Compute emotion stats
    const avgStress = emotions.length
        ? (emotions.reduce((a, e) => a + e.stress_score, 0) / emotions.length).toFixed(2)
        : 0
    const avgConfidence = emotions.length
        ? (emotions.reduce((a, e) => a + e.confidence_score, 0) / emotions.length).toFixed(2)
        : 0

    return (
        <div className="page-wrapper feedback-page container">
            <div className="feedback-header animate-fadeIn">
                <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>
                <h1>Interview Report</h1>
                <p className="text-secondary">
                    {session?.session_type === 'topic' ? 'Topic Interview' : session?.job_title || 'Custom Interview'}
                    {' • '}
                    {session?.created_at ? new Date(session.created_at).toLocaleDateString() : ''}
                    {' • '}
                    {Math.round((session?.duration_seconds || 0) / 60)} minutes
                </p>
            </div>

            {!feedback ? (
                <div className="no-feedback glass-card animate-fadeInUp">
                    <h3>📊 No Feedback Yet</h3>
                    <p>Generate AI-powered feedback based on your interview transcript and emotion data.</p>
                    <button
                        className="btn btn-primary"
                        onClick={generateFeedback}
                        disabled={generating}
                    >
                        {generating ? (
                            <><div className="spinner" style={{ width: 18, height: 18 }}></div> Generating...</>
                        ) : (
                            '🤖 Generate Feedback'
                        )}
                    </button>
                </div>
            ) : (
                <>
                    {/* ── Score Section ─────────────────── */}
                    <div className="score-section animate-fadeInUp stagger-1">
                        <div className={`score-ring score-${scoreColor}`}>
                            <div className="score-value">{Math.round(score)}</div>
                            <div className="score-label">Overall Score</div>
                            <svg className="score-svg" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                                <circle
                                    cx="60" cy="60" r="54" fill="none"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={`${(score / 100) * 339} 339`}
                                    transform="rotate(-90 60 60)"
                                    className="score-progress"
                                />
                            </svg>
                        </div>
                        <div className="score-summary">
                            <p>{feedback.summary}</p>
                        </div>
                    </div>

                    {/* ── Emotion Stats ─────────────────── */}
                    {emotions.length > 0 && (
                        <div className="emotion-section animate-fadeInUp stagger-2">
                            <h2>😊 Emotion & Body Language Analysis</h2>
                            <div className="emotion-stats-grid">
                                <div className="emotion-stat glass-card">
                                    <div className="emotion-stat-value" style={{ color: 'var(--accent-emerald)' }}>{avgConfidence}</div>
                                    <div className="emotion-stat-label">Avg Confidence</div>
                                    <div className="emotion-stat-bar">
                                        <div className="emotion-bar-fill confidence" style={{ width: `${avgConfidence * 100}%` }} />
                                    </div>
                                </div>
                                <div className="emotion-stat glass-card">
                                    <div className="emotion-stat-value" style={{ color: 'var(--accent-amber)' }}>{avgStress}</div>
                                    <div className="emotion-stat-label">Avg Stress</div>
                                    <div className="emotion-stat-bar">
                                        <div className="emotion-bar-fill stress" style={{ width: `${avgStress * 100}%` }} />
                                    </div>
                                </div>
                                <div className="emotion-stat glass-card">
                                    <div className="emotion-stat-value" style={{ color: 'var(--accent-blue)' }}>{emotions.length}</div>
                                    <div className="emotion-stat-label">Data Points</div>
                                </div>
                            </div>

                            {/* Emotion Timeline */}
                            <div className="timeline-chart glass-card">
                                <h3>Emotion Timeline</h3>
                                <div className="timeline-viz">
                                    {emotions.map((e, i) => (
                                        <div key={i} className="timeline-point" title={`${Math.round(e.timestamp)}s - ${e.dominant_emotion}`}>
                                            <div
                                                className="point-bar confidence-bar"
                                                style={{ height: `${e.confidence_score * 100}%` }}
                                            />
                                            <div
                                                className="point-bar stress-bar"
                                                style={{ height: `${e.stress_score * 100}%` }}
                                            />
                                            <span className="point-label">{Math.round(e.timestamp)}s</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="timeline-legend">
                                    <span className="legend-item"><span className="legend-dot confidence"></span> Confidence</span>
                                    <span className="legend-item"><span className="legend-dot stress"></span> Stress</span>
                                </div>
                            </div>

                            {feedback.emotion_summary && (
                                <div className="emotion-notes glass-card">
                                    <h3>📝 Body Language Notes</h3>
                                    <p>{feedback.emotion_summary.body_language_notes || 'No specific notes.'}</p>
                                    {feedback.emotion_summary.dominant_mood && (
                                        <p><strong>Dominant Mood:</strong> {feedback.emotion_summary.dominant_mood}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Strengths & Weaknesses ────────── */}
                    <div className="sw-section animate-fadeInUp stagger-3">
                        <div className="sw-grid">
                            <div className="sw-column">
                                <h2>💪 Strengths</h2>
                                {feedback.strengths?.map((s, i) => (
                                    <div key={i} className="sw-card strength glass-card">
                                        <div className="sw-area">{s.area}</div>
                                        <div className="sw-detail">{s.detail}</div>
                                    </div>
                                ))}
                                {(!feedback.strengths || feedback.strengths.length === 0) && (
                                    <p className="text-secondary">No specific strengths identified.</p>
                                )}
                            </div>
                            <div className="sw-column">
                                <h2>🎯 Areas to Improve</h2>
                                {feedback.weaknesses?.map((w, i) => (
                                    <div key={i} className="sw-card weakness glass-card">
                                        <div className="sw-area">{w.area}</div>
                                        <div className="sw-detail">{w.detail}</div>
                                    </div>
                                ))}
                                {(!feedback.weaknesses || feedback.weaknesses.length === 0) && (
                                    <p className="text-secondary">No specific weaknesses identified.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Suggestions ───────────────────── */}
                    {feedback.suggestions?.length > 0 && (
                        <div className="suggestions-section animate-fadeInUp stagger-4">
                            <h2>💡 Actionable Suggestions</h2>
                            <div className="suggestions-list">
                                {feedback.suggestions.map((s, i) => (
                                    <div key={i} className="suggestion-item glass-card">
                                        <span className="suggestion-num">{i + 1}</span>
                                        <span>{s}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Question Breakdown ────────────── */}
                    {feedback.question_breakdown?.length > 0 && (
                        <div className="breakdown-section animate-fadeInUp stagger-5">
                            <h2>📋 Question Breakdown</h2>
                            <div className="breakdown-list">
                                {feedback.question_breakdown.map((q, i) => (
                                    <div key={i} className="breakdown-item glass-card">
                                        <div className="breakdown-header">
                                            <span className="breakdown-q">Q{i + 1}: {q.question}</span>
                                            <span className={`badge badge-${q.response_quality === 'good' ? 'emerald' : q.response_quality === 'fair' ? 'amber' : 'rose'}`}>
                                                {q.response_quality}
                                            </span>
                                        </div>
                                        {q.notes && <div className="breakdown-notes">{q.notes}</div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Transcript ────────────────────── */}
                    {session?.transcript?.length > 0 && (
                        <div className="transcript-section animate-fadeInUp stagger-6">
                            <h2>📜 Full Transcript</h2>
                            <div className="transcript-replay glass-card">
                                {session.transcript.map((msg, i) => (
                                    <div key={i} className={`replay-msg ${msg.role}`}>
                                        <span className="replay-role">{msg.role === 'interviewer' ? '🤖' : '👤'}</span>
                                        <span className="replay-text">{msg.content}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
