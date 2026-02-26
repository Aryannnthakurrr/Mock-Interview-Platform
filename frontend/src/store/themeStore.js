import { create } from 'zustand';

export const useThemeStore = create((set) => ({
    theme: 'dark',
    initTheme: () => {
        document.body.className = 'dark';
    },
}));
