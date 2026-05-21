import { client } from "./client";
import type { ResponseTemplate } from "./types";

// ---------- Types ----------

export interface Agent {
    id: string;
    name: string;
    description: string;
    is_active: boolean;
    webhook_uri: string;
    knowledges_count: number;
    mcps_count: number;
    pinned: boolean;
}

// ---------- API functions ----------

type ResponseGetAgents = ResponseTemplate<Agent[]>;
export async function getAgents(): Promise<ResponseGetAgents> {
    const { data } = await client.get<ResponseGetAgents>("/agents");
    return data;
}

type ResponseGetAgent = ResponseTemplate<Agent>;
export async function getAgent(id: string): Promise<ResponseGetAgent> {
    const { data } = await client.get<ResponseGetAgent>(`/agents/${id}`);
    return data;
}
