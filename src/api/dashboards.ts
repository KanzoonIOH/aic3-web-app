import { client } from "./client";
import type { ResponseTemplate } from "./types";

// ---------- Widget config ----------

// A widget names a data-source "template" (one of the existing analytics
// endpoints) plus user-tunable params. This is intentionally coarse: marketing
// users pick a source + a range + a metric, not raw queries.
export type WidgetSource =
    | "logs.summary"
    | "logs.latency"
    | "logs.timeseries"
    | "conversations.summary";

export type WidgetRange = "24h" | "7d" | "30d";

export interface WidgetParams {
    range?: WidgetRange;
    // For single-value (KPI) widgets: which field of the summary to show.
    metric?: string;
}

export interface Widget {
    id: string;
    type: "kpi" | "latency" | "timeseries" | "conv_kpi";
    title: string;
    source: WidgetSource;
    params: WidgetParams;
}

export interface DashboardConfig {
    widgets: Widget[];
}

// ---------- Dashboard ----------

export type DashboardVisibility = "private" | "published";

export interface Dashboard {
    id: string;
    owner_id: string;
    name: string;
    description: string | null;
    config: DashboardConfig;
    visibility: DashboardVisibility;
    published_at: string | null;
    published_by: string | null;
    created_at: string;
    updated_at: string;
    // Present on list endpoints:
    is_owner?: boolean;
    imported?: boolean;
    owner_name?: string;
}

export interface CreateDashboardRequest {
    name: string;
    description?: string | null;
    config?: DashboardConfig;
}

export interface UpdateDashboardRequest {
    name: string;
    description?: string | null;
    config: DashboardConfig;
}

// ---------- API functions ----------

export async function getDashboards(): Promise<ResponseTemplate<Dashboard[]>> {
    const { data } = await client.get<ResponseTemplate<Dashboard[]>>(
        "/dashboards",
    );
    return data;
}

export async function getPublishedDashboards(): Promise<
    ResponseTemplate<Dashboard[]>
> {
    const { data } = await client.get<ResponseTemplate<Dashboard[]>>(
        "/dashboards/published",
    );
    return data;
}

export async function getDashboard(
    id: string,
): Promise<ResponseTemplate<Dashboard>> {
    const { data } = await client.get<ResponseTemplate<Dashboard>>(
        `/dashboards/${id}`,
    );
    return data;
}

export async function createDashboard(
    payload: CreateDashboardRequest,
): Promise<ResponseTemplate<Dashboard>> {
    const { data } = await client.post<ResponseTemplate<Dashboard>>(
        "/dashboards",
        payload,
    );
    return data;
}

export async function updateDashboard(
    id: string,
    payload: UpdateDashboardRequest,
): Promise<ResponseTemplate<Dashboard>> {
    const { data } = await client.patch<ResponseTemplate<Dashboard>>(
        `/dashboards/${id}`,
        payload,
    );
    return data;
}

export async function deleteDashboard(
    id: string,
): Promise<ResponseTemplate<null>> {
    const { data } = await client.delete<ResponseTemplate<null>>(
        `/dashboards/${id}`,
    );
    return data;
}

// Admin-only. Makes the dashboard available in the team catalog.
export async function publishDashboard(
    id: string,
): Promise<ResponseTemplate<Dashboard>> {
    const { data } = await client.post<ResponseTemplate<Dashboard>>(
        `/dashboards/${id}/publish`,
    );
    return data;
}

// Admin or owner. Reverts to private.
export async function unpublishDashboard(
    id: string,
): Promise<ResponseTemplate<Dashboard>> {
    const { data } = await client.delete<ResponseTemplate<Dashboard>>(
        `/dashboards/${id}/publish`,
    );
    return data;
}

// Subscribe to a published dashboard. Always renders from the owner's live
// config, so it stays in sync automatically.
export async function importDashboard(
    id: string,
): Promise<ResponseTemplate<Dashboard>> {
    const { data } = await client.post<ResponseTemplate<Dashboard>>(
        `/dashboards/${id}/import`,
    );
    return data;
}

export async function unimportDashboard(
    id: string,
): Promise<ResponseTemplate<null>> {
    const { data } = await client.delete<ResponseTemplate<null>>(
        `/dashboards/${id}/import`,
    );
    return data;
}
