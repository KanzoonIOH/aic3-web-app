import { client } from "./client";
import { getRefreshToken } from "@/stores/auth";
import type { ResponseTemplate } from "./types";

// ---------- Types ----------

export interface LoginPayload {
    login_id: string;
    password: string;
}

export interface RegisterPayload {
    username: string;
    email: string;
    password: string;
}

// Server roles (postgres user_role enum). PENDING = awaiting approval, no access.
export type UserRole =
    | "PENDING"
    | "VIEWER"
    | "TECHNICAL"
    | "ADMIN"
    | "SUPERADMIN";

export interface AuthResponse {
    token: string;
    refresh_token: string;
    user: {
        id: string;
        username: string;
        email: string;
        role: UserRole;
        image?: string | null;
    };
}

// Server error shape returned by the API
export interface ApiError {
    message: string;
    errors?: Record<string, string[]>;
}

// ---------- API functions ----------

export async function login(payload: LoginPayload): Promise<ResponseTemplate<AuthResponse>> {
    const { data } = await client.post<ResponseTemplate<AuthResponse>>("/auth/login", payload);
    return data;
}

export async function logout(): Promise<void> {
    // Best-effort: revokes the refresh-token session + records the LOGOUT audit
    // event server-side. Never blocks the client from clearing its own session.
    try {
        await client.post("/auth/logout", {
            refresh_token: getRefreshToken(),
        });
    } catch {
        // ignore — logout must always succeed client-side
    }
}

export async function register(
    payload: RegisterPayload,
): Promise<ResponseTemplate<AuthResponse>> {
    const { data } = await client.post<ResponseTemplate<AuthResponse>>("/auth/register", payload);
    return data;
}

export interface AcceptInvitePayload {
    token: string;
    password: string;
}

export async function acceptInvite(
    payload: AcceptInvitePayload,
): Promise<ResponseTemplate<AuthResponse>> {
    const { data } = await client.post<ResponseTemplate<AuthResponse>>(
        "/auth/accept-invite",
        payload,
    );
    return data;
}

export async function forgotPassword(
    login_id: string,
): Promise<ResponseTemplate<string>> {
    const { data } = await client.post<ResponseTemplate<string>>(
        "/auth/password/forgot",
        { login_id },
    );
    return data;
}

export async function resetPassword(payload: {
    token: string;
    new_password: string;
}): Promise<ResponseTemplate<unknown>> {
    const { data } = await client.post<ResponseTemplate<unknown>>(
        "/auth/password/reset",
        payload,
    );
    return data;
}
