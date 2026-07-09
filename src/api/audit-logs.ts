import { client } from "./client";
import type { PaginationType } from "./types";

// ---------- Types ----------

export interface AuditLog {
    occurred_at: string;
    user_id: string;
    role: string;
    auth_method: string;
    action: string; // CREATE | UPDATE | DELETE
    menu: string; // feature/resource, e.g. "agents"
    method: string;
    path: string;
    status: number;
}

// This list endpoint always returns non-null pagination.
export interface AuditLogsResponse {
    data: AuditLog[];
    pagination: PaginationType;
}

// ---------- Params ----------

export interface AuditLogsParams {
    offset?: number; // 0-based page index (page - 1)
    limit?: number;
    user_id?: string;
    menu?: string;
    action?: string;
}

// ---------- API functions ----------

export async function getAuditLogs(
    params: AuditLogsParams = {},
): Promise<AuditLogsResponse> {
    const { data } = await client.get<AuditLogsResponse>("/logs/audit", {
        params,
    });
    return data;
}
