import { client } from "./client";
import type { ResponseTemplate } from "./types";

// ---------- Types ----------

export interface Mcp {
    id: string;
    name: string;
    description: string | null;
    uri: string;
    agent_id: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface UpdateMcpRequest {
    name: string;
    description: string;
}

// ---------- API functions ----------

type ResponseGetMcps = ResponseTemplate<Mcp[]>;
export async function getMcps(): Promise<ResponseGetMcps> {
    const { data } = await client.get<ResponseGetMcps>("/mcps");
    return data;
}

type ResponseGetMcp = ResponseTemplate<Mcp>;
export async function getMcp(id: string): Promise<ResponseGetMcp> {
    const { data } = await client.get<ResponseGetMcp>(`/mcps/${id}`);
    return data;
}

type ResponseUpdateMcp = ResponseTemplate<Mcp>;
export async function updateMcp(
    id: string,
    payload: UpdateMcpRequest,
): Promise<ResponseUpdateMcp> {
    const { data } = await client.patch<ResponseUpdateMcp>(
        `/mcps/${id}`,
        payload,
    );
    return data;
}

export async function deleteMcp(id: string): Promise<void> {
    await client.delete(`/mcps/${id}`);
}
