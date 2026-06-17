import { client } from "./client";
import type { Knowledge } from "./knowledges";
import type { Mcp } from "./mcps";
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

export async function getAgents(): Promise<ResponseTemplate<Agent[]>> {
    const { data } = await client.get<ResponseTemplate<Agent[]>>("/agents");
    return data;
}

export async function getAgent(id: string): Promise<ResponseTemplate<Agent>> {
    const { data } = await client.get<ResponseTemplate<Agent>>(`/agents/${id}`);
    return data;
}

export async function updateAgent(
    id: string,
    payload: UpdateAgentRequest,
): Promise<ResponseTemplate<Agent>> {
    const { data } = await client.patch<ResponseTemplate<Agent>>(
        `/agents/${id}`,
        payload,
    );
    return data;
}

export interface AgentKnowledge extends Knowledge {
    status: string;
}

export async function getAgentKnowledges(
    id: string,
    params: { page?: number; limit?: number } = {},
): Promise<ResponseTemplate<AgentKnowledge[]>> {
    const { data } = await client.get<ResponseTemplate<AgentKnowledge[]>>(
        `/agents/${id}/knowledges`,
        { params },
    );
    return data;
}

export interface AgentKnowledgeOption {
    id: string;
    name: string;
    description: string | null;
    connected: boolean;
}

export async function getAgentKnowledgesAll(
    id: string,
    params: { offset?: number; limit?: number } = {},
): Promise<ResponseTemplate<AgentKnowledgeOption[]>> {
    const { data } = await client.get<ResponseTemplate<AgentKnowledgeOption[]>>(
        `/agents/${id}/knowledges/all`,
        { params },
    );
    return data;
}

export async function getAgentMcps(
    id: string,
    params: { page?: number; limit?: number } = {},
): Promise<ResponseTemplate<Mcp[]>> {
    const { data } = await client.get<ResponseTemplate<Mcp[]>>(
        `/agents/${id}/mcps`,
        { params },
    );
    return data;
}

export interface NextStep {
    label: string;
    target_id?: number;
    target_intent?: string;
}

export interface SuggestionItem {
    label: string;
    target_id?: number;
    target_intent?: string;
    faq_code?: string;
    subtype?: string;
    product_code?: string;
    product_name?: string;
}

export interface CcProduct {
    card_type: "classic" | "gold" | "platinum";
    limit: { min: number; max: number };
    welcome_bonus: number;
    free_lounge: boolean;
    benefit: string[];
}

export interface ChatResponse {
    reply: string;
    next_step?: NextStep[] | null;
    product?: CcProduct[] | null;
}

export interface PersonaRequest {
    tone: string;
    response_length: string;
    communication_style: string;
}

export async function saveAgentPersona(
    id: string,
    payload: PersonaRequest,
): Promise<void> {
    await client.patch(`/agents/${id}/persona`, payload);
}

export async function chatWithAgent(
    id: string,
    chatInput: string,
    sessionId: string,
    suggestion?: SuggestionItem,
): Promise<ChatResponse> {
    const { data } = await client.post<ChatResponse>(`/chat/${id}`, {
        chatInput,
        sessionId,
        ...(suggestion && { milvus: true, ...suggestion }),
    });
    return data;
}
