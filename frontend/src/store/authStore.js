import { create } from 'zustand';

export const useAuthStore = create((set) => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    isAuthenticated: !!localStorage.getItem('user'),

    login: (email, password) => {
        const user = {
            id: '1',
            name: email.split('@')[0],
            email,
            role: 'student',
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${email}`,
        };
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, isAuthenticated: true });
        return true;
    },

    register: (name, email, password, role) => {
        const user = {
            id: Date.now().toString(),
            name,
            email,
            role,
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`,
        };
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, isAuthenticated: true });
        return true;
    },

    logout: () => {
        localStorage.removeItem('user');
        set({ user: null, isAuthenticated: false });
    },
}));
