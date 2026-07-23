import axios, { type InternalAxiosRequestConfig } from "axios";
import { getRefreshToken, getToken, useAuthStore } from "@/stores/auth";

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

function forceLogout() {
    useAuthStore.getState().clearAuth();
    if (window.location.pathname !== "/login") {
        window.location.assign("/login");
    }
}

// tryRefresh trades the stored refresh token for a new access+refresh pair via a
// bare axios call (never the shared `client`, so it can't re-enter this
// interceptor). Returns the new access token, or null if refresh is impossible.
// A single in-flight refresh is shared across concurrent 401s.
let refreshInFlight: Promise<string | null> | null = null;
function tryRefresh(): Promise<string | null> {
    if (refreshInFlight) return refreshInFlight;
    refreshInFlight = (async () => {
        const refresh_token = getRefreshToken();
        if (!refresh_token) return null;
        try {
            const { data } = await axios.post(
                `${import.meta.env.VITE_API_URL}/auth/refresh`,
                { refresh_token },
                { headers: { "Content-Type": "application/json" } },
            );
            const token: string = data.data.token;
            useAuthStore.getState().setTokens(token, data.data.refresh_token);
            return token;
        } catch {
            return null;
        } finally {
            refreshInFlight = null;
        }
    })();
    return refreshInFlight;
}

// On a 401: attempt one silent refresh and replay the original request. If the
// refresh fails (refresh token expired/revoked, e.g. account deactivated),
// force logout. The login/refresh endpoints themselves never trigger a refresh.
client.interceptors.response.use(
    (res) => res,
    async (error) => {
        const status = error.response?.status;
        const config = error.config as
            | (InternalAxiosRequestConfig & { _retried?: boolean })
            | undefined;
        const url: string = config?.url ?? "";
        const skip = url.includes("/auth/login") || url.includes("/auth/refresh");

        if (status === 401 && config && !config._retried && !skip) {
            config._retried = true;
            const token = await tryRefresh();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
                return client(config);
            }
            forceLogout();
        }
        return Promise.reject(error);
    },
);
