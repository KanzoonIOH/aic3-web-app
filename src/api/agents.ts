import { client } from "./client";
import type { Knowledge } from "./knowledges";
import type { Mcp } from "./mcps";
import type { ResponseTemplate } from "./types";

export interface PaginationParams {
    page?: number;
    limit?: number;
}

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

type ResponseGetAgentKnowledges = ResponseTemplate<Knowledge[]>;
export async function getAgentKnowledges(
    id: string,
    params: PaginationParams = {},
): Promise<ResponseGetAgentKnowledges> {
    const { data } = await client.get<ResponseGetAgentKnowledges>(
        `/agents/${id}/knowledges`,
        { params },
    );
    return data;
}

type ResponseGetAgentMcps = ResponseTemplate<Mcp[]>;
export async function getAgentMcps(
    id: string,
    params: PaginationParams = {},
): Promise<ResponseGetAgentMcps> {
    const { data } = await client.get<ResponseGetAgentMcps>(
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
