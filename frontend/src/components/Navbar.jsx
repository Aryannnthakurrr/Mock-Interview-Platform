import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
    const location = useLocation()
    const isInterview = location.pathname.startsWith('/interview/')

    // Hide navbar during live interview for full-screen experience
    if (isInterview) return null

    return (
        <nav className="navbar">
            <div className="navbar-inner container">
                <Link to="/" className="navbar-brand">
                    <span className="brand-icon">🎯</span>
                    <span className="brand-text">MockMaster</span>
                    <span className="brand-badge">AI</span>
                </Link>
                <div className="navbar-links">
                    <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                        Dashboard
                    </Link>
                    <Link to="/setup" className="btn btn-primary btn-sm nav-cta">
                        Start Interview
                    </Link>
                </div>
            </div>
        </nav>
    )
}
