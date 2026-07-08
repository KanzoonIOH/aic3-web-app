import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthResponse, UserRole } from "@/api/auth";

interface User {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    image?: string | null;
}

interface AuthState {
    token: string | null;
    user: User | null;
    // Actions
    setAuth: (response: AuthResponse) => void;
    setUser: (user: Partial<User>) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            setAuth: (response) =>
                set({ token: response.token, user: response.user }),
            setUser: (patch) =>
                set((s) => (s.user ? { user: { ...s.user, ...patch } } : s)),
            clearAuth: () => set({ token: null, user: null }),
        }),
        {
            name: "aic3-auth",
        },
    ),
);

// Selector helpers — call outside React for non-hook contexts (axios and tanstack router beforeLoad)
export const getToken = () => useAuthStore.getState().token;

// PENDING users are signed up but not yet approved: no app access.
export const isPending = () =>
    useAuthStore.getState().user?.role === "PENDING";
