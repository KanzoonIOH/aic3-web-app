import { client } from "./client";
import type { PaginationType, ResponseTemplate } from "./types";

// ---------- Types ----------

export interface LogMessage {
    agent_id: string;
    conversation_id: string;
    status_code: number;
    response_time_ms: number;
    is_success: boolean;
    occurred_at: string;
}

export interface LogTimeseriesPoint {
    bucket: string;
    total: number;
    success_count: number;
    success_rate: number;
    p50_response_ms: number;
    p90_response_ms: number;
    p95_response_ms: number;
    p99_response_ms: number;
}

export interface LogSummary {
    total: number;
    success_count: number;
    failure_count: number;
    success_rate: number;
    success_avg_response_ms: number;
    p50_response_ms: number;
    p90_response_ms: number;
    p95_response_ms: number;
    p99_response_ms: number;
    uniq_conversations: number;
    uniq_agents: number;
    avg_messages_per_convo: number;
}

// Conversation analytics — backend already serves these (see core-services
// /logs/conversations/*). Rendered as "SOON" until ingestion is populated.
export interface ConversationSummary {
    total: number;
    resolved_count: number;
    escalated_count: number;
    timed_out_count: number;
    intercepted_count: number;
    resolution_rate: number;
    escalation_rate: number;
    avg_resolution_ms: number;
    avg_first_response_ms: number;
    avg_user_satisfaction: number;
    avg_messages_per_conversation: number;
    uniq_users: number;
    positive_count: number;
    neutral_count: number;
    negative_count: number;
    other_sentiment_count: number;
}

export interface ConversationTimeseriesPoint {
    bucket: string;
    total: number;
    resolved_count: number;
    escalated_count: number;
    resolution_rate: number;
    avg_resolution_ms: number;
}

// ponytail: replaced LogPagination (duplicate of PaginationType) and hand-rolled response
// wrappers with ResponseTemplate<T>; LogMessagesResponse preserved as named type for
// the pagination field which this endpoint always returns non-null
export interface LogMessagesResponse {
    data: LogMessage[];
    pagination: PaginationType;
}

// ---------- Params ----------

export interface LogMessagesParams {
    offset?: number;
    limit?: number;
}

// ---------- API functions ----------

export async function getLogMessages(
    params: LogMessagesParams = {},
    agentId?: string,
): Promise<LogMessagesResponse> {
    const url = agentId ? `/logs/messages/${agentId}` : "/logs/messages";
    const { data } = await client.get<LogMessagesResponse>(url, { params });
    return data;
}

// Backend rangeSince() maps these to rolling windows: 24h (hourly step) |
// 7d | 30d | 3months (weekly step).
export type LogRange = "24h" | "7d" | "30d" | "3months";

function scopeParams(range?: LogRange, agentId?: string) {
    const params: Record<string, string> = {};
    if (range) params.range = range;
    if (agentId) params.agent_id = agentId;
    return Object.keys(params).length ? params : undefined;
}

export async function getLogTimeseries(
    range?: LogRange,
    agentId?: string,
): Promise<ResponseTemplate<LogTimeseriesPoint[]>> {
    const { data } = await client.get<ResponseTemplate<LogTimeseriesPoint[]>>(
        "/logs/timeseries",
        { params: scopeParams(range, agentId) },
    );
    return data;
}

export async function getLogSummary(
    range?: LogRange,
    agentId?: string,
): Promise<ResponseTemplate<LogSummary>> {
    const { data } = await client.get<ResponseTemplate<LogSummary>>(
        "/logs/summary",
        { params: scopeParams(range, agentId) },
    );
    return data;
}

export async function getConversationSummary(
    range?: LogRange,
    agentId?: string,
): Promise<ResponseTemplate<ConversationSummary>> {
    const { data } = await client.get<ResponseTemplate<ConversationSummary>>(
        "/logs/conversations/summary",
        { params: scopeParams(range, agentId) },
    );
    return data;
}

export async function getConversationTimeseries(
    range?: LogRange,
    agentId?: string,
): Promise<ResponseTemplate<ConversationTimeseriesPoint[]>> {
    const { data } = await client.get<
        ResponseTemplate<ConversationTimeseriesPoint[]>
    >("/logs/conversations/timeseries", { params: scopeParams(range, agentId) });
    return data;
}
