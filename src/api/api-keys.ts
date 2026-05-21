import { client } from "./client";
import type { ResponseTemplate } from "./types";

// ---------- Types ----------

export interface ApiKey {
    id: string;
    name: string;
    token: string;
    created_at: string;
}

// ---------- API functions ----------

type ResponseGetApiKeys = ResponseTemplate<ApiKey[]>;
export async function getApiKeys(): Promise<ResponseGetApiKeys> {
    const { data } = await client.get<ResponseGetApiKeys>("/api-keys");
    return data;
}
