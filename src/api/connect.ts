import { client } from "./client";
import type { ResponseTemplate } from "./types";

export interface ConnectAgentKnowledgeRequest {
    agent_id: string;
    knowledge_id: string;
}

type ResponseConnectAgentKnowledge = ResponseTemplate<null>;
export async function connectAgentKnowledge(
    payload: ConnectAgentKnowledgeRequest,
): Promise<ResponseConnectAgentKnowledge> {
    const { data } = await client.post<ResponseConnectAgentKnowledge>(
        "/connect/agent-knowledge",
        payload,
    );
    return data;
}

export async function disconnectAgentKnowledge(
    payload: ConnectAgentKnowledgeRequest,
): Promise<void> {
    await client.delete("/connect/agent-knowledge", { data: payload });
}

export interface ConnectAgentMcpRequest {
    agent_id: string;
    mcp_id: string;
}

export async function connectAgentMcp(
    payload: ConnectAgentMcpRequest,
): Promise<void> {
    await client.post("/connect/agent-mcp", payload);
}

export async function disconnectAgentMcp(
    payload: ConnectAgentMcpRequest,
): Promise<void> {
    await client.delete("/connect/agent-mcp", { data: payload });
}
