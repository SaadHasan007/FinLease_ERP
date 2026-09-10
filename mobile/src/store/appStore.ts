import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  isAuthenticated: boolean;
  token: string | null;
  user: any | null;
  login: (token: string, user: any) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  isAuthenticated: false,
  token: null,
  user: null,
  login: async (token: string, user: any) => {
    await AsyncStorage.setItem('token', token);
    set({ isAuthenticated: true, token, user });
  },
  logout: async () => {
    await AsyncStorage.removeItem('token');
    set({ isAuthenticated: false, token: null, user: null });
  },
}));
