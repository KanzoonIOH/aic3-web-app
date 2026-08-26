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
    refreshToken: string | null;
    user: User | null;
    // Actions
    setAuth: (response: AuthResponse) => void;
    setTokens: (token: string, refreshToken: string) => void;
    setUser: (user: Partial<User>) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            refreshToken: null,
            user: null,
            setAuth: (response) =>
                set({
                    token: response.token,
                    refreshToken: response.refresh_token,
                    user: response.user,
                }),
            setTokens: (token, refreshToken) => set({ token, refreshToken }),
            setUser: (patch) =>
                set((s) => (s.user ? { user: { ...s.user, ...patch } } : s)),
            clearAuth: () =>
                set({ token: null, refreshToken: null, user: null }),
        }),
        {
            name: "aic3-auth",
        },
    ),
);

export const getRefreshToken = () => useAuthStore.getState().refreshToken;

// Selector helpers — call outside React for non-hook contexts (axios and
// tanstack router beforeLoad).
//
// getToken returns the raw access token as-is, even if the JWT is expired: the
// client's 401 interceptor silently refreshes and replays, so an expired access
// token is not a logged-out state. Expiry-based logout now lives entirely in the
// refresh flow (refresh token expired/revoked -> forced logout).
export const getToken = () => useAuthStore.getState().token;

// hasSession reports whether the user still has a usable session for route
// guards: an access token OR a refresh token means "logged in" (an expired
// access token is recoverable via refresh).
export const hasSession = () => {
    const s = useAuthStore.getState();
    return Boolean(s.token || s.refreshToken);
};

// PENDING users are signed up but not yet approved: no app access.
export const isPending = () =>
    useAuthStore.getState().user?.role === "PENDING";

// Single source of truth for "where does this role land after auth".
// PENDING falls through to /admin on purpose: the admin layout renders the
// awaiting-approval gate instead of the console.
export const homeFor = (role?: UserRole) =>
    role === "VIEWER" ? ("/app" as const) : ("/admin/dashboard" as const);

export const homeForCurrentUser = () =>
    homeFor(useAuthStore.getState().user?.role);
