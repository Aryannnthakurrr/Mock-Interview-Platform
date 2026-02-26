import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './LiveInterview.css'

const WS_URL = 'ws://localhost:8000'
const API = 'http://localhost:8000'

export default function LiveInterview() {
    const { sessionId } = useParams()
    const navigate = useNavigate()

    const [status, setStatus] = useState('connecting') // connecting, ready, active, ended, error
    const [statusMessage, setStatusMessage] = useState('Initializing...')
    const [errorMessage, setErrorMessage] = useState(null)
    const [transcript, setTranscript] = useState([])
    const [currentEmotion, setCurrentEmotion] = useState(null)
    const [elapsed, setElapsed] = useState(0)
    const [isMuted, setIsMuted] = useState(false)
    const [aiSpeaking, setAiSpeaking] = useState(false)

    const wsRef = useRef(null)
    const audioContextRef = useRef(null)
    const mediaStreamRef = useRef(null)
    const processorRef = useRef(null)
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const transcriptEndRef = useRef(null)
    const timerRef = useRef(null)
    const captureIntervalRef = useRef(null)
    const audioQueueRef = useRef([])
    const isPlayingRef = useRef(false)
    const partialTextRef = useRef('')
    const partialUserTextRef = useRef('')

    // Auto-scroll transcript
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [transcript])

    // Timer
    useEffect(() => {
        if (status === 'active') {
            timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
        }
        return () => clearInterval(timerRef.current)
    }, [status])

    // ── Audio Playback ──────────────────────────────
    const playAudioChunk = useCallback(async (base64Data) => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 })
        }
        const ctx = audioContextRef.current

        const binaryStr = atob(base64Data)
        const bytes = new Uint8Array(binaryStr.length)
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)

        // Convert PCM 16-bit to Float32
        const pcm16 = new Int16Array(bytes.buffer)
        const float32 = new Float32Array(pcm16.length)
        for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 32768

        const audioBuffer = ctx.createBuffer(1, float32.length, 24000)
        audioBuffer.getChannelData(0).set(float32)

        audioQueueRef.current.push(audioBuffer)
        if (!isPlayingRef.current) processAudioQueue()
    }, [])

    const processAudioQueue = useCallback(() => {
        if (audioQueueRef.current.length === 0) {
            isPlayingRef.current = false
            setAiSpeaking(false)
            return
        }
        isPlayingRef.current = true
        setAiSpeaking(true)

        const ctx = audioContextRef.current
        const buffer = audioQueueRef.current.shift()
        const source = ctx.createBufferSource()
        source.buffer = buffer
        source.connect(ctx.destination)
        source.onended = () => processAudioQueue()
        source.start()
    }, [])

    // ── WebSocket Connection ────────────────────────
    useEffect(() => {
        let cancelled = false
        const ws = new WebSocket(`${WS_URL}/ws/interview/${sessionId}`)
        wsRef.current = ws

        ws.onopen = () => {
            if (cancelled) { ws.close(); return }
            setStatusMessage('Connected to server...')
        }

        ws.onmessage = (event) => {
            if (cancelled) return
            const data = JSON.parse(event.data)

            switch (data.type) {
                case 'status':
                    setStatusMessage(data.message)
                    break

                case 'ready':
                    setStatus('ready')
                    setStatusMessage('AI interviewer ready. Click Start to begin.')
                    break

                case 'audio':
                    playAudioChunk(data.data)
                    break

                case 'transcript':
                    if (data.role === 'interviewer') {
                        if (data.partial) {
                            partialTextRef.current += data.content
                            setTranscript(prev => {
                                const updated = [...prev]
                                const lastIdx = updated.length - 1
                                if (lastIdx >= 0 && updated[lastIdx].role === 'interviewer' && updated[lastIdx].partial) {
                                    updated[lastIdx] = { ...updated[lastIdx], content: partialTextRef.current }
                                } else {
                                    updated.push({ role: 'interviewer', content: partialTextRef.current, partial: true })
                                }
                                return updated
                            })
                        }
                    } else if (data.role === 'candidate') {
                        if (data.partial) {
                            partialUserTextRef.current += data.content
                            setTranscript(prev => {
                                const updated = [...prev]
                                const lastIdx = updated.length - 1
                                if (lastIdx >= 0 && updated[lastIdx].role === 'candidate' && updated[lastIdx].partial) {
                                    updated[lastIdx] = { ...updated[lastIdx], content: partialUserTextRef.current }
                                } else {
                                    updated.push({ role: 'candidate', content: partialUserTextRef.current, partial: true })
                                }
                                return updated
                            })
                        } else {
                            setTranscript(prev => [...prev, { role: data.role, content: data.content, partial: false }])
                        }
                    }
                    break

                case 'turn_complete':
                    if (data.role === 'interviewer') {
                        setTranscript(prev => {
                            const updated = [...prev]
                            const lastIdx = updated.length - 1
                            if (lastIdx >= 0 && updated[lastIdx].role === 'interviewer') {
                                updated[lastIdx] = { ...updated[lastIdx], partial: false }
                            }
                            return updated
                        })
                        partialTextRef.current = ''
                    } else if (data.role === 'candidate') {
                        setTranscript(prev => {
                            const updated = [...prev]
                            const lastIdx = updated.length - 1
                            if (lastIdx >= 0 && updated[lastIdx].role === 'candidate') {
                                updated[lastIdx] = { ...updated[lastIdx], partial: false }
                            }
                            return updated
                        })
                        partialUserTextRef.current = ''
                    }
                    break

                case 'emotion':
                    setCurrentEmotion(data.data)
                    break

                case 'error':
                    setErrorMessage(data.message)
                    setStatus('error')
                    break
            }
        }

        ws.onerror = () => {
            if (cancelled) return
            setErrorMessage('Could not connect to the server. Make sure the backend is running on port 8000.')
            setStatus('error')
        }

        ws.onclose = () => {
            if (cancelled) return
            setStatus(prev => {
                if (prev === 'ended' || prev === 'error') return prev
                return 'ended'
            })
        }

        return () => {
            cancelled = true
            ws.close()
            stopMedia()
        }
    }, [sessionId])

    // ── Start Media ─────────────────────────────────
    const isMutedRef = useRef(false)

    // Keep ref in sync with state
    useEffect(() => {
        isMutedRef.current = isMuted
    }, [isMuted])

    const startMedia = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                video: { width: 320, height: 240, facingMode: 'user' },
            })
            mediaStreamRef.current = stream

            // Video preview
            if (videoRef.current) {
                videoRef.current.srcObject = stream
            }

            // Audio processing — resample to 16kHz PCM s16le mono
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
            const nativeSampleRate = audioCtx.sampleRate
            const targetSampleRate = 16000
            const source = audioCtx.createMediaStreamSource(stream)
            const processor = audioCtx.createScriptProcessor(4096, 1, 1)

            processor.onaudioprocess = (e) => {
                if (isMutedRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
                const float32 = e.inputBuffer.getChannelData(0)

                // Resample from native rate to 16kHz
                const ratio = targetSampleRate / nativeSampleRate
                const newLength = Math.round(float32.length * ratio)
                const pcm16 = new Int16Array(newLength)
                for (let i = 0; i < newLength; i++) {
                    const srcIdx = i / ratio
                    const idx = Math.floor(srcIdx)
                    const frac = srcIdx - idx
                    const sample = idx + 1 < float32.length
                        ? float32[idx] * (1 - frac) + float32[idx + 1] * frac
                        : float32[idx]
                    pcm16[i] = Math.max(-32768, Math.min(32767, Math.round(sample * 32768)))
                }
                wsRef.current.send(pcm16.buffer)
            }

            source.connect(processor)
            // Connect to a silent destination (ScriptProcessor requires being connected
            // to output to work, but we don't want mic audio playing through speakers)
            const silentGain = audioCtx.createGain()
            silentGain.gain.value = 0
            processor.connect(silentGain)
            silentGain.connect(audioCtx.destination)
            processorRef.current = { audioCtx, source, processor }

            // Webcam frame capture every 5 seconds
            captureIntervalRef.current = setInterval(() => {
                captureFrame()
            }, 5000)

            setStatus('active')
            setStatusMessage('')
        } catch (err) {
            setStatusMessage('Failed to access microphone/camera: ' + err.message)
        }
    }

    const captureFrame = () => {
        if (!videoRef.current || !canvasRef.current || !wsRef.current) return
        const video = videoRef.current
        const canvas = canvasRef.current
        canvas.width = 320
        canvas.height = 240
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0, 320, 240)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6)
        if (wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'frame', data: dataUrl }))
        }
    }

    const stopMedia = () => {
        clearInterval(captureIntervalRef.current)
        if (processorRef.current) {
            processorRef.current.processor.disconnect()
            processorRef.current.source.disconnect()
            processorRef.current.audioCtx.close()
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(t => t.stop())
        }
    }

    const endInterview = async () => {
        stopMedia()
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'end' }))
            wsRef.current.close()
        }
        setStatus('ended')

        // Generate feedback
        try {
            await fetch(`${API}/api/feedback/${sessionId}`, { method: 'POST' })
        } catch (err) {
            console.error('Feedback generation failed:', err)
        }
        navigate(`/feedback/${sessionId}`)
    }

    const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

    const getEmotionEmoji = (emotion) => {
        const map = { happy: '😊', sad: '😢', angry: '😠', surprise: '😲', fear: '😰', disgust: '🤢', neutral: '😐' }
        return map[emotion] || '😐'
    }

    return (
        <div className="live-interview-page">
            {/* ── Top Bar ───────────────────────────── */}
            <div className="interview-topbar">
                <div className="topbar-left">
                    <span className="topbar-logo">🎯 MockMaster</span>
                    <span className={`status-indicator ${status}`}>
                        <span className="status-dot"></span>
                        {status === 'active' ? 'Live' : status === 'connecting' ? 'Connecting' : status === 'ready' ? 'Ready' : status === 'error' ? 'Error' : 'Ended'}
                    </span>
                </div>
                <div className="topbar-center">
                    <span className="timer">{formatTime(elapsed)}</span>
                </div>
                <div className="topbar-right">
                    {currentEmotion && (
                        <div className="emotion-badge">
                            <span>{getEmotionEmoji(currentEmotion.dominant_emotion)}</span>
                            <span className="emotion-label">{currentEmotion.dominant_emotion}</span>
                        </div>
                    )}
                    {status === 'active' && (
                        <button className="btn btn-danger btn-sm" onClick={endInterview}>
                            End Interview
                        </button>
                    )}
                </div>
            </div>

            {/* ── Main Content ─────────────────────── */}
            <div className="interview-main">
                {/* Status overlay */}
                {(status === 'connecting' || status === 'ready' || status === 'error') && (
                    <div className="interview-overlay">
                        <div className="overlay-content glass-card">
                            {status === 'connecting' ? (
                                <>
                                    <div className="spinner" style={{ width: 48, height: 48 }}></div>
                                    <h2>{statusMessage}</h2>
                                </>
                            ) : status === 'error' ? (
                                <>
                                    <div className="error-icon">⚠️</div>
                                    <h2>Interview Failed</h2>
                                    <p className="error-detail">{errorMessage || 'An unknown error occurred.'}</p>
                                    <div className="error-actions">
                                        <button className="btn btn-primary" onClick={() => navigate('/setup')}>
                                            ← Back to Setup
                                        </button>
                                        <button className="btn btn-secondary" onClick={() => window.location.reload()}>
                                            🔄 Retry
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="ready-icon">🎙️</div>
                                    <h2>Ready to Start</h2>
                                    <p>Your AI interviewer is ready. Make sure your microphone and camera are working.</p>
                                    <button className="btn btn-primary btn-lg" onClick={startMedia}>
                                        🚀 Start Interview
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Transcript Panel */}
                <div className="transcript-panel">
                    <div className="transcript-header">
                        <h3>💬 Transcript</h3>
                        {aiSpeaking && <span className="ai-speaking-badge">AI Speaking...</span>}
                    </div>
                    <div className="transcript-messages">
                        {transcript.length === 0 && status === 'active' && (
                            <div className="transcript-empty">
                                <p>The AI interviewer will start speaking shortly...</p>
                            </div>
                        )}
                        {transcript.map((msg, i) => (
                            <div key={i} className={`message ${msg.role}`}>
                                <div className="message-role">
                                    {msg.role === 'interviewer' ? '🤖 Interviewer' : '👤 You'}
                                </div>
                                <div className="message-content">{msg.content}</div>
                            </div>
                        ))}
                        <div ref={transcriptEndRef} />
                    </div>
                </div>

                {/* Side Panel */}
                <div className="side-panel">
                    {/* Webcam Preview */}
                    <div className="webcam-section glass-card">
                        <video ref={videoRef} autoPlay playsInline muted className="webcam-video" />
                        <canvas ref={canvasRef} hidden />
                        {currentEmotion && (
                            <div className="emotion-overlay">
                                <div className="emotion-bar">
                                    <span className="emotion-emoji">{getEmotionEmoji(currentEmotion.dominant_emotion)}</span>
                                    <div className="emotion-meters">
                                        <div className="meter">
                                            <span className="meter-label">Confidence</span>
                                            <div className="meter-bar">
                                                <div className="meter-fill confidence" style={{ width: `${currentEmotion.confidence_score * 100}%` }} />
                                            </div>
                                        </div>
                                        <div className="meter">
                                            <span className="meter-label">Stress</span>
                                            <div className="meter-bar">
                                                <div className="meter-fill stress" style={{ width: `${currentEmotion.stress_score * 100}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Audio Controls */}
                    <div className="controls-section">
                        <button
                            className={`btn btn-icon ${isMuted ? 'btn-danger' : 'btn-secondary'}`}
                            onClick={() => setIsMuted(!isMuted)}
                            title={isMuted ? 'Unmute' : 'Mute'}
                        >
                            {isMuted ? '🔇' : '🎤'}
                        </button>

                        {/* Audio visualizer placeholder */}
                        <div className="audio-viz">
                            {[...Array(12)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`viz-bar ${status === 'active' && !isMuted ? 'active' : ''}`}
                                    style={{ animationDelay: `${i * 0.08}s` }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
