import { client } from "./client";

// ---------- Types ----------

export interface LogMessage {
    agent_id: string;
    conversation_id: string;
    status_code: number;
    response_time_ms: number;
    is_success: boolean;
    occurred_at: string;
}

export interface LogPagination {
    limit: number;
    page: number;
    rows: number;
    total_page: number;
    total_row: number;
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

export interface LogMessagesResponse {
    data: LogMessage[];
    pagination: LogPagination;
}

export interface LogTimeseriesResponse {
    data: LogTimeseriesPoint[];
}

export interface LogSummaryResponse {
    data: LogSummary;
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
): Promise<LogTimeseriesResponse> {
    const params = agentId ? { agent_id: agentId } : undefined;
    const { data } = await client.get<LogTimeseriesResponse>(
        "/logs/timeseries",
        { params },
    );
    return data;
}

export async function getLogSummary(
    agentId?: string,
): Promise<LogSummaryResponse> {
    const params = agentId ? { agent_id: agentId } : undefined;
    const { data } = await client.get<LogSummaryResponse>("/logs/summary", {
        params,
    });
    return data;
}
