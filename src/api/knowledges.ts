import { client } from "./client";
import type { ListParams, ResponseTemplate } from "./types";

// ---------- Types ----------

export interface Knowledge {
    id: string;
    name: string;
    description: string | null;
    source_type: string;
    source_uri: string | null;
    is_crawl: boolean;
    agents_count?: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

// Either a file upload or a link. For a link, source_type is "web", source_uri
// holds the URL, and is_crawl decides crawl-whole-site vs single-page.
export type CreateKnowledgeRequest =
    | { name: string; description: string; source_type: string; file: File }
    | {
          name: string;
          description: string;
          source_type: "web";
          source_uri: string;
          is_crawl: boolean;
      };

export interface UpdateKnowledgeRequest {
    name: string;
    description: string;
}

// ---------- API functions ----------

export type GetKnowledgesParams = ListParams & {
    source_type?: string;
};

export async function getKnowledges(
    params: GetKnowledgesParams = {},
): Promise<ResponseTemplate<Knowledge[]>> {
    const { data } = await client.get<ResponseTemplate<Knowledge[]>>(
        "/knowledges",
        { params },
    );
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
    if ("file" in payload) {
        form.append("file", payload.file);
    } else {
        form.append("source_uri", payload.source_uri);
        form.append("is_crawl", String(payload.is_crawl));
    }

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
    params: ListParams = {},
): Promise<ResponseTemplate<KnowledgeAgent[]>> {
    const { data } = await client.get<ResponseTemplate<KnowledgeAgent[]>>(
        `/knowledges/${id}/agents`,
        { params },
    );
    return data;
}
