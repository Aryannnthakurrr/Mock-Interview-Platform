import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import InterviewSetup from './pages/InterviewSetup'
import LiveInterview from './pages/LiveInterview'
import FeedbackReport from './pages/FeedbackReport'

function App() {
    return (
        <>
            <Navbar />
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/setup" element={<InterviewSetup />} />
                <Route path="/interview/:sessionId" element={<LiveInterview />} />
                <Route path="/feedback/:sessionId" element={<FeedbackReport />} />
            </Routes>
        </>
    )
}

export default App
