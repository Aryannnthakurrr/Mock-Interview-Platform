import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useThemeStore } from './store/themeStore';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Learning from './pages/Learning';
import Chat from './pages/Chat';
import Interview from './pages/Interview';
import InterviewSession from './pages/InterviewSession';
import Resume from './pages/Resume';
import FeedbackReport from './pages/FeedbackReport';

function App() {
    const { initTheme } = useThemeStore();

    useEffect(() => {
        initTheme();
    }, [initTheme]);

    return (
        <>
            <Navbar />
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/learning" element={<Learning />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/interview" element={<Interview />} />
                <Route path="/interview/:sessionId" element={<InterviewSession />} />
                <Route path="/resume" element={<Resume />} />
                <Route path="/feedback/:sessionId" element={<FeedbackReport />} />
            </Routes>
        </>
    );
}

export default App;
