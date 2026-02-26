import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './InterviewSetup.css'

const API = 'http://localhost:8000'

const JD_TEMPLATES = [
    {
        id: 'frontend',
        icon: '🖥️',
        title: 'Frontend Developer',
        description: `We are looking for a skilled Frontend Developer to build responsive, performant web applications.

Responsibilities:
• Develop and maintain user-facing features using React, HTML, CSS, and JavaScript
• Collaborate with designers and backend engineers to deliver seamless experiences
• Optimize applications for speed, scalability, and cross-browser compatibility
• Write clean, testable, and well-documented code
• Participate in code reviews and contribute to frontend architecture decisions

Requirements:
• 2+ years of experience with React or similar frameworks (Vue, Angular)
• Strong proficiency in JavaScript/TypeScript, HTML5, and CSS3
• Experience with state management (Redux, Zustand, Context API)
• Familiarity with RESTful APIs, Git, and CI/CD pipelines
• Understanding of web accessibility (WCAG) and responsive design principles`,
    },
    {
        id: 'backend',
        icon: '⚙️',
        title: 'Backend Engineer',
        description: `We are seeking a Backend Engineer to design and build scalable server-side systems and APIs.

Responsibilities:
• Design, develop, and maintain RESTful and GraphQL APIs
• Build and optimize database schemas (SQL and NoSQL)
• Implement authentication, authorization, and security best practices
• Write unit and integration tests to ensure reliability
• Monitor, troubleshoot, and improve system performance

Requirements:
• 2+ years backend development experience (Python, Node.js, Java, or Go)
• Strong knowledge of relational databases (PostgreSQL, MySQL) and caching (Redis)
• Experience with cloud platforms (AWS, GCP, or Azure)
• Familiarity with containerization (Docker) and orchestration (Kubernetes)
• Understanding of microservices architecture and event-driven systems`,
    },
    {
        id: 'fullstack',
        icon: '🔗',
        title: 'Full Stack Developer',
        description: `Join our team as a Full Stack Developer to work across the entire application stack.

Responsibilities:
• Build end-to-end features from database to UI
• Develop and maintain both frontend (React/Next.js) and backend (Node.js/Python) code
• Design database schemas and write efficient queries
• Deploy and manage applications using cloud services
• Collaborate with product, design, and QA teams

Requirements:
• 3+ years of full stack development experience
• Proficiency in JavaScript/TypeScript, React, and Node.js or Python
• Experience with SQL and NoSQL databases
• Familiarity with cloud services (AWS/GCP), Docker, and CI/CD
• Strong problem-solving skills and attention to code quality`,
    },
    {
        id: 'data-scientist',
        icon: '📊',
        title: 'Data Scientist',
        description: `We are hiring a Data Scientist to derive actionable insights from complex datasets.

Responsibilities:
• Analyze large datasets to identify trends, patterns, and opportunities
• Build and deploy machine learning models for prediction and classification
• Design and run A/B tests and statistical experiments
• Create dashboards and reports for stakeholders
• Collaborate with engineering teams to productionize ML models

Requirements:
• 2+ years of experience in data science or machine learning
• Strong proficiency in Python (pandas, scikit-learn, TensorFlow/PyTorch)
• Solid foundation in statistics, probability, and linear algebra
• Experience with SQL and data visualization tools (Matplotlib, Tableau)
• Familiarity with cloud ML platforms and MLOps practices`,
    },
    {
        id: 'devops',
        icon: '🚀',
        title: 'DevOps Engineer',
        description: `We are looking for a DevOps Engineer to build and maintain our cloud infrastructure and CI/CD pipelines.

Responsibilities:
• Design and manage cloud infrastructure using IaC (Terraform, CloudFormation)
• Build and maintain CI/CD pipelines for automated testing and deployment
• Monitor system health, set up alerting, and respond to incidents
• Implement security best practices and manage access controls
• Optimize costs and performance of cloud resources

Requirements:
• 2+ years in DevOps, SRE, or infrastructure engineering
• Proficiency with AWS, GCP, or Azure cloud services
• Experience with Docker, Kubernetes, and container orchestration
• Strong scripting skills (Bash, Python)
• Knowledge of monitoring tools (Prometheus, Grafana, Datadog)`,
    },
    {
        id: 'product-manager',
        icon: '📋',
        title: 'Product Manager',
        description: `We are seeking a Product Manager to drive product strategy and deliver impactful features.

Responsibilities:
• Define product vision, strategy, and roadmap aligned with business goals
• Gather and prioritize requirements from users, stakeholders, and data
• Write clear product specs, user stories, and acceptance criteria
• Work closely with engineering, design, and marketing teams
• Analyze product metrics and iterate based on user feedback

Requirements:
• 3+ years of product management experience in tech
• Strong analytical skills with experience using data to drive decisions
• Excellent written and verbal communication skills
• Familiarity with Agile/Scrum methodologies
• Experience with product analytics tools (Amplitude, Mixpanel, Google Analytics)`,
    },
]

export default function InterviewSetup() {
    const navigate = useNavigate()
    const [mode, setMode] = useState('topic') // 'topic' or 'custom'
    const [topics, setTopics] = useState([])
    const [selectedTopic, setSelectedTopic] = useState(null)
    const [difficulty, setDifficulty] = useState('intermediate')

    // Custom interview state
    const [resumeFile, setResumeFile] = useState(null)
    const [resumeText, setResumeText] = useState('')
    const [resumeStructured, setResumeStructured] = useState(null)
    const [jobDescription, setJobDescription] = useState('')
    const [jobTitle, setJobTitle] = useState('')
    const [uploading, setUploading] = useState(false)
    const [starting, setStarting] = useState(false)
    const [selectedTemplate, setSelectedTemplate] = useState(null)

    const fileInputRef = useRef(null)

    useEffect(() => {
        fetch(`${API}/api/topics`)
            .then(r => r.json())
            .then(setTopics)
            .catch(console.error)
    }, [])

    const handleResumeUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setResumeFile(file)
        setUploading(true)

        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch(`${API}/api/resume/upload`, { method: 'POST', body: formData })
            if (!res.ok) throw new Error('Upload failed')
            const data = await res.json()
            setResumeText(data.raw_text)
            setResumeStructured(data.structured)
        } catch (err) {
            alert('Failed to parse resume: ' + err.message)
        } finally {
            setUploading(false)
        }
    }

    const startInterview = async () => {
        setStarting(true)
        try {
            const body = {
                session_type: mode,
                difficulty,
                ...(mode === 'topic'
                    ? { topic_id: selectedTopic }
                    : {
                        resume_text: resumeText,
                        job_description: jobDescription,
                        job_title: jobTitle,
                    }),
            }

            const res = await fetch(`${API}/api/interviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            if (!res.ok) throw new Error('Failed to create session')
            const session = await res.json()

            // If custom, save structured resume
            if (mode === 'custom' && resumeStructured) {
                await fetch(`${API}/api/interviews/${session.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ resume_structured: resumeStructured }),
                })
            }

            navigate(`/interview/${session.id}`)
        } catch (err) {
            alert('Error: ' + err.message)
        } finally {
            setStarting(false)
        }
    }

    const canStart = mode === 'topic'
        ? selectedTopic !== null
        : resumeText && jobDescription

    // Group topics by category
    const grouped = topics.reduce((acc, t) => {
        if (!acc[t.category]) acc[t.category] = []
        acc[t.category].push(t)
        return acc
    }, {})

    return (
        <div className="page-wrapper setup-page container">
            <div className="setup-header animate-fadeIn">
                <h1>Set Up Your Interview</h1>
                <p className="text-secondary">Choose how you want to practice</p>
            </div>

            {/* ── Mode Toggle ───────────────────────── */}
            <div className="mode-toggle animate-fadeInUp stagger-1">
                <button
                    className={`mode-btn ${mode === 'topic' ? 'active' : ''}`}
                    onClick={() => setMode('topic')}
                >
                    <span className="mode-icon">📝</span>
                    <span className="mode-label">Quick Topic</span>
                    <span className="mode-desc">Practice specific subjects</span>
                </button>
                <button
                    className={`mode-btn ${mode === 'custom' ? 'active' : ''}`}
                    onClick={() => setMode('custom')}
                >
                    <span className="mode-icon">📄</span>
                    <span className="mode-label">Custom Interview</span>
                    <span className="mode-desc">Resume + Job Description</span>
                </button>
            </div>

            {/* ── Topic Selection ───────────────────── */}
            {mode === 'topic' && (
                <div className="topic-section animate-fadeInUp">
                    {Object.entries(grouped).map(([category, catTopics]) => (
                        <div key={category} className="topic-category">
                            <h3 className="category-title">{category}</h3>
                            <div className="topics-grid">
                                {catTopics.map(topic => (
                                    <button
                                        key={topic.id}
                                        className={`topic-card glass-card ${selectedTopic === topic.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedTopic(topic.id)}
                                    >
                                        <div className="topic-card-icon">{topic.icon}</div>
                                        <div className="topic-card-name">{topic.name}</div>
                                        <div className="topic-card-desc">{topic.description.slice(0, 80)}...</div>
                                        <div className="topic-tags">
                                            {topic.subtopics.slice(0, 3).map(s => (
                                                <span key={s} className="badge badge-blue">{s}</span>
                                            ))}
                                            {topic.subtopics.length > 3 && (
                                                <span className="badge badge-purple">+{topic.subtopics.length - 3}</span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Custom Interview ──────────────────── */}
            {mode === 'custom' && (
                <div className="custom-section animate-fadeInUp">
                    <div className="custom-grid">
                        {/* Resume Upload */}
                        <div className="upload-area glass-card">
                            <h3>📄 Upload Resume</h3>
                            <p className="text-secondary">Upload your PDF resume for personalized questions</p>
                            <div
                                className={`dropzone ${resumeFile ? 'has-file' : ''}`}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleResumeUpload}
                                    hidden
                                />
                                {uploading ? (
                                    <div className="spinner"></div>
                                ) : resumeFile ? (
                                    <>
                                        <span className="dropzone-icon">✅</span>
                                        <span className="dropzone-text">{resumeFile.name}</span>
                                        <span className="dropzone-hint">Click to replace</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="dropzone-icon">📎</span>
                                        <span className="dropzone-text">Click to upload PDF</span>
                                        <span className="dropzone-hint">Max 10MB</span>
                                    </>
                                )}
                            </div>
                            {resumeStructured && (
                                <div className="resume-preview">
                                    <div className="preview-label">Parsed:</div>
                                    <div className="preview-name">{resumeStructured.name}</div>
                                    {resumeStructured.skills?.length > 0 && (
                                        <div className="preview-skills">
                                            {resumeStructured.skills.slice(0, 6).map(s => (
                                                <span key={s} className="badge badge-blue">{s}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Job Description */}
                        <div className="jd-area glass-card">
                            <h3>💼 Job Details</h3>
                            <p className="text-secondary">Pick a template or write your own</p>

                            {/* JD Template Selector */}
                            <div className="jd-templates">
                                {JD_TEMPLATES.map(t => (
                                    <button
                                        key={t.id}
                                        className={`jd-template-chip ${selectedTemplate === t.id ? 'active' : ''}`}
                                        onClick={() => {
                                            if (selectedTemplate === t.id) {
                                                setSelectedTemplate(null)
                                                setJobTitle('')
                                                setJobDescription('')
                                            } else {
                                                setSelectedTemplate(t.id)
                                                setJobTitle(t.title)
                                                setJobDescription(t.description)
                                            }
                                        }}
                                    >
                                        <span className="chip-icon">{t.icon}</span>
                                        <span className="chip-label">{t.title}</span>
                                    </button>
                                ))}
                            </div>

                            <input
                                className="input"
                                placeholder="Job Title (e.g., Senior Software Engineer)"
                                value={jobTitle}
                                onChange={e => { setJobTitle(e.target.value); setSelectedTemplate(null) }}
                            />
                            <textarea
                                className="textarea"
                                placeholder="Paste the job description here... (responsibilities, requirements, etc.)"
                                value={jobDescription}
                                onChange={e => { setJobDescription(e.target.value); setSelectedTemplate(null) }}
                                rows={8}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ── Difficulty + Start ────────────────── */}
            <div className="start-section animate-fadeInUp">
                <div className="difficulty-selector">
                    <span className="diff-label">Difficulty:</span>
                    {['beginner', 'intermediate', 'advanced'].map(d => (
                        <button
                            key={d}
                            className={`diff-btn ${difficulty === d ? 'active' : ''}`}
                            onClick={() => setDifficulty(d)}
                        >
                            {d === 'beginner' ? '🟢' : d === 'intermediate' ? '🟡' : '🔴'} {d}
                        </button>
                    ))}
                </div>
                <button
                    className="btn btn-primary btn-lg start-btn"
                    disabled={!canStart || starting}
                    onClick={startInterview}
                >
                    {starting ? (
                        <><div className="spinner" style={{ width: 20, height: 20 }}></div> Creating...</>
                    ) : (
                        <>🎙️ Start Interview</>
                    )}
                </button>
            </div>
        </div>
    )
}
