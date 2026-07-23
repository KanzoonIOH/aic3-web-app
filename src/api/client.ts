import axios from "axios";
import { getToken, useAuthStore } from "@/stores/auth";

export const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Attach auth token to every request if present
client.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auto-logout on expired/invalid session. A 401 from any endpoint (except the
// login attempt itself) means the token is gone or expired: clear it and bounce
// to /login. Hard redirect resets all in-memory state cleanly.
client.interceptors.response.use(
    (res) => res,
    (error) => {
        const status = error.response?.status;
        const url: string = error.config?.url ?? "";
        const isLoginAttempt = url.includes("/auth/login");
        if (status === 401 && !isLoginAttempt) {
            useAuthStore.getState().clearAuth();
            if (window.location.pathname !== "/login") {
                window.location.assign("/login");
            }
        }
        return Promise.reject(error);
    },
);
