import { client } from "./client";
import type { ResponseTemplate } from "./types";

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
//
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
