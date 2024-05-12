import create from 'zustand';
import { User } from '../types/User.ts';

interface UserStore {
    user: User | null;
    setUser: (user: User | null) => void;
}

// Create a store for the user object
const useStore = create<UserStore>(set => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    setUser: (user) => {
        localStorage.setItem('user', JSON.stringify(user));
        set(() => ({ user }));
    },
}));

export const useUserStore = useStore;