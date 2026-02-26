import { create } from 'zustand';

const mockResponses = [
    "That's a great question! For DSA preparation, I'd recommend starting with arrays and strings, then moving to linked lists and trees. Would you like a structured study plan?",
    "Based on your profile, I suggest focusing on React and Node.js for full-stack development. The MERN stack is highly in demand right now!",
    "For your resume, make sure to quantify your achievements. Instead of 'Built a website', try 'Built a responsive web app serving 1000+ users with 99% uptime'.",
    "Mock interviews are crucial! I recommend practicing at least 2-3 coding problems daily on LeetCode. Start with Easy, then move to Medium after a week.",
    "Your career roadmap looks solid! I'd suggest adding some open-source contributions to strengthen your profile. Check out GitHub's 'good first issue' labels.",
    "For AI/ML roles, Python is essential. Start with NumPy and Pandas, then move to scikit-learn before diving into deep learning with TensorFlow or PyTorch.",
    "Great progress on your learning path! You've completed 60% of the DSA module. Keep going! 🚀",
    "I can help you prepare for behavioral interviews too. Let's practice the STAR method - Situation, Task, Action, Result.",
];

export const useChatStore = create((set, get) => ({
    messages: [
        {
            id: '1',
            text: "Hi! I'm your AI Study Buddy 🤖. I can help with doubt solving, career guidance, resume tips, and interview preparation. What would you like to work on today?",
            sender: 'ai',
            timestamp: new Date().toISOString(),
        },
    ],
    isTyping: false,
    chatHistory: [
        { id: 'current', title: 'New Chat', date: new Date().toISOString() },
    ],

    sendMessage: (text) => {
        const userMsg = {
            id: Date.now().toString(),
            text,
            sender: 'user',
            timestamp: new Date().toISOString(),
        };

        set((state) => ({
            messages: [...state.messages, userMsg],
            isTyping: true,
        }));

        setTimeout(() => {
            const aiMsg = {
                id: (Date.now() + 1).toString(),
                text: mockResponses[Math.floor(Math.random() * mockResponses.length)],
                sender: 'ai',
                timestamp: new Date().toISOString(),
            };
            set((state) => ({
                messages: [...state.messages, aiMsg],
                isTyping: false,
            }));
        }, 1500);
    },

    clearChat: () =>
        set({
            messages: [
                {
                    id: '1',
                    text: "Hi! I'm your AI Study Buddy 🤖. How can I help you today?",
                    sender: 'ai',
                    timestamp: new Date().toISOString(),
                },
            ],
        }),
}));
