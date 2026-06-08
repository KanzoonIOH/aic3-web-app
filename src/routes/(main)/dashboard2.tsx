import { getLogSummary, getLogTimeseries } from "@/api/logs";
import { LogsTable } from "@/components/logs-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
    Activity,
    CheckCircle2,
    MessagesSquare,
    Timer,
} from "lucide-react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
} from "recharts";

export const Route = createFileRoute("/(main)/dashboard2")({
    component: RouteComponent,
});

const volumeConfig: ChartConfig = {
    total: { label: "Requests", color: "var(--chart-1)" },
    success_count: { label: "Successful", color: "var(--chart-2)" },
};

const responseConfig: ChartConfig = {
    avg_response_ms: { label: "Avg response", color: "var(--chart-3)" },
};

function formatBucket(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
    });
}

function StatCard({
    label,
    value,
    sub,
    icon: Icon,
    accent,
}: {
    label: string;
    value: string;
    sub: string;
    icon: React.ElementType;
    accent: string;
}) {
    return (
        <Card size="sm" className="relative overflow-hidden">
            <div className={`absolute top-0 right-0 h-full w-1 ${accent}`} />
            <CardContent>
                <div className="flex items-start justify-between">
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">
                        {label}
                    </p>
                    <Icon className="size-4 text-muted-foreground/60" />
                </div>
                <p className="text-2xl font-semibold font-heading leading-none">
                    {value}
                </p>
                <p className="text-xs mt-1.5 text-muted-foreground">{sub}</p>
            </CardContent>
        </Card>
    );
}

function RouteComponent() {
    const summaryQuery = useQuery({
        queryKey: ["logs", "summary", "all"],
        queryFn: () => getLogSummary(),
    });

    const timeseriesQuery = useQuery({
        queryKey: ["logs", "timeseries", "all"],
        queryFn: () => getLogTimeseries(),
    });

    const summary = summaryQuery.data?.data;
    const series = (timeseriesQuery.data?.data ?? []).map((p) => ({
        ...p,
        label: formatBucket(p.bucket),
    }));

    const successRate =
        summary != null ? `${(summary.success_rate * 100).toFixed(1)}%` : "—";
    const avgResponse =
        summary != null
            ? `${Math.round(summary.avg_response_ms).toLocaleString()} ms`
            : "—";

    return (
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="font-heading text-lg font-semibold">
                    Logs Dashboard
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Request activity, success rate &amp; latency
                </p>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                    label="Total requests"
                    value={
                        summary != null
                            ? summary.total.toLocaleString()
                            : "—"
                    }
                    sub={
                        summary != null
                            ? `${summary.success_count.toLocaleString()} successful`
                            : "Loading..."
                    }
                    icon={Activity}
                    accent="bg-chart-1"
                />
                <StatCard
                    label="Success rate"
                    value={successRate}
                    sub="across all requests"
                    icon={CheckCircle2}
                    accent="bg-chart-2"
                />
                <StatCard
                    label="Avg response"
                    value={avgResponse}
                    sub="mean latency"
                    icon={Timer}
                    accent="bg-chart-3"
                />
                <StatCard
                    label="Conversations"
                    value={
                        summary != null
                            ? summary.uniq_conversations.toLocaleString()
                            : "—"
                    }
                    sub="unique sessions"
                    icon={MessagesSquare}
                    accent="bg-violet-400"
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card size="sm">
                    <CardHeader>
                        <CardTitle>Request volume over time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {timeseriesQuery.isPending ? (
                            <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
                                Loading...
                            </div>
                        ) : series.length === 0 ? (
                            <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
                                No data
                            </div>
                        ) : (
                            <ChartContainer
                                config={volumeConfig}
                                className="h-52 w-full"
                            >
                                <AreaChart data={series}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                    />
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
                                        allowDecimals={false}
                                    />
                                    <ChartTooltip
                                        content={<ChartTooltipContent />}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="total"
                                        stroke="var(--color-total)"
                                        fill="var(--color-total)"
                                        fillOpacity={0.15}
                                        strokeWidth={2}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="success_count"
                                        stroke="var(--color-success_count)"
                                        fill="var(--color-success_count)"
                                        fillOpacity={0.15}
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>

                <Card size="sm">
                    <CardHeader>
                        <CardTitle>Avg response time (ms)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {timeseriesQuery.isPending ? (
                            <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
                                Loading...
                            </div>
                        ) : series.length === 0 ? (
                            <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
                                No data
                            </div>
                        ) : (
                            <ChartContainer
                                config={responseConfig}
                                className="h-52 w-full"
                            >
                                <BarChart data={series}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                    />
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
                                        tickFormatter={(v) =>
                                            `${Math.round(v)}`
                                        }
                                    />
                                    <ChartTooltip
                                        content={
                                            <ChartTooltipContent
                                                formatter={(v) =>
                                                    `${Math.round(Number(v)).toLocaleString()} ms`
                                                }
                                            />
                                        }
                                    />
                                    <Bar
                                        dataKey="avg_response_ms"
                                        fill="var(--color-avg_response_ms)"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent logs */}
            <Card size="sm">
                <CardHeader>
                    <CardTitle>Recent messages</CardTitle>
                </CardHeader>
                <CardContent>
                    <LogsTable />
                </CardContent>
            </Card>
        </div>
    );
}
