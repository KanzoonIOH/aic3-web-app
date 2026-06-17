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
    avg_response_ms: number;
}

export interface LogSummary {
    total: number;
    success_count: number;
    success_rate: number;
    avg_response_ms: number;
    uniq_conversations: number;
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

export async function getLogTimeseries(
    agentId?: string,
): Promise<ResponseTemplate<LogTimeseriesPoint[]>> {
    const params = agentId ? { agent_id: agentId } : undefined;
    const { data } = await client.get<ResponseTemplate<LogTimeseriesPoint[]>>(
        "/logs/timeseries",
        { params },
    );
    return data;
}

export async function getLogSummary(
    agentId?: string,
): Promise<ResponseTemplate<LogSummary>> {
    const params = agentId ? { agent_id: agentId } : undefined;
    const { data } = await client.get<ResponseTemplate<LogSummary>>("/logs/summary", {
        params,
    });
    return data;
}
