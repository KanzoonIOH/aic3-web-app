import {
    getLogSummary,
    getLogTimeseries,
    type LogRange,
    type LogSummary,
} from "@/api/logs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Download, MessagesSquare } from "lucide-react";
import { useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/admin/dashboard")({
    component: RouteComponent,
});

const RANGES: { value: LogRange; label: string }[] = [
    { value: "24h", label: "24h" },
    { value: "7d", label: "7d" },
    { value: "30d", label: "30d" },
];

function fmt(n: number) {
    return Math.round(n).toLocaleString("en-US");
}

function formatBucket(iso: string, range: LogRange) {
    const d = new Date(iso);
    // 24h shows hourly buckets; wider ranges are daily.
    return range === "24h"
        ? d.toLocaleString(undefined, { hour: "2-digit", minute: "2-digit" })
        : d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
}

// ---------------------------------------------------------------------------
// Shared section bits
// ---------------------------------------------------------------------------

function SampleBadge() {
    return (
        <span className="shrink-0 rounded-md border border-purple-400/25 bg-purple-400/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-500">
            Sample
        </span>
    );
}

function SectionHeading({
    title,
    badge,
    note,
    muted,
}: {
    title: string;
    badge?: "dev" | "tech" | "sample";
    note?: string;
    muted?: boolean;
}) {
    return (
        <div className="mt-1 flex flex-wrap items-center gap-3">
            <h2
                className={cn(
                    "font-heading text-base font-semibold",
                    muted && "text-muted-foreground",
                )}
            >
                {title}
            </h2>
            {badge === "sample" && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/30 bg-purple-400/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-500">
                    Sample
                </span>
            )}
            {badge === "dev" && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-500">
                    In development
                </span>
            )}
            {badge === "tech" && (
                <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Technical
                </span>
            )}
            {note && (
                <span className="text-xs text-muted-foreground/70">{note}</span>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// KPI row
// ---------------------------------------------------------------------------

function KpiCard({
    label,
    value,
    unit,
    sub,
    icon: Icon,
}: {
    label: string;
    value: string;
    unit?: string;
    sub: React.ReactNode;
    icon: React.ElementType;
}) {
    return (
        <Card size="sm" className="gap-3 p-5">
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                </span>
                <Icon className="size-4 text-muted-foreground/60" />
            </div>
            <div className="font-heading text-3xl font-bold leading-none tracking-tight">
                {value}
                {unit && (
                    <span className="text-xl text-muted-foreground">
                        {unit}
                    </span>
                )}
            </div>
            <div className="text-xs text-muted-foreground">{sub}</div>
        </Card>
    );
}

function SampleKpiCard({
    label,
    value,
    unit,
    sub,
}: {
    label: string;
    value: string;
    unit: string;
    sub: string;
}) {
    return (
        <Card
            size="sm"
            className="relative gap-3 border-dashed border-purple-400/30 p-5"
        >
            <span className="absolute right-4 top-4">
                <SampleBadge />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
            </span>
            <div className="font-heading text-3xl font-bold leading-none tracking-tight">
                {value}
                <span className="text-xl text-muted-foreground"> {unit}</span>
            </div>
            <div className="text-xs text-muted-foreground/60">{sub}</div>
        </Card>
    );
}

// ---------------------------------------------------------------------------
// System performance (live)
// ---------------------------------------------------------------------------

const PERCENTILE_COLORS = {
    p50: "var(--chart-2)",
    p90: "#fbbf24",
    p95: "#fb923c",
    p99: "#f87171",
} as const;

function LatencyDistribution({ summary }: { summary?: LogSummary }) {
    const rows = [
        {
            label: "p50",
            ms: summary?.p50_response_ms ?? 0,
            color: PERCENTILE_COLORS.p50,
        },
        {
            label: "p90",
            ms: summary?.p90_response_ms ?? 0,
            color: PERCENTILE_COLORS.p90,
        },
        {
            label: "p95",
            ms: summary?.p95_response_ms ?? 0,
            color: PERCENTILE_COLORS.p95,
        },
        {
            label: "p99",
            ms: summary?.p99_response_ms ?? 0,
            color: PERCENTILE_COLORS.p99,
        },
    ];
    // Axis ceiling: round the worst percentile up to a clean number, min 1s.
    const max = Math.max(1000, ...rows.map((r) => r.ms));
    const mean = summary?.success_avg_response_ms ?? 0;

    return (
        <Card size="sm" className="gap-5 p-6">
            <div>
                <h3 className="font-heading text-sm font-semibold">
                    Response latency distribution
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                    Mean &amp; percentiles across successful requests
                </p>
            </div>

            <div className="flex gap-2.5">
                <Stat label="Mean" value={fmt(mean)} unit="ms" accent />
                <Stat
                    label="p90"
                    value={fmt(summary?.p90_response_ms ?? 0)}
                    unit="ms"
                />
                <Stat
                    label="p99"
                    value={fmt(summary?.p99_response_ms ?? 0)}
                    unit="ms"
                />
            </div>

            <div className="flex flex-col gap-3.5">
                {rows.map((r) => (
                    <div key={r.label} className="flex items-center gap-3.5">
                        <span className="w-9 font-mono text-xs font-semibold">
                            {r.label}
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full"
                                style={{
                                    width: `${Math.min(100, (r.ms / max) * 100)}%`,
                                    background: r.color,
                                }}
                            />
                        </div>
                        <span className="w-20 text-right font-mono text-xs text-muted-foreground">
                            {fmt(r.ms)} ms
                        </span>
                    </div>
                ))}
                <div className="flex justify-between border-t pt-2 font-mono text-[10px] text-muted-foreground/60">
                    <span>0 ms</span>
                    <span>{fmt(max / 2)}</span>
                    <span>{fmt(max)} ms (axis)</span>
                </div>
            </div>
        </Card>
    );
}

function Stat({
    label,
    value,
    unit,
    accent,
}: {
    label: string;
    value: string;
    unit: string;
    accent?: boolean;
}) {
    return (
        <div
            className={cn(
                "flex-1 rounded-xl border p-3",
                accent
                    ? "border-primary/20 bg-primary/5"
                    : "border-border bg-muted/40",
            )}
        >
            <div
                className={cn(
                    "text-[9.5px] font-semibold uppercase tracking-wider",
                    accent ? "text-primary" : "text-muted-foreground",
                )}
            >
                {label}
            </div>
            <div className="mt-1 font-mono text-base font-semibold">
                {value}
                <span className="text-[10px] text-muted-foreground">
                    {" "}
                    {unit}
                </span>
            </div>
        </div>
    );
}

const trendConfig: ChartConfig = {
    p50_response_ms: { label: "p50 latency", color: "var(--chart-2)" },
};

function ResponseTrend({
    series,
}: {
    series: { label: string; p50_response_ms: number }[];
}) {
    return (
        <Card size="sm" className="gap-4 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-heading text-sm font-semibold">
                        Response time over time
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                        p50 latency per bucket, oldest → newest
                    </p>
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                    ms
                </span>
            </div>
            {series.length === 0 ? (
                <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">
                    No data
                </div>
            ) : (
                <ChartContainer config={trendConfig} className="h-44 w-full">
                    <AreaChart data={series}>
                        <defs>
                            <linearGradient
                                id="latFill"
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
                            fill="url(#latFill)"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ChartContainer>
            )}
        </Card>
    );
}

// ---------------------------------------------------------------------------
// SOON placeholders for Customer experience & Service/resolution
// ---------------------------------------------------------------------------

// Deterministic pseudo-random so the sample chart is stable across renders.
function sampleSeed(i: number, salt: number) {
    const x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
    return x - Math.floor(x); // 0..1
}

function SampleChartCard({
    title,
    desc,
    legend,
}: {
    title: string;
    desc: string;
    legend: { label: string; color: string }[];
}) {
    // Build 12 buckets of stacked sample values, one series per legend entry.
    const data = Array.from({ length: 12 }, (_, i) => {
        const row: Record<string, number | string> = { i };
        legend.forEach((l, s) => {
            row[l.label] = Math.round(20 + sampleSeed(i, s) * 60);
        });
        return row;
    });

    return (
        <Card
            size="sm"
            className="relative flex-1 gap-4 border-dashed border-purple-400/30 p-6"
            style={{ flexBasis: "440px" }}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="font-heading text-sm font-semibold">
                        {title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
                </div>
                <SampleBadge />
            </div>
            <ChartContainer config={{}} className="h-40 w-full">
                <AreaChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="i" hide />
                    <YAxis hide />
                    {legend.map((l) => (
                        <Area
                            key={l.label}
                            type="monotone"
                            dataKey={l.label}
                            stackId="1"
                            stroke={l.color}
                            fill={l.color}
                            fillOpacity={0.25}
                            strokeWidth={1.5}
                        />
                    ))}
                </AreaChart>
            </ChartContainer>
            <div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground">
                {legend.map((l) => (
                    <span key={l.label} className="flex items-center gap-1.5">
                        <span
                            className="size-2 rounded-sm"
                            style={{ background: l.color }}
                        />
                        {l.label}
                    </span>
                ))}
            </div>
        </Card>
    );
}

function ServiceQualityCard() {
    const rows: { label: string; value: string }[] = [
        { label: "Satisfaction (CSAT)", value: "4.6 / 5" },
        { label: "Avg first response", value: "1.8 s" },
        { label: "Avg resolution time", value: "3m 12s" },
        { label: "Escalation rate", value: "8.3%" },
        { label: "Messages / conversation", value: "6.4" },
        { label: "Unique users", value: "1,284" },
    ];
    return (
        <Card
            size="sm"
            className="relative flex-1 gap-1 border-dashed border-purple-400/30 p-6"
            style={{ flexBasis: "280px" }}
        >
            <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                    <h3 className="font-heading text-sm font-semibold">
                        Service quality
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Per-conversation averages
                    </p>
                </div>
                <SampleBadge />
            </div>
            {rows.map((row, i) => (
                <div
                    key={row.label}
                    className={cn(
                        "flex items-center justify-between py-2.5",
                        i < rows.length - 1 && "border-b",
                    )}
                >
                    <span className="text-xs text-muted-foreground">
                        {row.label}
                    </span>
                    <span className="font-mono text-sm font-semibold">
                        {row.value}
                    </span>
                </div>
            ))}
        </Card>
    );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function RouteComponent() {
    const [range, setRange] = useState<LogRange>("24h");

    const summaryQuery = useQuery({
        queryKey: ["logs", "summary", range],
        queryFn: () => getLogSummary(range),
        placeholderData: keepPreviousData,
    });

    const timeseriesQuery = useQuery({
        queryKey: ["logs", "timeseries", range],
        queryFn: () => getLogTimeseries(range),
        placeholderData: keepPreviousData,
    });

    const summary = summaryQuery.data?.data;
    const series = (timeseriesQuery.data?.data ?? []).map((p) => ({
        ...p,
        label: formatBucket(p.bucket, range),
    }));

    const successRate =
        summary != null ? `${(summary.success_rate * 100).toFixed(1)}` : "NaN";

    return (
        <div className="flex-1 space-y-6 overflow-y-auto p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="font-heading text-2xl font-bold tracking-tight">
                            Overview
                        </h1>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-500">
                            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                            LIVE
                        </span>
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                        Customer engagement, service quality &amp; resolution
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {RANGES.map((r) => (
                        <Button
                            key={r.value}
                            size="sm"
                            variant={range === r.value ? "default" : "outline"}
                            onClick={() => setRange(r.value)}
                        >
                            {r.label}
                        </Button>
                    ))}
                    <Button size="sm" variant="outline">
                        <Download className="size-3.5" />
                        Export
                    </Button>
                </div>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    label="Conversations"
                    value={
                        summary != null
                            ? summary.uniq_conversations.toLocaleString()
                            : "0"
                    }
                    icon={MessagesSquare}
                    sub={
                        summary != null
                            ? `Handled by ${summary.uniq_agents} AI agent${
                                  summary.uniq_agents === 1 ? "" : "s"
                              } · ${summary.avg_messages_per_convo.toFixed(
                                  1,
                              )} msg / convo`
                            : "Handled by 0 AI agents · 0.0 msg / convo"
                    }
                />
                <KpiCard
                    label="Success rate"
                    value={successRate}
                    unit="%"
                    icon={CheckCircle2}
                    sub={
                        summary != null ? (
                            <>
                                <span className="text-emerald-500">
                                    {summary.success_count} of {summary.total}{" "}
                                    requests
                                </span>{" "}
                                succeeded · {summary.failure_count} failed
                            </>
                        ) : (
                            <>
                                <span className="text-emerald-500">
                                    0 of 0 requests
                                </span>{" "}
                                succeeded · 0 failed
                            </>
                        )
                    }
                />
                <SampleKpiCard
                    label="Customer sentiment"
                    value="82.4"
                    unit="%"
                    sub="Positive conversation share"
                />
                <SampleKpiCard
                    label="Resolution rate"
                    value="76.1"
                    unit="%"
                    sub="Resolved without a human agent"
                />
            </div>

            <SectionHeading
                title="System performance"
                badge="tech"
                muted
                note="Reliability & latency · for engineering & ops"
            />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <LatencyDistribution summary={summary} />
                <ResponseTrend series={series} />
            </div>

            {/* Customer experience (SAMPLE) */}
            <SectionHeading
                title="Customer experience"
                badge="sample"
                note="Sample data — replaced once conversation ingestion ships."
            />
            <div className="flex flex-wrap gap-4">
                <SampleChartCard
                    title="Sentiment over time"
                    desc="Share of positive / neutral / negative conversations"
                    legend={[
                        { label: "Positive", color: "var(--chart-2)" },
                        { label: "Neutral", color: "#a1a1aa" },
                        { label: "Negative", color: "#f87171" },
                    ]}
                />
                <SampleChartCard
                    title="Sentiment mix"
                    desc="Current snapshot"
                    legend={[
                        { label: "Positive", color: "var(--chart-2)" },
                        { label: "Neutral", color: "#a1a1aa" },
                        { label: "Negative", color: "#f87171" },
                        { label: "Other", color: "#a78bfa" },
                    ]}
                />
            </div>

            {/* Service & resolution (SAMPLE) */}
            <SectionHeading title="Service & resolution" badge="sample" />
            <div className="flex flex-wrap gap-4">
                <SampleChartCard
                    title="Conversation outcomes over time"
                    desc="Resolved · escalated · timed-out · intercepted"
                    legend={[
                        { label: "Resolved", color: "var(--chart-2)" },
                        { label: "Escalated", color: "#fbbf24" },
                        { label: "Timed-out", color: "#f87171" },
                        { label: "Intercepted", color: "#a78bfa" },
                    ]}
                />
                <ServiceQualityCard />
            </div>

            {/*<div className="h-px bg-border" />*/}
        </div>
    );
}
