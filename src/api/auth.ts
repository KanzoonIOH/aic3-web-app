import { client } from "./client";
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
    user: {
        id: string;
        username: string;
        email: string;
        role: UserRole;
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
