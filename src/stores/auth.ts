import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthResponse } from "@/api/auth";

interface User {
    id: string;
    username: string;
    email: string;
}

interface AuthState {
    token: string | null;
    user: User | null;
    // Actions
    setAuth: (response: AuthResponse) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            setAuth: (response) =>
                set({ token: response.token, user: response.user }),
            clearAuth: () => set({ token: null, user: null }),
        }),
        {
            name: "aic3-auth",
        },
    ),
);

// Selector helpers — call outside React for non-hook contexts (axios and tanstack router beforeLoad)
export const getToken = () => useAuthStore.getState().token;
