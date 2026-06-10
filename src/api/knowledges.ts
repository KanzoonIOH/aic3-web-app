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

type ResponseGetKnowledges = ResponseTemplate<Knowledge[]>;
export async function getKnowledges(): Promise<ResponseGetKnowledges> {
    const { data } = await client.get<ResponseGetKnowledges>("/knowledges");
    return data;
}

type ResponseGetKnowledge = ResponseTemplate<Knowledge>;
export async function getKnowledge(id: string): Promise<ResponseGetKnowledge> {
    const { data } = await client.get<ResponseGetKnowledge>(
        `/knowledges/${id}`,
    );
    return data;
}

type ResponseCreateKnowledge = ResponseTemplate<Knowledge>;
export async function createKnowledge(
    payload: CreateKnowledgeRequest,
): Promise<ResponseCreateKnowledge> {
    const form = new FormData();
    form.append("name", payload.name);
    form.append("description", payload.description);
    form.append("source_type", payload.source_type);
    form.append("file", payload.file);

    const { data } = await client.post<ResponseCreateKnowledge>(
        "/knowledges",
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
}

type ResponseUpdateKnowledge = ResponseTemplate<Knowledge>;
export async function updateKnowledge(
    id: string,
    payload: UpdateKnowledgeRequest,
): Promise<ResponseUpdateKnowledge> {
    const { data } = await client.patch<ResponseUpdateKnowledge>(
        `/knowledges/${id}`,
        payload,
    );
    return data;
}

export async function deleteKnowledge(id: string): Promise<void> {
    await client.delete(`/knowledges/${id}`);
}
