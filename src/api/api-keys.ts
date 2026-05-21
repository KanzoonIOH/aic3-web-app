import { client } from "./client";
import type { ResponseTemplate } from "./types";

// ---------- Types ----------

export interface ApiKey {
    id: string;
    name: string;
    token: string;
    created_at: string;
}

export interface CreateApiKeyRequest {
    name: string;
}

// ---------- API functions ----------

type ResponseGetApiKeys = ResponseTemplate<ApiKey[]>;
export async function getApiKeys(): Promise<ResponseGetApiKeys> {
    const { data } = await client.get<ResponseGetApiKeys>("/api-keys");
    return data;
}

type ResponseCreateApiKey = ResponseTemplate<ApiKey>;
export async function createApiKey(
    payload: CreateApiKeyRequest,
): Promise<ResponseCreateApiKey> {
    const { data } = await client.post<ResponseCreateApiKey>(
        "/api-keys",
        payload,
    );
    return data;
}

type ResponseRevokeApiKey = ResponseTemplate<null>;
export async function revokeApiKey(id: string): Promise<ResponseRevokeApiKey> {
    const { data } = await client.delete<ResponseRevokeApiKey>(
        `/api-keys/${id}`,
    );
    return data;
}
