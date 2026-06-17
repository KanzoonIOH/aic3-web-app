import { client } from "./client";
import type { ResponseTemplate } from "./types";

// ---------- Types ----------

export interface Mcp {
    id: string;
    name: string;
    description: string | null;
    uri: string;
    agent_id: string;
    tools_count: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface UpdateMcpRequest {
    name: string;
    description: string;
}

export interface JsonSchema {
    type?: string;
    required?: string[];
    properties?: Record<string, JsonSchemaProperty>;
    additionalProperties?: boolean;
}

export interface JsonSchemaProperty {
    type?: string;
    description?: string;
    enum?: string[];
}

export interface McpTool {
    id: string;
    mcp_id: string;
    name: string;
    description: string;
    target_uri: string;
    input_schema: JsonSchema;
    created_at: string;
    updated_at: string;
}

// ---------- API functions ----------

export async function getMcps(): Promise<ResponseTemplate<Mcp[]>> {
    const { data } = await client.get<ResponseTemplate<Mcp[]>>("/mcps");
    return data;
}

export async function getMcp(id: string): Promise<ResponseTemplate<Mcp>> {
    const { data } = await client.get<ResponseTemplate<Mcp>>(`/mcps/${id}`);
    return data;
}

export async function getMcpTools(id: string): Promise<ResponseTemplate<McpTool[]>> {
    const { data } = await client.get<ResponseTemplate<McpTool[]>>(`/mcps/${id}/tools`);
    return data;
}

export async function updateMcp(
    id: string,
    payload: UpdateMcpRequest,
): Promise<ResponseTemplate<Mcp>> {
    const { data } = await client.patch<ResponseTemplate<Mcp>>(
        `/mcps/${id}`,
        payload,
    );
    return data;
}

export async function deleteMcp(id: string): Promise<void> {
    await client.delete(`/mcps/${id}`);
}
