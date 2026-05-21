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

type ResponseType = ResponseTemplate<AuthResponse>;
export async function login(payload: LoginPayload): Promise<ResponseType> {
    const { data } = await client.post<ResponseType>("/auth/login", payload);
    return data;
}

export async function register(
    payload: RegisterPayload,
): Promise<ResponseType> {
    const { data } = await client.post<ResponseType>("/auth/register", payload);
    return data;
}
