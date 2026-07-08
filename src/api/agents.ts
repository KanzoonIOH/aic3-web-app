import { client } from "./client";
import type { Knowledge } from "./knowledges";
import type { Mcp } from "./mcps";
import type { Tag } from "./tags";
import type { ResponseTemplate } from "./types";

// ---------- Types ----------

// A field injected into the outbound webhook JSON body.
// "static": value sent as-is. "dynamic": value supplied per request (e.g. in
// the chat sandbox), enforced by the backend.
export interface BodyField {
    key: string;
    type: "static" | "dynamic";
    value: string;
}

export interface Agent {
    id: string;
    name: string;
    description: string;
    is_active: boolean;
    webhook_uri: string;
    milvus_collection: string;
    webhook_input_field: string;
    webhook_output_field: string;
    webhook_body_fields: BodyField[] | null;
    webhook_header_fields: BodyField[] | null;
    guardrail: string;
    tags: Tag[] | null;
    image: string | null; // emoji string or object-storage URL
    knowledges_count: number;
    mcps_count: number;
    pinned: boolean;
}

export interface UpdateAgentRequest {
    name: string;
    description: string;
    is_active: boolean;
    webhook_uri: string;
    webhook_input_field: string;
    webhook_output_field: string;
    webhook_body_fields: BodyField[];
    webhook_header_fields: BodyField[];
    guardrail: string;
    tags: string[];
    image?: string | null;
    // milvus_collection is immutable after create — not sent on update.
}

export interface CreateAgentRequest {
    name: string;
    description: string;
    webhook_uri: string;
    milvus_collection: string;
    webhook_input_field: string;
    webhook_output_field: string;
    webhook_body_fields: BodyField[];
    webhook_header_fields: BodyField[];
    guardrail: string;
    tags: string[];
    image?: string | null;
}

// Uploads an agent picture and returns its public URL. Emojis are stored as
// plain strings and never hit this endpoint.
export async function uploadImage(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await client.post<ResponseTemplate<{ url: string }>>(
        "/uploads/image",
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data.data.url;
}

// ---------- API functions ----------

export async function createAgent(
    payload: CreateAgentRequest,
): Promise<ResponseTemplate<Agent>> {
    const { data } = await client.post<ResponseTemplate<Agent>>(
        "/agents",
        payload,
    );
    return data;
}

export async function getAgents(): Promise<ResponseTemplate<Agent[]>> {
    const { data } = await client.get<ResponseTemplate<Agent[]>>("/agents");
    return data;
}

export async function deleteAgent(id: string): Promise<void> {
    await client.delete(`/agents/${id}`);
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
    params: { offset?: number; limit?: number } = {},
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
    params: { offset?: number; limit?: number } = {},
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
    sessionId?: string;
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

// The upstream webhook returns the reply under whatever key the agent is
// configured with (agent.webhook_output_field, e.g. "reply", "output", "data").
// outputField tells us which key to read; defaults to "reply" for agents
// created before this was configurable.
export async function chatWithAgent(
    id: string,
    chatInput: string,
    sessionId?: string,
    suggestion?: SuggestionItem,
    dynamicFields?: Record<string, string>,
    dynamicHeaders?: Record<string, string>,
    outputField = "reply",
): Promise<ChatResponse> {
    const response = await client.post<Record<string, unknown>>(
        `/chat/${id}`,
        {
            chatInput,
            ...dynamicFields,
            ...(dynamicHeaders &&
                Object.keys(dynamicHeaders).length > 0 && {
                    headers: dynamicHeaders,
                }),
            ...(suggestion && { milvus: true, ...suggestion }),
        },
        {
            ...(sessionId && {
                headers: { "x-session-id": sessionId },
            }),
        },
    );
    const data = response.data;
    const reply = data[outputField];
    return {
        reply: typeof reply === "string" ? reply : "",
        next_step: data.next_step as NextStep[] | null | undefined,
        product: data.product as CcProduct[] | null | undefined,
        sessionId: response.headers["x-session-id"] || undefined,
    };
}
