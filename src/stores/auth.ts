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

// tokenExp returns the JWT `exp` (unix seconds) or null if the token is missing
// or malformed. ponytail: atob decode, no jwt-decode dependency for one field.
function tokenExp(token: string | null): number | null {
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return typeof payload.exp === "number" ? payload.exp : null;
    } catch {
        return null;
    }
}

// isTokenExpired reports whether the stored token's exp is in the past.
// A token with no exp is treated as valid (server is the final authority).
export const isTokenExpired = () => {
    const exp = tokenExp(useAuthStore.getState().token);
    return exp !== null && exp * 1000 <= Date.now();
};

// Selector helpers — call outside React for non-hook contexts (axios and tanstack router beforeLoad)
export const getToken = () => {
    if (isTokenExpired()) {
        useAuthStore.getState().clearAuth();
        return null;
    }
    return useAuthStore.getState().token;
};

// PENDING users are signed up but not yet approved: no app access.
export const isPending = () =>
    useAuthStore.getState().user?.role === "PENDING";
