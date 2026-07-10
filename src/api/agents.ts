import { client } from "./client";
import { getToken } from "@/stores/auth";
import type { Knowledge } from "./knowledges";
import type { Mcp } from "./mcps";
import type { Tag } from "./tags";
import type { ListParams, ResponseTemplate } from "./types";

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
    tone: string;
    response_length: string;
    communication_style: string;
    tags: Tag[] | null;
    image: string | null; // emoji string or object-storage URL
    can_act: boolean;
    template_id: string; // static template id ("product", "booking", ...) or ""
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
    can_act: boolean;
    template_id: string;
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

export type GetAgentsParams = ListParams & {
    is_active?: boolean;
    tag_id?: string;
};

export async function getAgents(
    params: GetAgentsParams = {},
): Promise<ResponseTemplate<Agent[]>> {
    const { data } = await client.get<ResponseTemplate<Agent[]>>("/agents", {
        params,
    });
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
    params: ListParams = {},
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
    params: ListParams = {},
): Promise<ResponseTemplate<AgentKnowledgeOption[]>> {
    const { data } = await client.get<ResponseTemplate<AgentKnowledgeOption[]>>(
        `/agents/${id}/knowledges/all`,
        { params },
    );
    return data;
}

export async function getAgentMcps(
    id: string,
    params: ListParams = {},
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

// Streaming counterpart of chatWithAgent. Every agent supports both: this just
// appends /stream to the URL.
// Hits POST /chat/{id}/stream and invokes onChunk for each text delta as it
// arrives. Returns the full assembled reply + session id when the stream ends.
// Uses fetch (axios can't stream a response body in the browser).
export async function chatWithAgentStream(
    id: string,
    chatInput: string,
    onChunk: (delta: string) => void,
    sessionId?: string,
    suggestion?: SuggestionItem,
    dynamicFields?: Record<string, string>,
    dynamicHeaders?: Record<string, string>,
    outputField = "reply",
    onStep?: (title: string) => void,
    signal?: AbortSignal,
): Promise<{ reply: string; sessionId?: string }> {
    const token = getToken();
    const res = await fetch(`${import.meta.env.VITE_API_URL}/chat/${id}/stream`, {
        method: "POST",
        signal,
        headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(sessionId && { "x-session-id": sessionId }),
        },
        body: JSON.stringify({
            chatInput,
            ...dynamicFields,
            ...(dynamicHeaders &&
                Object.keys(dynamicHeaders).length > 0 && {
                    headers: dynamicHeaders,
                }),
            ...(suggestion && { milvus: true, ...suggestion }),
        }),
    });

    if (!res.ok || !res.body) {
        throw new Error(`stream request failed: ${res.status}`);
    }

    const returnedSession =
        res.headers.get("x-session-id") || sessionId || undefined;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let reply = "";
    let sawSSE = false; // did the upstream actually send SSE `data:` lines?
    let rawBody = ""; // full body, kept for the non-SSE JSON fallback

    // Emit one SSE data payload. onChunk always receives the FULL reply so far
    // (cumulative), and the UI sets the bubble to it — never appends. This makes
    // the render idempotent, so a re-run or duplicate emit can't double the text.
    const emit = (payload: string) => {
        const p = payload.trim();
        if (!p || p === "[DONE]") return;
        try {
            const obj = JSON.parse(p);
            // Thinking-process events carry a step title, not answer text.
            if (obj.event === "step") {
                if (obj.title) onStep?.(obj.title);
                return;
            }
            // Incremental token chunk -> append to the running reply.
            const delta = obj.delta ?? obj.text ?? obj.content;
            if (typeof delta === "string" && delta) {
                reply += delta;
                onChunk(reply);
                return;
            }
            // Full answer field (final/one-shot) -> replace the running reply.
            const full = obj[outputField] ?? obj.reply ?? obj.output;
            if (typeof full === "string" && full) {
                reply = full;
                onChunk(reply);
            }
        } catch {
            // Not JSON: treat the raw payload as an appended chunk.
            reply += p;
            onChunk(reply);
        }
    };

    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        rawBody += chunk;
        buffer += chunk;

        // Process complete lines; keep the trailing partial in the buffer.
        let nl = buffer.indexOf("\n");
        while (nl !== -1) {
            const line = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);
            if (line.startsWith("data:")) {
                sawSSE = true;
                emit(line.slice(5));
            }
            nl = buffer.indexOf("\n");
        }
    }
    // Flush any trailing data line without a newline terminator.
    if (buffer.trim().startsWith("data:")) {
        sawSSE = true;
        emit(buffer.trim().slice(5));
    }

    // Fallback: upstream returned a plain JSON blob (not SSE), same shape as the
    // non-streaming endpoint. Extract the configured output field and emit it
    // once so the bubble isn't left empty.
    if (!sawSSE) {
        const body = rawBody.trim();
        let text = body;
        try {
            const obj = JSON.parse(body);
            text = obj[outputField] ?? obj.reply ?? obj.output ?? "";
        } catch {
            // not JSON — show the raw text as-is
        }
        if (typeof text === "string" && text) {
            reply = text;
            onChunk(text);
        }
    }

    return { reply, sessionId: returnedSession };
}
