import { client } from "./client";

// ---------- Types ----------

export interface Mcp {
    id: string;
    name: string;
    description: string;
    is_active: boolean;
    endpoint_url: string;
    tool_count: number;
}

// ---------- API functions ----------

export async function getMcps(): Promise<Mcp[]> {
    const { data } = await client.get<Mcp[]>("/mcps");
    return data;
}

export async function getMcp(id: string): Promise<Mcp> {
    const { data } = await client.get<Mcp>(`/mcps/${id}`);
    return data;
}
