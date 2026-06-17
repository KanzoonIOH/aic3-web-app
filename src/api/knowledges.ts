import { client } from "./client";
import type { ResponseTemplate } from "./types";

// ---------- Types ----------

export interface Knowledge {
    id: string;
    name: string;
    description: string | null;
    source_type: string;
    source_uri: string | null;
    agents_count?: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface CreateKnowledgeRequest {
    name: string;
    description: string;
    source_type: string;
    file: File;
}

export interface UpdateKnowledgeRequest {
    name: string;
    description: string;
}

// ---------- API functions ----------

export async function getKnowledges(): Promise<ResponseTemplate<Knowledge[]>> {
    const { data } = await client.get<ResponseTemplate<Knowledge[]>>("/knowledges");
    return data;
}

export async function getKnowledge(id: string): Promise<ResponseTemplate<Knowledge>> {
    const { data } = await client.get<ResponseTemplate<Knowledge>>(
        `/knowledges/${id}`,
    );
    return data;
}

export async function createKnowledge(
    payload: CreateKnowledgeRequest,
): Promise<ResponseTemplate<Knowledge>> {
    const form = new FormData();
    form.append("name", payload.name);
    form.append("description", payload.description);
    form.append("source_type", payload.source_type);
    form.append("file", payload.file);

    const { data } = await client.post<ResponseTemplate<Knowledge>>(
        "/knowledges",
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
}

export async function updateKnowledge(
    id: string,
    payload: UpdateKnowledgeRequest,
): Promise<ResponseTemplate<Knowledge>> {
    const { data } = await client.patch<ResponseTemplate<Knowledge>>(
        `/knowledges/${id}`,
        payload,
    );
    return data;
}

export async function deleteKnowledge(id: string): Promise<void> {
    await client.delete(`/knowledges/${id}`);
}

export interface KnowledgeAgent {
    id: string;
    name: string;
    description: string | null;
    connected: boolean;
}

export async function getKnowledgeAgents(
    id: string,
    params: { offset?: number; limit?: number } = {},
): Promise<ResponseTemplate<KnowledgeAgent[]>> {
    const { data } = await client.get<ResponseTemplate<KnowledgeAgent[]>>(
        `/knowledges/${id}/agents`,
        { params },
    );
    return data;
}
