import { client } from "./client";
import type { ListParams, ResponseTemplate } from "./types";

// A sub-agent mapping under an orchestrator. tool_name/description are stored;
// endpoint (== agent.template_id) and can_act are derived from the agent row.
export interface OrchestratorAgent {
    agent_id: string;
    agent_name: string;
    agent_image: string | null;
    endpoint: string;
    tool_name: string;
    description: string;
    can_act: boolean;
}

// List row (no agents array, just a count).
export interface Orchestrator {
    id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    orchestrator_agent_id: string;
    routing_guide: string;
    persona: string;
    guardrail: string;
    image: string | null;
    webhook_uri: string;
    agents_count: number;
}

// Detail (create + get-by-id) carries the full agents mapping.
export interface OrchestratorDetail extends Omit<Orchestrator, "agents_count"> {
    agents: OrchestratorAgent[];
}

export interface CreateOrchestratorRequest {
    name: string;
    description?: string | null;
    is_active?: boolean;
    tags: string[];
    agent_ids: string[];
}

export async function createOrchestrator(
    payload: CreateOrchestratorRequest,
): Promise<ResponseTemplate<OrchestratorDetail>> {
    const { data } = await client.post<ResponseTemplate<OrchestratorDetail>>(
        "/orchestrators",
        payload,
    );
    return data;
}

export type GetOrchestratorsParams = ListParams & {
    is_active?: boolean;
};

export async function getOrchestrators(
    params: GetOrchestratorsParams = {},
): Promise<ResponseTemplate<Orchestrator[]>> {
    const { data } = await client.get<ResponseTemplate<Orchestrator[]>>(
        "/orchestrators",
        { params },
    );
    return data;
}

export async function getOrchestrator(
    id: string,
): Promise<ResponseTemplate<OrchestratorDetail>> {
    const { data } = await client.get<ResponseTemplate<OrchestratorDetail>>(
        `/orchestrators/${id}`,
    );
    return data;
}

export interface UpdateOrchestratorRequest {
    name: string;
    description?: string | null;
    is_active: boolean;
    routing_guide: string;
    persona: string;
    guardrail: string;
    image?: string | null;
    webhook_uri: string;
}

export async function updateOrchestrator(
    id: string,
    payload: UpdateOrchestratorRequest,
): Promise<ResponseTemplate<OrchestratorDetail>> {
    const { data } = await client.patch<ResponseTemplate<OrchestratorDetail>>(
        `/orchestrators/${id}`,
        payload,
    );
    return data;
}

export async function deleteOrchestrator(id: string): Promise<void> {
    await client.delete(`/orchestrators/${id}`);
}

// The orchestrator persona column is a single free-text/JSON blob. The
// Customization tab reuses the agent's structured persona (tone/length/style),
// so we (de)serialize it here. Non-JSON personas (upstream free text) fall back
// to defaults so the UI still renders.
export interface OrchestratorPersona {
    tone: string;
    response_length: string;
    communication_style: string;
}

const DEFAULT_ORCH_PERSONA: OrchestratorPersona = {
    tone: "FRIENDLY",
    response_length: "MEDIUM",
    communication_style: "EXPERT_ADVISOR",
};

export function parsePersona(raw: string): OrchestratorPersona {
    try {
        const p = JSON.parse(raw);
        return {
            tone: p.tone ?? DEFAULT_ORCH_PERSONA.tone,
            response_length:
                p.response_length ?? DEFAULT_ORCH_PERSONA.response_length,
            communication_style:
                p.communication_style ??
                DEFAULT_ORCH_PERSONA.communication_style,
        };
    } catch {
        return DEFAULT_ORCH_PERSONA;
    }
}

export function serializePersona(p: OrchestratorPersona): string {
    return JSON.stringify(p);
}
