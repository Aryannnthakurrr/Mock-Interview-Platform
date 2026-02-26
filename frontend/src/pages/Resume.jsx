import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ScrollReveal from '../components/ScrollReveal';
import { apiUpload, apiPost } from '../services/api';
import {
    FileText, Upload, Briefcase, ArrowRight, ArrowLeft, CheckCircle,
    Loader2, AlertCircle, Sparkles, X,
} from 'lucide-react';

export default function Resume() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0); // 0=upload, 1=job details, 2=ready
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [resumeData, setResumeData] = useState(null); // { raw_text, structured }
    const [jobTitle, setJobTitle] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [creating, setCreating] = useState(false);

    const handleFileSelect = (e) => {
        const f = e.target.files?.[0];
        if (f && f.type === 'application/pdf') {
            setFile(f);
            setUploadError('');
        } else {
            setUploadError('Please select a PDF file');
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setUploadError('');
        try {
            const data = await apiUpload('/resume/upload', file);
            setResumeData(data);
            setStep(1);
        } catch (err) {
            setUploadError(err.message || 'Failed to upload resume');
        } finally {
            setUploading(false);
        }
    };

    const handleStartInterview = async () => {
        if (!jobTitle.trim() || !jobDescription.trim()) return;
        setCreating(true);
        try {
            const session = await apiPost('/interviews', {
                session_type: 'custom',
                difficulty: 'intermediate',
                resume_text: resumeData.raw_text,
                job_description: jobDescription,
                job_title: jobTitle,
            });
            navigate(`/interview/${session.id}`);
        } catch (err) {
            setUploadError(err.message || 'Failed to create interview session');
            setCreating(false);
        }
    };

    const inputClass = 'w-full px-4 py-3 rounded-xl text-sm outline-none transition-all bg-black-200 text-white-50 placeholder-blue-50/40 border border-blue-100/10 focus:border-blue-50/30';

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 md:px-8">
            <div className="vignette" />
            <div className="max-w-3xl mx-auto relative z-10">
                <ScrollReveal>
                    <div className="text-center mb-10">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-blue-50 bg-black-200 mb-4">
                            <FileText className="w-3 h-3" /> Custom Interview
                        </span>
                        <h1 className="text-4xl font-bold mb-4 text-white-50">
                            Upload Your <span className="gradient-text">Resume</span>
                        </h1>
                        <p className="max-w-xl mx-auto text-blue-50/60">
                            Upload your resume, enter a job description, and start a personalized AI voice interview.
                        </p>
                    </div>
                </ScrollReveal>

                {/* Step indicator */}
                <ScrollReveal delay={0.1}>
                    <div className="flex items-center justify-center gap-2 mb-8">
                        {['Upload Resume', 'Job Details', 'Start Interview'].map((s, i) => (
                            <div key={s} className="flex items-center">
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${step === i ? 'bg-white-50 text-black-100'
                                        : step > i ? 'bg-black-200 text-blue-50' : 'bg-black-200/50 text-blue-50/40'
                                    }`}>
                                    {step > i ? <CheckCircle className="w-4 h-4" /> : null}
                                    <span className="hidden sm:inline">{s}</span>
                                    <span className="sm:hidden">{i + 1}</span>
                                </div>
                                {i < 2 && <div className="w-8 h-px mx-1 bg-blue-100/20" />}
                            </div>
                        ))}
                    </div>
                </ScrollReveal>

                <AnimatePresence mode="wait">
                    {/* Step 0: Upload */}
                    {step === 0 && (
                        <motion.div key="upload" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <div className="glass-card p-8">
                                <div className="border-2 border-dashed border-blue-100/20 rounded-2xl p-12 text-center hover:border-blue-50/30 transition-all">
                                    <Upload className="w-12 h-12 mx-auto mb-4 text-blue-50/40" />
                                    <h3 className="text-lg font-bold mb-2 text-white-50">Upload your Resume</h3>
                                    <p className="text-sm text-blue-50/50 mb-6">PDF format, max 10MB</p>

                                    {file ? (
                                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black-200 text-white-50 mb-4">
                                            <FileText className="w-4 h-4 text-blue-50" />
                                            <span className="text-sm">{file.name}</span>
                                            <button onClick={() => { setFile(null); setUploadError(''); }} className="text-blue-50/40 hover:text-red-400">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="glow-btn !py-3 !px-6 !text-sm cursor-pointer inline-block">
                                            Choose PDF File
                                            <input type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />
                                        </label>
                                    )}
                                </div>

                                {uploadError && (
                                    <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" /> {uploadError}
                                    </div>
                                )}

                                <div className="mt-6 flex justify-end">
                                    <button onClick={handleUpload} disabled={!file || uploading}
                                        className={`glow-btn !py-3 !px-6 !text-sm flex items-center gap-2 ${(!file || uploading) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Parsing...</> : <>Upload & Parse <ArrowRight className="w-4 h-4" /></>}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 1: Job Details */}
                    {step === 1 && (
                        <motion.div key="job" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <div className="glass-card p-8">
                                {/* Parsed resume summary */}
                                {resumeData?.structured && (
                                    <div className="mb-6 p-4 rounded-xl bg-black-200/50 border border-blue-100/10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sparkles className="w-4 h-4 text-blue-50" />
                                            <span className="text-sm font-medium text-white-50">Parsed Resume</span>
                                        </div>
                                        <div className="text-xs text-blue-50/60 space-y-1">
                                            {resumeData.structured.name && <p><strong className="text-blue-50">Name:</strong> {resumeData.structured.name}</p>}
                                            {resumeData.structured.skills?.length > 0 && (
                                                <p><strong className="text-blue-50">Skills:</strong> {resumeData.structured.skills.slice(0, 8).join(', ')}</p>
                                            )}
                                            {resumeData.structured.experience?.length > 0 && (
                                                <p><strong className="text-blue-50">Experience:</strong> {resumeData.structured.experience.length} entries</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <h3 className="text-lg font-bold mb-4 text-white-50 flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-blue-50" /> Job Details
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-blue-50">Job Title</label>
                                        <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                                            placeholder="e.g. Software Engineer" className={inputClass} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-blue-50">Job Description</label>
                                        <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
                                            placeholder="Paste the full job description here..." rows={6} className={inputClass} />
                                    </div>
                                </div>

                                {uploadError && (
                                    <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" /> {uploadError}
                                    </div>
                                )}

                                <div className="mt-6 flex items-center justify-between">
                                    <button onClick={() => setStep(0)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-black-200 text-blue-50 hover:text-white-50 transition-all">
                                        <ArrowLeft className="w-4 h-4" /> Back
                                    </button>
                                    <button onClick={handleStartInterview} disabled={!jobTitle.trim() || !jobDescription.trim() || creating}
                                        className={`glow-btn !py-3 !px-6 !text-sm flex items-center gap-2 ${(!jobTitle.trim() || !jobDescription.trim() || creating) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <>Start Interview <ArrowRight className="w-4 h-4" /></>}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
