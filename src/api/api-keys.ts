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

export async function getApiKeys(): Promise<ResponseTemplate<ApiKey[]>> {
    const { data } = await client.get<ResponseTemplate<ApiKey[]>>("/api-keys");
    return data;
}

export async function createApiKey(
    payload: CreateApiKeyRequest,
): Promise<ResponseTemplate<ApiKey>> {
    const { data } = await client.post<ResponseTemplate<ApiKey>>(
        "/api-keys",
        payload,
    );
    return data;
}

export async function revokeApiKey(id: string): Promise<ResponseTemplate<null>> {
    const { data } = await client.delete<ResponseTemplate<null>>(
        `/api-keys/${id}`,
    );
    return data;
}
