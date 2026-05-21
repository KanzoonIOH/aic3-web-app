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

export interface UpdateAgentRequest {
    name: string;
    description: string;
    is_active: boolean;
    webhook_uri: string;
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

type ResponseUpdateAgent = ResponseTemplate<Agent>;
export async function updateAgent(
    id: string,
    payload: UpdateAgentRequest,
): Promise<ResponseUpdateAgent> {
    const { data } = await client.patch<ResponseUpdateAgent>(
        `/agents/${id}`,
        payload,
    );
    return data;
}
