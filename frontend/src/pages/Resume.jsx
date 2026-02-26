import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ScrollReveal from '../components/ScrollReveal';
import { apiUpload, apiPost } from '../services/api';
import {
    FileText, Upload, Briefcase, ArrowRight, ArrowLeft, CheckCircle,
    Loader2, AlertCircle, Sparkles, X, LayoutTemplate,
} from 'lucide-react';

const JOB_TEMPLATES = [
    {
        title: 'Software Engineer',
        icon: '💻',
        description: `We are looking for a Software Engineer to design, develop, and maintain scalable software solutions. You will collaborate with cross-functional teams to deliver high-quality products.

Key Responsibilities:
• Design, develop, test, and maintain software applications
• Write clean, efficient, and well-documented code
• Participate in code reviews and mentor junior developers
• Debug and resolve software defects and performance bottlenecks
• Collaborate with product managers and designers to define features

Requirements:
• Bachelor's degree in Computer Science or related field
• 2+ years of experience in software development
• Proficiency in Python, Java, or JavaScript
• Experience with REST APIs, databases (SQL/NoSQL), and version control (Git)
• Strong problem-solving and communication skills`,
    },
    {
        title: 'Frontend Developer',
        icon: '🎨',
        description: `We are seeking a Frontend Developer to build responsive, accessible, and visually compelling web applications. You will work closely with UX/UI designers and backend engineers.

Key Responsibilities:
• Build pixel-perfect, responsive UI components using React/Next.js
• Implement state management using Redux, Zustand, or Context API
• Optimize web applications for performance and SEO
• Write unit and integration tests using Jest and React Testing Library
• Collaborate with designers to translate Figma mockups into production code

Requirements:
• 2+ years of experience with React.js and modern JavaScript (ES6+)
• Proficiency in HTML5, CSS3, and responsive design
• Experience with TypeScript, Tailwind CSS, and component libraries
• Familiarity with REST APIs, GraphQL, and WebSocket
• Understanding of web accessibility (WCAG) standards`,
    },
    {
        title: 'Backend Developer',
        icon: '⚙️',
        description: `We are hiring a Backend Developer to architect and build robust server-side applications and APIs that scale. You will design data models, build microservices, and ensure system reliability.

Key Responsibilities:
• Design and implement RESTful APIs and microservices
• Build and optimize database schemas and queries
• Implement authentication, authorization, and security best practices
• Set up CI/CD pipelines and automated testing
• Monitor application performance and troubleshoot production issues

Requirements:
• 2+ years of experience with Node.js, Python (FastAPI/Django), or Java (Spring Boot)
• Strong experience with SQL (PostgreSQL/MySQL) and NoSQL (MongoDB/Redis)
• Knowledge of Docker, Kubernetes, and cloud services (AWS/GCP/Azure)
• Understanding of system design, caching strategies, and message queues
• Familiarity with testing frameworks and API documentation tools (Swagger)`,
    },
    {
        title: 'Data Scientist',
        icon: '📊',
        description: `We are looking for a Data Scientist to extract insights from complex datasets and build predictive models that drive business decisions. You will work at the intersection of statistics, engineering, and domain expertise.

Key Responsibilities:
• Analyze large datasets to uncover trends and actionable insights
• Build, train, and deploy machine learning models
• Design and run A/B tests and statistical experiments
• Create data visualizations and dashboards for stakeholders
• Collaborate with engineering teams to integrate models into production

Requirements:
• Master's degree in Statistics, Computer Science, or related quantitative field
• Proficiency in Python (Pandas, NumPy, Scikit-learn, TensorFlow/PyTorch)
• Experience with SQL, data pipelines, and big data tools (Spark, Airflow)
• Strong understanding of statistics, probability, and experimental design
• Excellent communication skills for presenting findings to non-technical audiences`,
    },
    {
        title: 'DevOps Engineer',
        icon: '🚀',
        description: `We are hiring a DevOps Engineer to streamline our development and deployment processes. You will build infrastructure-as-code, automate CI/CD pipelines, and ensure high availability of our systems.

Key Responsibilities:
• Design and maintain CI/CD pipelines for automated testing and deployment
• Manage cloud infrastructure using Terraform, CloudFormation, or Pulumi
• Containerize applications with Docker and orchestrate using Kubernetes
• Implement monitoring, logging, and alerting (Prometheus, Grafana, ELK)
• Ensure security best practices across infrastructure and deployments

Requirements:
• 2+ years of experience in DevOps or SRE roles
• Strong experience with AWS, GCP, or Azure cloud platforms
• Proficiency in scripting (Bash, Python) and IaC tools (Terraform)
• Experience with Docker, Kubernetes, and container orchestration
• Knowledge of networking, DNS, load balancing, and SSL/TLS`,
    },
    {
        title: 'Product Manager',
        icon: '📋',
        description: `We are looking for a Product Manager to lead the product development lifecycle. You will define product strategy, prioritize features, and work with engineering and design teams to ship impactful products.

Key Responsibilities:
• Define product vision, strategy, and roadmap based on user research and market analysis
• Prioritize features using data-driven frameworks (RICE, MoSCoW, Impact/Effort)
• Write clear product requirements, user stories, and acceptance criteria
• Collaborate with engineering, design, and QA teams throughout the development cycle
• Track KPIs, analyze product metrics, and iterate based on user feedback

Requirements:
• 2+ years of experience in product management at a tech company
• Strong analytical skills with experience using analytics tools (Mixpanel, Amplitude)
• Excellent communication and stakeholder management skills
• Understanding of Agile/Scrum methodologies
• Technical background or comfort working closely with engineering teams`,
    },
];

const inputClass = 'w-full px-4 py-3 rounded-xl text-sm outline-none transition-all bg-black-200 text-white-50 placeholder-blue-50/40 border border-blue-100/10 focus:border-blue-50/30';

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
    const [showTemplates, setShowTemplates] = useState(false);

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

    const handleSelectTemplate = (template) => {
        setJobTitle(template.title);
        setJobDescription(template.description);
        setShowTemplates(false);
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
                            Upload your resume, pick a job template or enter your own, and start a personalized AI voice interview.
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

                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-white-50 flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-blue-50" /> Job Details
                                    </h3>
                                    <button
                                        onClick={() => setShowTemplates(!showTemplates)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${showTemplates
                                            ? 'bg-white-50 text-black-100'
                                            : 'bg-black-200 text-blue-50 hover:text-white-50 hover:bg-blue-100/30'
                                            }`}
                                    >
                                        <LayoutTemplate className="w-4 h-4" />
                                        {showTemplates ? 'Hide Templates' : 'Use Template'}
                                    </button>
                                </div>

                                {/* Job Templates */}
                                <AnimatePresence>
                                    {showTemplates && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden mb-6"
                                        >
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-black-200/30 border border-blue-100/10">
                                                <p className="col-span-full text-xs text-blue-50/50 mb-1">
                                                    Click a template to auto-fill job title and description
                                                </p>
                                                {JOB_TEMPLATES.map((template) => (
                                                    <motion.button
                                                        key={template.title}
                                                        whileHover={{ y: -2, scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => handleSelectTemplate(template)}
                                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all cursor-pointer ${jobTitle === template.title
                                                            ? 'bg-white-50/10 border border-blue-50/30 shadow-lg shadow-blue-50/5'
                                                            : 'bg-black-200/50 border border-blue-100/10 hover:border-blue-50/20'
                                                            }`}
                                                    >
                                                        <span className="text-2xl">{template.icon}</span>
                                                        <span className="text-xs font-medium text-white-50 text-center leading-tight">{template.title}</span>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-blue-50">Job Title</label>
                                        <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                                            placeholder="e.g. Software Engineer" className={inputClass} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-blue-50">Job Description</label>
                                        <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
                                            placeholder="Paste the full job description here, or use a template above..." rows={8} className={inputClass + ' resize-y'} />
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
