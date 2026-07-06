import { getLogSummary, getLogTimeseries, type LogRange } from "@/api/logs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
// ponytail: Tabs hidden with the Employee Analytics tab, wanted later.
// import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    XAxis,
    YAxis,
} from "recharts";
// ponytail: employeeDummy still imported for the commented-out EmployeeTab.
import { trafficDummy, type BarItem } from "./-hrDummy";
import { getAgents } from "@/api/agents";

export const Route = createFileRoute("/(main)/hr-dashboard")({
    component: RouteComponent,
});

const RANGES: { value: LogRange; label: string }[] = [
    { value: "24h", label: "24h" },
    { value: "7d", label: "7d" },
    { value: "30d", label: "30d" },
];

const DONUT_COLORS = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
];

function fmt(n: number) {
    return Math.round(n).toLocaleString("en-US");
}

function formatBucket(iso: string, range: LogRange) {
    const d = new Date(iso);
    return range === "24h"
        ? d.toLocaleString(undefined, { hour: "2-digit", minute: "2-digit" })
        : d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
}

// ---------------------------------------------------------------------------
// Shared building blocks
// ---------------------------------------------------------------------------

function DummyBadge() {
    return (
        <span className="shrink-0 rounded-md border border-violet-400/25 bg-violet-400/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-500">
            Sample
        </span>
    );
}

function LiveBadge() {
    return (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-emerald-400/25 bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-500">
            <span className="size-1 animate-pulse rounded-full bg-emerald-500" />
            Live
        </span>
    );
}

function KpiCard({
    label,
    value,
    helper,
    live,
}: {
    label: string;
    value: string;
    helper: string;
    live?: boolean;
}) {
    return (
        <Card size="sm" className="gap-3 p-5">
            <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                </span>
                {live ? <LiveBadge /> : <DummyBadge />}
            </div>
            <div className="font-heading text-3xl font-bold leading-none tracking-tight">
                {value}
            </div>
            <div className="text-xs text-muted-foreground">{helper}</div>
        </Card>
    );
}

function SectionCard({
    title,
    badge,
    className,
    children,
}: {
    title: string;
    badge?: "live" | "sample";
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <Card size="sm" className={cn("gap-4 p-5", className)}>
            <div className="flex items-center justify-between gap-2">
                <h3 className="font-heading text-sm font-semibold">{title}</h3>
                {badge === "live" && <LiveBadge />}
                {badge === "sample" && <DummyBadge />}
            </div>
            {children}
        </Card>
    );
}

function BarList({ items }: { items: BarItem[] }) {
    const max = Math.max(1, ...items.map((i) => i.value));
    return (
        <div className="flex flex-col gap-3">
            {items.map((i) => (
                <div key={i.label} className="flex items-center gap-3">
                    <span className="w-36 shrink-0 truncate text-xs text-muted-foreground">
                        {i.label}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${(i.value / max) * 100}%` }}
                        />
                    </div>
                    <span className="w-10 text-right font-mono text-xs font-semibold">
                        {i.value}
                    </span>
                </div>
            ))}
        </div>
    );
}

function DonutCard({
    title,
    items,
    badge,
}: {
    title: string;
    items: BarItem[];
    badge?: "live" | "sample";
}) {
    const config: ChartConfig = Object.fromEntries(
        items.map((i, idx) => [
            i.label,
            { label: i.label, color: DONUT_COLORS[idx % DONUT_COLORS.length] },
        ]),
    );
    return (
        <SectionCard title={title} badge={badge}>
            <div className="flex items-center gap-4">
                <ChartContainer config={config} className="aspect-square h-36">
                    <PieChart>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie
                            data={items}
                            dataKey="value"
                            nameKey="label"
                            innerRadius={38}
                            outerRadius={64}
                            strokeWidth={2}
                        >
                            {items.map((_, idx) => (
                                <Cell
                                    key={idx}
                                    fill={
                                        DONUT_COLORS[idx % DONUT_COLORS.length]
                                    }
                                />
                            ))}
                        </Pie>
                    </PieChart>
                </ChartContainer>
                <div className="flex flex-1 flex-col gap-1.5">
                    {items.map((i, idx) => (
                        <div
                            key={i.label}
                            className="flex items-center justify-between gap-2 text-xs"
                        >
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                <span
                                    className="size-2 rounded-sm"
                                    style={{
                                        background:
                                            DONUT_COLORS[
                                                idx % DONUT_COLORS.length
                                            ],
                                    }}
                                />
                                {i.label}
                            </span>
                            <span className="font-mono font-semibold">
                                {i.value}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </SectionCard>
    );
}

// ---------------------------------------------------------------------------
// Volume / latency trend (real data)
// ---------------------------------------------------------------------------

const trendConfig: ChartConfig = {
    total: { label: "Requests", color: "var(--chart-1)" },
};

const latencyConfig: ChartConfig = {
    p50_response_ms: { label: "p50 latency", color: "var(--chart-2)" },
    p90_response_ms: { label: "p90 latency", color: "#fbbf24" },
};

function VolumeTrend({
    series,
    isPending,
}: {
    series: { label: string; total: number }[];
    isPending: boolean;
}) {
    return (
        <SectionCard
            title="Employee chat volume"
            badge="live"
            className="lg:col-span-2"
        >
            <p className="-mt-2 text-xs text-muted-foreground">
                Live request volume per bucket, oldest → newest
            </p>
            {isPending ? (
                <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">
                    Loading...
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
                                id="volFill"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="0%"
                                    stopColor="var(--color-total)"
                                    stopOpacity={0.28}
                                />
                                <stop
                                    offset="100%"
                                    stopColor="var(--color-total)"
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
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area
                            type="monotone"
                            dataKey="total"
                            stroke="var(--color-total)"
                            fill="url(#volFill)"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ChartContainer>
            )}
        </SectionCard>
    );
}

function LatencyTrend({
    series,
    isPending,
}: {
    series: {
        label: string;
        p50_response_ms: number;
        p90_response_ms: number;
    }[];
    isPending: boolean;
}) {
    return (
        <SectionCard title="Response latency" badge="live">
            <p className="-mt-2 text-xs text-muted-foreground">
                p50 / p90 response time (ms) per bucket, oldest → newest
            </p>
            {isPending ? (
                <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">
                    Loading...
                </div>
            ) : series.length === 0 ? (
                <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">
                    No data
                </div>
            ) : (
                <ChartContainer config={latencyConfig} className="h-44 w-full">
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
                                    formatter={(v) => `${Math.round(Number(v))} ms`}
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
                        <Area
                            type="monotone"
                            dataKey="p90_response_ms"
                            stroke="var(--color-p90_response_ms)"
                            fill="none"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ChartContainer>
            )}
        </SectionCard>
    );
}

// ---------------------------------------------------------------------------
// Traffic tab
// ---------------------------------------------------------------------------

function TrafficTab({ range }: { range: LogRange }) {
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
    const agentsQuery = useQuery({ queryKey: ["agents"], queryFn: getAgents });

    // Real agent names; metric columns stay dummy (cycled) until a per-agent
    // metrics endpoint exists.
    const agentRows = (agentsQuery.data?.data ?? []).map((agent, i) => ({
        ...trafficDummy.agents[i % trafficDummy.agents.length],
        id: agent.id,
        name: agent.name,
    }));

    const summary = summaryQuery.data?.data;
    const series = (timeseriesQuery.data?.data ?? []).map((p) => ({
        ...p,
        label: formatBucket(p.bucket, range),
    }));

    const successRate =
        summary != null ? `${(summary.success_rate * 100).toFixed(1)}%` : "—";

    return (
        <div className="space-y-4">
            {/* KPI row — real where available, dummy for HR-specific */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    label="Conversations"
                    value={
                        summary != null
                            ? summary.uniq_conversations.toLocaleString()
                            : "—"
                    }
                    helper={
                        summary != null
                            ? `${summary.uniq_agents} agent${
                                  summary.uniq_agents === 1 ? "" : "s"
                              } · ${summary.avg_messages_per_convo.toFixed(
                                  1,
                              )} msg/convo`
                            : "Loading..."
                    }
                    live
                />
                <KpiCard
                    label="Success rate"
                    value={successRate}
                    helper={
                        summary != null
                            ? `${summary.success_count} of ${summary.total} requests`
                            : "Loading..."
                    }
                    live
                />
                <KpiCard
                    label="Avg latency"
                    value={
                        summary != null
                            ? `${fmt(summary.success_avg_response_ms)} ms`
                            : "—"
                    }
                    helper={
                        summary != null
                            ? `p95 ${fmt(summary.p95_response_ms)} ms`
                            : "Loading..."
                    }
                    live
                />
                <KpiCard
                    label="Token usage"
                    value={trafficDummy.tokenUsage.value}
                    helper={trafficDummy.tokenUsage.helper}
                />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <VolumeTrend
                    series={series}
                    isPending={timeseriesQuery.isPending}
                />
                <LatencyTrend
                    series={series}
                    isPending={timeseriesQuery.isPending}
                />
            </div>

            {/* Analytics grid — dummy HR sections */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* ponytail: hidden for now, wanted later
                <SectionCard title="Token Analytics" badge="sample">
                    <BarList items={trafficDummy.tokenMix} />
                </SectionCard>
                <SectionCard title="Cost Split" badge="sample">
                    <BarList items={trafficDummy.costMetrics} />
                </SectionCard>
                */}
                <DonutCard
                    title="Question Intent Analytics"
                    items={trafficDummy.intents}
                    badge="sample"
                />
                <SectionCard title="Top Employee Questions" badge="sample">
                    <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                        {trafficDummy.topQuestions.map((q) => (
                            <li key={q}>{q}</li>
                        ))}
                    </ol>
                </SectionCard>
                <SectionCard title="Channel Split" badge="sample">
                    <BarList items={trafficDummy.channels} />
                </SectionCard>
                <SectionCard title="Safety & Governance" badge="sample">
                    <BarList items={trafficDummy.safetyMetrics} />
                </SectionCard>
            </div>

            <SectionCard title="Per Agent LLM Metrics" badge="sample">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Agent</TableHead>
                            <TableHead>Success</TableHead>
                            <TableHead>Tokens</TableHead>
                            <TableHead>Avg Latency</TableHead>
                            <TableHead>Throughput</TableHead>
                            <TableHead>TTFT</TableHead>
                            <TableHead>Fallback</TableHead>
                            <TableHead>CSAT</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {agentRows.map((a) => (
                            <TableRow key={a.id}>
                                <TableCell className="font-medium">
                                    {a.name}
                                </TableCell>
                                <TableCell>{a.success}</TableCell>
                                <TableCell>{a.tokens}</TableCell>
                                <TableCell>{a.avgLatency}</TableCell>
                                <TableCell>{a.throughput}</TableCell>
                                <TableCell>{a.ttft}</TableCell>
                                <TableCell>{a.fallback}</TableCell>
                                <TableCell>{a.csat}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </SectionCard>

            <SectionCard title="Operational Alerts" badge="sample">
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {trafficDummy.alerts.map((a) => (
                        <li
                            key={a}
                            className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
                        >
                            {a}
                        </li>
                    ))}
                </ul>
            </SectionCard>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Employee analytics tab (fully dummy)
// ---------------------------------------------------------------------------

// ponytail: hidden for now, wanted later. Restore this function and re-enable
// the Tabs block + ternary in RouteComponent to bring the tab back.
/* eslint-disable */
// @ts-nocheck-disabled
/*
function EmployeeTab() {
    const e = employeeDummy;
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {e.kpis.map((k) => (
                    <KpiCard
                        key={k.label}
                        label={k.label}
                        value={k.value}
                        helper={k.helper}
                    />
                ))}
            </div>

            <SectionCard title="Headcount projection" badge="sample" className="lg:col-span-2">
                <ChartContainer
                    config={{ value: { label: "Headcount", color: "var(--chart-1)" } }}
                    className="h-40 w-full"
                >
                    <AreaChart data={e.headcountTrend}>
                        <defs>
                            <linearGradient id="hcFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.28} />
                                <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="value" stroke="var(--color-value)" fill="url(#hcFill)" strokeWidth={2} />
                    </AreaChart>
                </ChartContainer>
            </SectionCard>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <SectionCard title="Revenue by Division" badge="sample">
                    <BarList items={e.revenueByDivision} />
                </SectionCard>
                <SectionCard title="Churn by Division" badge="sample">
                    <BarList items={e.churnByDivision} />
                </SectionCard>
                <DonutCard
                    title="Performance Prediction Mix"
                    items={e.performanceMix}
                    badge="sample"
                />
                <SectionCard title="Skill Gap Heatmap" badge="sample">
                    <BarList items={e.skillGaps} />
                </SectionCard>
                <SectionCard title="Talent Segment Mix" badge="sample">
                    <BarList items={e.talentSegments} />
                </SectionCard>
                <SectionCard title="Mutation Readiness" badge="sample">
                    <BarList items={e.mutationReadiness} />
                </SectionCard>
            </div>

            <SectionCard title="Division Risk Matrix" badge="sample">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Division</TableHead>
                            <TableHead>Churn</TableHead>
                            <TableHead>Performance</TableHead>
                            <TableHead>Revenue</TableHead>
                            <TableHead>Recommended Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {e.riskMatrix.map((r) => (
                            <TableRow key={r.division}>
                                <TableCell className="font-medium">
                                    {r.division}
                                </TableCell>
                                <TableCell>{r.churn}</TableCell>
                                <TableCell>{r.performance}</TableCell>
                                <TableCell>{r.revenue}</TableCell>
                                <TableCell className="text-muted-foreground">
                                    {r.action}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </SectionCard>

            <SectionCard
                title="Employee Profiles, Churn, Performance & Mutation Insight"
                badge="sample"
            >
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Division</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Churn</TableHead>
                            <TableHead>Performance</TableHead>
                            <TableHead>Revenue Impact</TableHead>
                            <TableHead>Mutation/Reorg Insight</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {e.profiles.map((p) => (
                            <TableRow key={p.name}>
                                <TableCell className="font-medium">
                                    {p.name}
                                </TableCell>
                                <TableCell>{p.division}</TableCell>
                                <TableCell>{p.role}</TableCell>
                                <TableCell>{p.churn}</TableCell>
                                <TableCell>{p.performance}</TableCell>
                                <TableCell>{p.revenueImpact}</TableCell>
                                <TableCell className="text-muted-foreground">
                                    {p.mutation}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </SectionCard>

            <SectionCard title="Executive HR Insights" badge="sample">
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {e.insights.map((i) => (
                        <li
                            key={i}
                            className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
                        >
                            {i}
                        </li>
                    ))}
                </ul>
            </SectionCard>
        </div>
    );
}
*/
/* eslint-enable */

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

// ponytail: DashMode returns with the Employee Analytics tab.
// type DashMode = "traffic" | "employee";

function RouteComponent() {
    const [range, setRange] = useState<LogRange>("24h");

    return (
        <div className="flex-1 space-y-5 overflow-y-auto p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight">
                        HR Dashboard
                    </h1>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                        Global traffic analytics and employee intelligence for
                        HR leaders.
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
                </div>
            </div>

            {/* ponytail: Employee Analytics tab hidden for now, wanted later.
                Restore the Tabs + ternary (and EmployeeTab) to bring it back.
            <Tabs value={mode} onValueChange={(v) => setMode(v as DashMode)}>
                <TabsList>
                    <TabsTrigger value="traffic">Dashboard Traffic</TabsTrigger>
                    <TabsTrigger value="employee">
                        Employee Analytics
                    </TabsTrigger>
                </TabsList>
            </Tabs>
            {mode === "traffic" ? <TrafficTab range={range} /> : <EmployeeTab />}
            */}

            <TrafficTab range={range} />
        </div>
    );
}
