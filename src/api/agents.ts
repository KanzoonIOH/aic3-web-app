import { client } from "./client";

// ---------- Types ----------

export interface Agent {
    id: string;
    name: string;
    description: string;
    is_active: boolean;
    webhook_uri: string;
    initials: string;
    tools: number;
    mcps: number;
    pinned: boolean;
}

// ---------- API functions ----------

export async function getAgents(): Promise<Agent[]> {
    const { data } = await client.get<Agent[]>("/agents");
    return data;
}

export async function getAgent(id: string): Promise<Agent> {
    const { data } = await client.get<Agent>(`/agents/${id}`);
    return data;
}
