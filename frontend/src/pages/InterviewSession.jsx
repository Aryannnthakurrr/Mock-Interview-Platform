import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiGet, apiPost, getWsUrl } from '../services/api';
import {
  Mic, MicOff, Phone, Clock, MessageSquare, Activity, AlertCircle,
  Loader2, Volume2, VolumeX, Brain, TrendingUp,
} from 'lucide-react';

export default function InterviewSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState('connecting'); // connecting, ready, active, ended, error
  const [statusMsg, setStatusMsg] = useState('Connecting to AI interviewer...');
  const [transcript, setTranscript] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [emotions, setEmotions] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [error, setError] = useState('');

  const wsRef = useRef(null);
  const audioCtxRef = useRef(null);
  const streamRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  const timerRef = useRef(null);
  const transcriptEndRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);

  // Auto-scroll transcript
  useEffect(() => { transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [transcript]);

  // Timer
  useEffect(() => {
    if (status === 'active') {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [status]);

  // Connect WebSocket
  useEffect(() => {
    const ws = new WebSocket(getWsUrl(sessionId));
    wsRef.current = ws;

    ws.onopen = () => setStatusMsg('Connected, waiting for AI...');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWsMessage(data);
    };

    ws.onerror = () => {
      setError('WebSocket connection failed');
      setStatus('error');
    };

    ws.onclose = () => {
      if (status === 'active') {
        setStatus('ended');
      }
    };

    return () => {
      ws.close();
      stopMicrophone();
      clearInterval(timerRef.current);
    };
  }, [sessionId]);

  const handleWsMessage = useCallback((data) => {
    switch (data.type) {
      case 'status':
        setStatusMsg(data.message);
        break;
      case 'ready':
        setStatus('active');
        startMicrophone();
        break;
      case 'audio':
        queueAudio(data.data);
        break;
      case 'transcript':
        setTranscript((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (data.partial && last && last.role === data.role && last.partial) {
            last.content += data.content;
          } else {
            updated.push({ role: data.role, content: data.content, partial: data.partial });
          }
          return updated;
        });
        break;
      case 'turn_complete':
        setTranscript((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === data.role) last.partial = false;
          return updated;
        });
        break;
      case 'emotion':
        setEmotions(data.data);
        break;
      case 'error':
        setError(data.message);
        if (status !== 'ended') setStatus('error');
        break;
    }
  }, [status]);

  // Audio playback
  const queueAudio = (base64Data) => {
    audioQueueRef.current.push(base64Data);
    if (!isPlayingRef.current) playNextAudio();
  };

  const playNextAudio = async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      // Notify server that playback is complete
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'playback_complete' }));
      }
      return;
    }
    isPlayingRef.current = true;
    const b64 = audioQueueRef.current.shift();
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext({ sampleRate: 24000 });
      const ctx = audioCtxRef.current;
      const raw = atob(b64);
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      // 16-bit PCM mono
      const samples = new Int16Array(bytes.buffer);
      const audioBuffer = ctx.createBuffer(1, samples.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) channelData[i] = samples[i] / 32768;
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => playNextAudio();
      source.start();
    } catch (e) {
      console.error('Audio playback error:', e);
      playNextAudio();
    }
  };

  // Microphone
  const startMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
      streamRef.current = stream;
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (isMuted || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const buffer = new ArrayBuffer(inputData.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
        wsRef.current.send(buffer);
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);
      sourceRef.current = source;
      processorRef.current = processor;
    } catch (e) {
      setError('Microphone access denied');
    }
  };

  const stopMicrophone = () => {
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const endInterview = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'end' }));
    }
    stopMicrophone();
    setStatus('ended');
  };

  const generateFeedback = async () => {
    setLoadingFeedback(true);
    try {
      const fb = await apiPost(`/feedback/${sessionId}`, {});
      setFeedback(fb);
    } catch (e) {
      setError('Failed to generate feedback');
    } finally {
      setLoadingFeedback(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ===== RENDER =====
  if (status === 'connecting') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="vignette" />
        <div className="text-center relative z-10">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-50" />
          <p className="text-lg font-medium text-white-50">{statusMsg}</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="vignette" />
        <div className="text-center relative z-10 glass-card p-8 max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <p className="text-lg font-medium mb-4 text-white-50">Connection Error</p>
          <p className="text-sm text-blue-50/60 mb-6">{error}</p>
          <button onClick={() => navigate('/interview')} className="glow-btn !py-3 !px-6 !text-sm">
            Back to Topics
          </button>
        </div>
      </div>
    );
  }

  // Feedback view
  if (status === 'ended' && feedback) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 md:px-8">
        <div className="vignette" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-white-50">Interview <span className="gradient-text">Feedback</span></h1>
            <p className="text-blue-50/60">{feedback.summary}</p>
          </div>

          {/* Score */}
          <div className="glass-card p-8 text-center mb-8">
            <div className="text-6xl font-black text-white-50 mb-2">{feedback.overall_score}<span className="text-2xl text-blue-50">/100</span></div>
            <p className="text-blue-50/60">Overall Score</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Strengths */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-4 text-green-400 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Strengths
              </h3>
              <div className="space-y-3">
                {feedback.strengths?.map((s, i) => (
                  <div key={i} className="p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                    <div className="font-medium text-sm text-white-50">{s.area}</div>
                    <div className="text-xs text-blue-50/60 mt-1">{s.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weaknesses */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-4 text-red-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Areas to Improve
              </h3>
              <div className="space-y-3">
                {feedback.weaknesses?.map((w, i) => (
                  <div key={i} className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                    <div className="font-medium text-sm text-white-50">{w.area}</div>
                    <div className="text-xs text-blue-50/60 mt-1">{w.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Suggestions */}
          {feedback.suggestions?.length > 0 && (
            <div className="glass-card p-6 mb-8">
              <h3 className="text-lg font-bold mb-4 text-white-50">💡 Suggestions</h3>
              <ul className="space-y-2">
                {feedback.suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-blue-50/70 flex items-start gap-2">
                    <span className="text-blue-50 mt-0.5">•</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-center flex gap-4 justify-center">
            <button onClick={() => navigate('/dashboard')} className="px-6 py-3 rounded-xl bg-black-200 text-blue-50 hover:text-white-50 font-medium transition-all">
              Dashboard
            </button>
            <button onClick={() => navigate('/interview')} className="glow-btn !py-3 !px-6 !text-sm">
              New Interview
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active interview or ended (waiting for feedback)
  return (
    <div className="min-h-screen pt-24 pb-6 px-4 md:px-8">
      <div className="vignette" />
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
            <span className="font-medium text-white-50">{status === 'active' ? 'Live Interview' : 'Interview Ended'}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black-200 text-blue-50">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-mono">{formatTime(elapsed)}</span>
            </div>
            {emotions && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black-200">
                <Activity className="w-4 h-4 text-blue-50" />
                <span className="text-xs text-blue-50">{emotions.dominant_emotion}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transcript */}
          <div className="lg:col-span-2 glass-card flex flex-col" style={{ height: 'calc(100vh - 14rem)' }}>
            <div className="p-4 border-b border-blue-100/10 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-50" />
              <span className="text-sm font-medium text-white-50">Transcript</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {transcript.map((entry, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${entry.role === 'candidate' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${entry.role === 'interviewer' ? 'bg-black-200' : 'bg-blue-100'}`}>
                    {entry.role === 'interviewer' ? <Brain className="w-4 h-4 text-blue-50" /> : <Mic className="w-4 h-4 text-white-50" />}
                  </div>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${entry.role === 'candidate'
                      ? 'bg-black-200 text-white-50 rounded-tr-sm'
                      : 'bg-black-50/50 text-blue-50 rounded-tl-sm border border-blue-100/10'
                    }`}>
                    {entry.content}
                    {entry.partial && <span className="inline-block w-1.5 h-4 ml-1 bg-blue-50 animate-pulse rounded-full" />}
                  </div>
                </motion.div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </div>

          {/* Controls Panel */}
          <div className="space-y-4">
            {/* Mic Control */}
            <div className="glass-card p-6 text-center">
              <p className="text-xs text-blue-50/50 mb-4">{status === 'active' ? 'Microphone' : 'Session ended'}</p>
              {status === 'active' ? (
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setIsMuted(!isMuted)}
                  className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center transition-all ${isMuted ? 'bg-red-500/20 text-red-400 border-2 border-red-500/30' : 'bg-black-200 text-blue-50 border-2 border-blue-100/20 animate-pulse-glow'
                    }`}>
                  {isMuted ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </motion.button>
              ) : (
                <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-black-200 text-blue-50/30">
                  <MicOff className="w-8 h-8" />
                </div>
              )}
              <p className="text-xs mt-3 text-blue-50/40">
                {status === 'active' ? (isMuted ? 'Click to unmute' : 'Speaking...') : 'Interview complete'}
              </p>
            </div>

            {/* Emotion indicators */}
            {emotions && (
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-blue-50" />
                  <span className="text-xs font-medium text-white-50">Emotion Analysis</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-blue-50/50">Confidence</span>
                      <span className="text-blue-50">{Math.round(emotions.confidence_score * 100)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-blue-100/20">
                      <div className="h-full rounded-full bg-blue-50 transition-all" style={{ width: `${emotions.confidence_score * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-blue-50/50">Stress</span>
                      <span className="text-blue-50">{Math.round(emotions.stress_score * 100)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-blue-100/20">
                      <div className="h-full rounded-full bg-red-400/60 transition-all" style={{ width: `${emotions.stress_score * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* End / Feedback buttons */}
            {status === 'active' && (
              <button onClick={endInterview}
                className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-medium hover:bg-red-500/20 transition-all flex items-center justify-center gap-2">
                <Phone className="w-4 h-4 rotate-[135deg]" /> End Interview
              </button>
            )}

            {status === 'ended' && !feedback && (
              <button onClick={generateFeedback} disabled={loadingFeedback}
                className="w-full glow-btn !py-3 flex items-center justify-center gap-2">
                {loadingFeedback ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <>Get AI Feedback</>}
              </button>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
