import { client } from "./client";

// ---------- Types ----------

export interface Knowledge {
    id: string;
    name: string;
    description: string;
    is_active: boolean;
    type: string;
    source_uri: string;
    document_count: number;
}

// ---------- API functions ----------

export async function getKnowledges(): Promise<Knowledge[]> {
    const { data } = await client.get<Knowledge[]>("/knowledges");
    return data;
}

export async function getKnowledge(id: string): Promise<Knowledge> {
    const { data } = await client.get<Knowledge>(`/knowledges/${id}`);
    return data;
}
