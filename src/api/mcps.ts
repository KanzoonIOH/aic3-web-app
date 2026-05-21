import { client } from "./client";
import type { ResponseTemplate } from "./types";

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
