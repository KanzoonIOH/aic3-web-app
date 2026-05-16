import { client } from "./client";

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

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        username: string;
        email: string;
    };
}

// Server error shape returned by the API
export interface ApiError {
    message: string;
    errors?: Record<string, string[]>;
}

// ---------- API functions ----------

export async function login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await client.post<AuthResponse>("/auth/login", payload);
    return data;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await client.post<AuthResponse>("/auth/register", payload);
    return data;
}
