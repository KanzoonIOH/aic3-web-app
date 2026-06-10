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
