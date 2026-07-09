import { client } from "./client";
import type { Tag } from "./tags";
import type { ListParams, ResponseTemplate } from "./types";

// ---------- Types ----------

export type McpHeaders = Record<string, string>;

export interface Mcp {
    id: string;
    name: string;
    description: string | null;
    uri: string;
    headers: McpHeaders | null;
    agent_id: string;
    tools_count: number;
    tags: Tag[] | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface CreateMcpRequest {
    name: string;
    description: string;
    uri: string;
    headers: McpHeaders;
    tags: string[];
}

export interface UpdateMcpRequest {
    name: string;
    description: string;
    uri: string;
    headers: McpHeaders;
    tags: string[];
}

export type GetMcpsParams = ListParams & {
    tag_id?: string;
};

export interface McpOption {
    id: string;
    name: string;
    description: string | null;
    uri: string;
    tools_count: number;
    connected: boolean;
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

export async function getMcps(
    params: GetMcpsParams = {},
): Promise<ResponseTemplate<Mcp[]>> {
    const { data } = await client.get<ResponseTemplate<Mcp[]>>("/mcps", {
        params,
    });
    return data;
}

export async function getMcp(id: string): Promise<ResponseTemplate<Mcp>> {
    const { data } = await client.get<ResponseTemplate<Mcp>>(`/mcps/${id}`);
    return data;
}

export async function createMcp(
    payload: CreateMcpRequest,
): Promise<ResponseTemplate<unknown>> {
    const { data } = await client.post<ResponseTemplate<unknown>>(
        "/mcps",
        payload,
    );
    return data;
}

export async function getAgentMcpsAll(
    agentId: string,
    params: ListParams = {},
): Promise<ResponseTemplate<McpOption[]>> {
    const { data } = await client.get<ResponseTemplate<McpOption[]>>(
        `/agents/${agentId}/mcps/all`,
        { params },
    );
    return data;
}

export interface McpAgent {
    id: string;
    name: string;
    description: string | null;
    connected: boolean;
}

export async function getMcpAgents(
    id: string,
    params: ListParams = {},
): Promise<ResponseTemplate<McpAgent[]>> {
    const { data } = await client.get<ResponseTemplate<McpAgent[]>>(
        `/mcps/${id}/agents`,
        { params },
    );
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

// Reconnect to the MCP server and re-sync its tools (uses stored headers).
export async function refreshMcpTools(
    id: string,
): Promise<ResponseTemplate<McpTool[]>> {
    const { data } = await client.post<ResponseTemplate<McpTool[]>>(
        `/mcps/${id}/refresh-tools`,
    );
    return data;
}
