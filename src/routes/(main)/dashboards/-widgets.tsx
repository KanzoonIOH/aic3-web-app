import {
    getConversationSummary,
    getLogSummary,
    getLogTimeseries,
    type LogRange,
    type LogSummary,
} from "@/api/logs";
import type { Widget, WidgetRange, WidgetSource } from "@/api/dashboards";
import { Card } from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

// ---------------------------------------------------------------------------
// Widget template catalog
//
// Each entry is a "template" a user can drop onto their dashboard. It declares
// the data source, the rendering type, and which params are tunable. Marketing
// users pick a template + set params (range, metric) — no raw queries.
// ---------------------------------------------------------------------------

export interface MetricOption {
    value: string;
    label: string;
    unit?: string;
}

export interface WidgetTemplate {
    type: Widget["type"];
    source: WidgetSource;
    label: string;
    description: string;
    defaultTitle: string;
    // Which params this template exposes in the editor.
    hasRange: boolean;
    metrics?: MetricOption[];
}

export const WIDGET_TEMPLATES: WidgetTemplate[] = [
    {
        type: "kpi",
        source: "logs.summary",
        label: "Message KPI",
        description: "A single number from message analytics (total, success rate, latency).",
        defaultTitle: "Total messages",
        hasRange: true,
        metrics: [
            { value: "total", label: "Total messages" },
            { value: "success_count", label: "Successful messages" },
            { value: "failure_count", label: "Failed messages" },
            { value: "success_rate", label: "Success rate", unit: "%" },
            { value: "success_avg_response_ms", label: "Avg response", unit: "ms" },
            { value: "p90_response_ms", label: "p90 latency", unit: "ms" },
            { value: "p99_response_ms", label: "p99 latency", unit: "ms" },
            { value: "uniq_conversations", label: "Unique conversations" },
            { value: "uniq_agents", label: "Active agents" },
        ],
    },
    {
        type: "conv_kpi",
        source: "conversations.summary",
        label: "Conversation KPI",
        description: "A single number from conversation analytics (resolution, escalation, CSAT).",
        defaultTitle: "Resolution rate",
        hasRange: true,
        metrics: [
            { value: "total", label: "Total conversations" },
            { value: "resolution_rate", label: "Resolution rate", unit: "%" },
            { value: "escalation_rate", label: "Escalation rate", unit: "%" },
            { value: "avg_user_satisfaction", label: "Avg satisfaction" },
            { value: "uniq_users", label: "Unique users" },
            { value: "avg_messages_per_conversation", label: "Msgs / conversation" },
        ],
    },
    {
        type: "latency",
        source: "logs.latency",
        label: "Latency distribution",
        description: "p50 / p90 / p95 / p99 response-time bars.",
        defaultTitle: "Response latency",
        hasRange: true,
    },
    {
        type: "timeseries",
        source: "logs.timeseries",
        label: "Response time trend",
        description: "p50 latency over time as an area chart.",
        defaultTitle: "Response time over time",
        hasRange: true,
    },
];

export function templateFor(w: Widget): WidgetTemplate | undefined {
    return WIDGET_TEMPLATES.find((t) => t.type === w.type);
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function fmt(n: number): string {
    return Math.round(n).toLocaleString("en-US");
}

function metricLabel(source: WidgetSource, metric: string): MetricOption | undefined {
    const t = WIDGET_TEMPLATES.find((x) => x.source === source);
    return t?.metrics?.find((m) => m.value === metric);
}

const RANGE_LABEL: Record<WidgetRange, string> = {
    "24h": "Last 24 hours",
    "7d": "Last 7 days",
    "30d": "Last 30 days",
};

function asRange(r: WidgetRange | undefined): LogRange {
    return (r ?? "7d") as LogRange;
}

// ---------------------------------------------------------------------------
// Individual widget renderers
// ---------------------------------------------------------------------------

function KpiWidget({ widget }: { widget: Widget }) {
    const range = asRange(widget.params.range);
    const metric = widget.params.metric ?? "total";
    const { data, isPending, isError } = useQuery({
        queryKey: ["widget", "logs.summary", range],
        queryFn: () => getLogSummary(range),
    });

    const opt = metricLabel("logs.summary", metric);
    const raw = data?.data
        ? (data.data as unknown as Record<string, number>)[metric]
        : undefined;
    const value =
        raw === undefined
            ? "—"
            : opt?.unit === "%"
              ? `${(raw * 100).toFixed(1)}`
              : fmt(raw);

    return (
        <KpiShell
            title={widget.title}
            value={isPending ? "…" : isError ? "—" : value}
            unit={opt?.unit}
            sub={RANGE_LABEL[widget.params.range ?? "7d"]}
        />
    );
}

function ConvKpiWidget({ widget }: { widget: Widget }) {
    const range = asRange(widget.params.range);
    const metric = widget.params.metric ?? "total";
    const { data, isPending, isError } = useQuery({
        queryKey: ["widget", "conversations.summary", range],
        queryFn: () => getConversationSummary(range),
    });

    const opt = metricLabel("conversations.summary", metric);
    const raw = data?.data
        ? (data.data as unknown as Record<string, number>)[metric]
        : undefined;
    const value =
        raw === undefined
            ? "—"
            : opt?.unit === "%"
              ? `${(raw * 100).toFixed(1)}`
              : fmt(raw);

    return (
        <KpiShell
            title={widget.title}
            value={isPending ? "…" : isError ? "—" : value}
            unit={opt?.unit}
            sub={RANGE_LABEL[widget.params.range ?? "7d"]}
        />
    );
}

function KpiShell({
    title,
    value,
    unit,
    sub,
}: {
    title: string;
    value: string;
    unit?: string;
    sub: string;
}) {
    return (
        <Card size="sm" className="h-full gap-3 p-5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {title}
            </span>
            <div className="font-heading text-3xl font-bold leading-none tracking-tight">
                {value}
                {unit && (
                    <span className="ml-1 text-xl text-muted-foreground">
                        {unit}
                    </span>
                )}
            </div>
            <div className="text-xs text-muted-foreground">{sub}</div>
        </Card>
    );
}

const LATENCY_COLORS = ["var(--chart-2)", "#fbbf24", "#fb923c", "#f87171"];

function LatencyWidget({ widget }: { widget: Widget }) {
    const range = asRange(widget.params.range);
    const { data, isPending } = useQuery({
        queryKey: ["widget", "logs.summary", range],
        queryFn: () => getLogSummary(range),
    });
    const s = data?.data as LogSummary | undefined;
    const rows = [
        { label: "p50", ms: s?.p50_response_ms ?? 0 },
        { label: "p90", ms: s?.p90_response_ms ?? 0 },
        { label: "p95", ms: s?.p95_response_ms ?? 0 },
        { label: "p99", ms: s?.p99_response_ms ?? 0 },
    ];
    const max = Math.max(1000, ...rows.map((r) => r.ms));

    return (
        <Card size="sm" className="h-full gap-4 p-6">
            <div>
                <h3 className="font-heading text-sm font-semibold">
                    {widget.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                    {RANGE_LABEL[widget.params.range ?? "7d"]}
                </p>
            </div>
            <div className="flex flex-col gap-3">
                {rows.map((r, i) => (
                    <div key={r.label} className="flex items-center gap-3">
                        <span className="w-9 font-mono text-xs font-semibold">
                            {r.label}
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full"
                                style={{
                                    width: `${Math.min(100, (r.ms / max) * 100)}%`,
                                    background: LATENCY_COLORS[i],
                                }}
                            />
                        </div>
                        <span className="w-20 text-right font-mono text-xs text-muted-foreground">
                            {isPending ? "…" : `${fmt(r.ms)} ms`}
                        </span>
                    </div>
                ))}
            </div>
        </Card>
    );
}

const trendConfig: ChartConfig = {
    p50_response_ms: { label: "p50 latency", color: "var(--chart-2)" },
};

function TimeseriesWidget({ widget }: { widget: Widget }) {
    const range = asRange(widget.params.range);
    const { data, isPending } = useQuery({
        queryKey: ["widget", "logs.timeseries", range],
        queryFn: () => getLogTimeseries(range),
    });

    const series = (data?.data ?? []).map((p) => ({
        label:
            range === "24h"
                ? new Date(p.bucket).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                  })
                : new Date(p.bucket).toLocaleDateString(undefined, {
                      month: "short",
                      day: "2-digit",
                  }),
        p50_response_ms: p.p50_response_ms,
    }));

    return (
        <Card size="sm" className="h-full gap-4 p-6">
            <div>
                <h3 className="font-heading text-sm font-semibold">
                    {widget.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                    {RANGE_LABEL[widget.params.range ?? "7d"]} · p50 latency (ms)
                </p>
            </div>
            {isPending ? (
                <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">
                    Loading…
                </div>
            ) : series.length === 0 ? (
                <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">
                    No data
                </div>
            ) : (
                <ChartContainer config={trendConfig} className="h-44 w-full">
                    <AreaChart data={series}>
                        <defs>
                            <linearGradient
                                id={`fill-${widget.id}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="0%"
                                    stopColor="var(--color-p50_response_ms)"
                                    stopOpacity={0.28}
                                />
                                <stop
                                    offset="100%"
                                    stopColor="var(--color-p50_response_ms)"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => `${Math.round(v)}`}
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    formatter={(v) => `${fmt(Number(v))} ms`}
                                />
                            }
                        />
                        <Area
                            type="monotone"
                            dataKey="p50_response_ms"
                            stroke="var(--color-p50_response_ms)"
                            fill={`url(#fill-${widget.id})`}
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ChartContainer>
            )}
        </Card>
    );
}

// WidgetRenderer dispatches to the right renderer for a widget's type. Wide
// widgets (charts) span 2 grid columns; KPIs span 1.
export function WidgetRenderer({ widget }: { widget: Widget }) {
    switch (widget.type) {
        case "kpi":
            return <KpiWidget widget={widget} />;
        case "conv_kpi":
            return <ConvKpiWidget widget={widget} />;
        case "latency":
            return <LatencyWidget widget={widget} />;
        case "timeseries":
            return <TimeseriesWidget widget={widget} />;
        default:
            return null;
    }
}

// isWide reports whether a widget should span two columns in the grid.
export function isWide(widget: Widget): boolean {
    return widget.type === "latency" || widget.type === "timeseries";
}
