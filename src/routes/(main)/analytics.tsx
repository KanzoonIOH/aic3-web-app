import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/(main)/analytics")({
    component: RouteComponent,
});

// ─── Data ─────────────────────────────────────────────────────────────────────

type Range = "7d" | "30d" | "90d";

const DATA: Record<
    Range,
    {
        labels: string[];
        contain: number[];
        escalate: number[];
        resBot: number[];
        resHuman: number[];
        kpi: { conv: string; saving: string; contain: number };
    }
> = {
    "7d": {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        contain: [74, 76, 75, 78, 77, 80, 78],
        escalate: [26, 24, 25, 22, 23, 20, 22],
        resBot: [4.2, 3.9, 4.5, 4.1, 3.8, 3.6, 4.0],
        resHuman: [18, 21, 19, 20, 17, 23, 19],
        kpi: { conv: "12,480", saving: "Rp 186M", contain: 78 },
    },
    "30d": {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
        contain: [72, 74, 76, 78],
        escalate: [28, 26, 24, 22],
        resBot: [4.5, 4.2, 4.0, 3.9],
        resHuman: [20, 19, 18, 19],
        kpi: { conv: "51,200", saving: "Rp 762M", contain: 78 },
    },
    "90d": {
        labels: ["January", "February", "March"],
        contain: [68, 73, 78],
        escalate: [32, 27, 22],
        resBot: [5.2, 4.5, 3.9],
        resHuman: [22, 20, 19],
        kpi: { conv: "148,900", saving: "Rp 2.1B", contain: 78 },
    },
};

const HOURLY_DATA = [
    { hour: "00:00", bot: 310, both: 0 },
    { hour: "02:00", bot: 180, both: 0 },
    { hour: "04:00", bot: 120, both: 0 },
    { hour: "06:00", bot: 90, both: 0 },
    { hour: "08:00", bot: 60, both: 640 },
    { hour: "10:00", bot: 0, both: 1100 },
    { hour: "12:00", bot: 0, both: 1250 },
    { hour: "14:00", bot: 0, both: 1380 },
    { hour: "16:00", bot: 0, both: 1200 },
    { hour: "18:00", bot: 0, both: 980 },
    { hour: "20:00", bot: 0, both: 0 },
    { hour: "22:00", bot: 280, both: 0 },
];

const SENTIMENT_DATA = [
    { day: "Mon", positive: 58, negative: 16 },
    { day: "Tue", positive: 61, negative: 15 },
    { day: "Wed", positive: 60, negative: 17 },
    { day: "Thu", positive: 63, negative: 14 },
    { day: "Fri", positive: 62, negative: 13 },
    { day: "Sat", positive: 65, negative: 12 },
    { day: "Sun", positive: 62, negative: 14 },
];

const ESCALATION_REASONS = [
    { reason: "Complex billing dispute", pct: 34 },
    { reason: "Account verification needed", pct: 22 },
    { reason: "Repeated failed attempts", pct: 18 },
    { reason: "User requested human", pct: 15 },
    { reason: "Out-of-scope topic", pct: 11 },
];

const TOP_INTENTS = [
    { name: "Order status", pct: 28 },
    { name: "Refund request", pct: 21 },
    { name: "Password reset", pct: 17 },
    { name: "Product info", pct: 13 },
    { name: "Shipping inquiry", pct: 9 },
    { name: "Others", pct: 12 },
];

const CHANNELS = [
    { name: "Web chat", count: "5,820", share: "47%" },
    { name: "WhatsApp", count: "4,190", share: "34%" },
    { name: "Mobile app", count: "1,740", share: "14%" },
    { name: "Instagram", count: "730", share: "5%" },
];

// ─── Chart configs ─────────────────────────────────────────────────────────────

const containmentConfig: ChartConfig = {
    containment: { label: "Containment %", color: "var(--chart-2)" },
    escalation: { label: "Escalation %", color: "var(--destructive)" },
};

const resolutionConfig: ChartConfig = {
    bot: { label: "Bot", color: "var(--chart-2)" },
    human: {
        label: "Human (after escalation)",
        color: "var(--muted-foreground)",
    },
};

const sentimentConfig: ChartConfig = {
    positive: { label: "Positive", color: "var(--chart-2)" },
    negative: { label: "Negative", color: "var(--destructive)" },
};

const peakConfig: ChartConfig = {
    bot: { label: "Bot only (off-hours)", color: "var(--chart-3)" },
    both: { label: "Bot + human", color: "var(--chart-1)" },
};

// ─── Small helpers ─────────────────────────────────────────────────────────────

function BarProgress({
    label,
    pct,
    color = "bg-chart-2",
}: {
    label: string;
    pct: number;
    color?: string;
}) {
    return (
        <div className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-xs text-muted-foreground">
                {label}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="w-8 text-right text-xs font-medium tabular-nums">
                {pct}%
            </span>
        </div>
    );
}

// ─── Route component ──────────────────────────────────────────────────────────

function RouteComponent() {
    const [range, setRange] = useState<Range>("7d");
    const d = DATA[range];

    const containData = useMemo(
        () =>
            d.labels.map((l, i) => ({
                label: l,
                containment: d.contain[i],
                escalation: d.escalate[i],
            })),
        [d],
    );

    const resData = useMemo(
        () =>
            d.labels.map((l, i) => ({
                label: l,
                bot: d.resBot[i],
                human: d.resHuman[i],
            })),
        [d],
    );

    return (
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="font-heading text-lg font-semibold">
                        AI Support Agent — Value Dashboard
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Customer support bot performance &amp; ROI
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Range toggle */}
                    <div className="flex rounded-lg border overflow-hidden text-xs">
                        {(["7d", "30d", "90d"] as Range[]).map((r) => (
                            <Button
                                key={r}
                                variant={range === r ? "default" : "ghost"}
                                size="sm"
                                className="rounded-none text-xs h-8 px-3"
                                onClick={() => setRange(r)}
                            >
                                {r}
                            </Button>
                        ))}
                    </div>
                    <span className="text-xs text-muted-foreground border rounded-lg px-3 py-1.5 bg-card">
                        Mar 7 – Apr 6, 2026
                    </span>
                </div>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    {
                        label: "Containment rate",
                        value: `${d.kpi.contain}%`,
                        sub: "+4.2% vs last period",
                        subClass: "text-chart-3",
                        accent: "bg-chart-2",
                    },
                    {
                        label: "Conversations handled",
                        value: d.kpi.conv,
                        sub: "+11% vs last period",
                        subClass: "text-chart-3",
                        accent: "bg-chart-3",
                    },
                    {
                        label: "Est. cost savings",
                        value: d.kpi.saving,
                        sub: "this period",
                        subClass: "text-muted-foreground",
                        accent: "bg-amber-400",
                    },
                    {
                        label: "CSAT (bot)",
                        value: "4.3",
                        sub: "vs 4.1 human avg",
                        subClass: "text-muted-foreground",
                        accent: "bg-violet-400",
                    },
                ].map(({ label, value, sub, subClass, accent }) => (
                    <Card
                        key={label}
                        size="sm"
                        className="relative overflow-hidden"
                    >
                        <div
                            className={`absolute top-0 right-0 w-1 h-full ${accent}`}
                        />
                        <CardContent className="pt-">
                            <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">
                                {label}
                            </p>
                            <p className="text-2xl font-semibold font-heading leading-none">
                                {value}
                            </p>
                            <p className={`text-xs mt-1.5 ${subClass}`}>
                                {sub}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Row 1: Trend charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card size="sm">
                    <CardHeader>
                        <CardTitle>Containment rate over time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer
                            config={containmentConfig}
                            className="h-52 w-full"
                        >
                            <LineChart data={containData}>
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
                                    tickFormatter={(v) => `${v}%`}
                                    domain={[0, 100]}
                                />
                                <ChartTooltip
                                    content={
                                        <ChartTooltipContent
                                            formatter={(v) => `${v}%`}
                                        />
                                    }
                                />
                                <Line
                                    type="monotone"
                                    dataKey="containment"
                                    stroke="var(--color-containment)"
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="escalation"
                                    stroke="var(--color-escalation)"
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                />
                            </LineChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card size="sm">
                    <CardHeader>
                        <CardTitle>Resolution time (minutes)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer
                            config={resolutionConfig}
                            className="h-52 w-full"
                        >
                            <BarChart data={resData} barGap={4}>
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
                                    tickFormatter={(v) => `${v}m`}
                                />
                                <ChartTooltip
                                    content={
                                        <ChartTooltipContent
                                            formatter={(v) => `${v} min`}
                                        />
                                    }
                                />
                                <Bar
                                    dataKey="bot"
                                    fill="var(--color-bot)"
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    dataKey="human"
                                    fill="var(--color-human)"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Row 2: CSAT + Escalation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card size="sm">
                    <CardHeader>
                        <CardTitle>CSAT — bot vs human</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Score comparison */}
                        <div className="flex gap-6">
                            <div className="flex-1 text-center">
                                <p className="text-3xl font-semibold font-heading text-chart-3">
                                    4.3
                                </p>
                                <div className="flex justify-center gap-0.5 mt-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <div
                                            key={s}
                                            className={`w-2.5 h-2.5 rounded-sm ${s <= 4 ? "bg-amber-400" : "bg-muted"}`}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1.5">
                                    AI bot
                                </p>
                            </div>
                            <Separator
                                orientation="vertical"
                                className="h-auto"
                            />
                            <div className="flex-1 text-center">
                                <p className="text-3xl font-semibold font-heading text-muted-foreground">
                                    4.1
                                </p>
                                <div className="flex justify-center gap-0.5 mt-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <div
                                            key={s}
                                            className={`w-2.5 h-2.5 rounded-sm ${s <= 4 ? "bg-amber-300" : "bg-muted"}`}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1.5">
                                    Human agents
                                </p>
                            </div>
                        </div>

                        <Separator />

                        {/* FCR */}
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-3">
                                FCR breakdown
                            </p>
                            <div className="space-y-2">
                                <BarProgress label="Bot FCR" pct={71} />
                                <BarProgress
                                    label="Human FCR"
                                    pct={64}
                                    color="bg-muted-foreground/40"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card size="sm">
                    <CardHeader>
                        <CardTitle>Escalation reasons</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                            {ESCALATION_REASONS.map(({ reason, pct }, i) => (
                                <div
                                    key={reason}
                                    className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                                >
                                    <span className="text-xs text-foreground">
                                        {reason}
                                    </span>
                                    <span
                                        className={`text-xs font-medium tabular-nums ${i < 2 ? "text-destructive" : i < 4 ? "text-amber-500" : "text-muted-foreground"}`}
                                    >
                                        {pct}%
                                    </span>
                                </div>
                            ))}
                        </div>

                        <Separator />

                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
                                Fallback / no-answer rate
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-semibold font-heading">
                                    6.1%
                                </span>
                                <span className="text-xs text-chart-3">
                                    −1.4% vs last period
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Row 3: Intents, Sentiment, Channels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card size="sm">
                    <CardHeader>
                        <CardTitle>Top intents handled</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2.5">
                            {TOP_INTENTS.map(({ name, pct }, i) => (
                                <div
                                    key={name}
                                    className="flex items-center gap-2"
                                >
                                    <span className="text-[11px] text-muted-foreground/50 w-4">
                                        {i + 1}
                                    </span>
                                    <span className="text-xs flex-1">
                                        {name}
                                    </span>
                                    <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${i < 5 ? "bg-chart-3" : "bg-muted-foreground/40"}`}
                                            style={{
                                                width: `${(pct / 28) * 100}%`,
                                            }}
                                        />
                                    </div>
                                    <span className="text-[11px] text-muted-foreground w-7 text-right tabular-nums">
                                        {pct}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card size="sm">
                    <CardHeader>
                        <CardTitle>Sentiment trend</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ChartContainer
                            config={sentimentConfig}
                            className="h-32 w-full"
                        >
                            <LineChart data={SENTIMENT_DATA}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="day"
                                    tick={{ fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => `${v}%`}
                                    domain={[0, 80]}
                                />
                                <ChartTooltip
                                    content={
                                        <ChartTooltipContent
                                            formatter={(v) => `${v}%`}
                                        />
                                    }
                                />
                                <Line
                                    type="monotone"
                                    dataKey="positive"
                                    stroke="var(--color-positive)"
                                    strokeWidth={2}
                                    dot={{ r: 2 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="negative"
                                    stroke="var(--color-negative)"
                                    strokeWidth={2}
                                    dot={{ r: 2 }}
                                />
                            </LineChart>
                        </ChartContainer>

                        <div className="space-y-2">
                            <BarProgress label="Positive" pct={62} />
                            <BarProgress
                                label="Neutral"
                                pct={24}
                                color="bg-muted-foreground/40"
                            />
                            <BarProgress
                                label="Negative"
                                pct={14}
                                color="bg-destructive/70"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card size="sm">
                    <CardHeader>
                        <CardTitle>Channel breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-2">
                            {CHANNELS.map(({ name, count, share }) => (
                                <div
                                    key={name}
                                    className="rounded-xl bg-muted/50 p-3"
                                >
                                    <p className="text-[11px] text-muted-foreground mb-1">
                                        {name}
                                    </p>
                                    <p className="text-xl font-semibold font-heading">
                                        {count}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {share} of volume
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Row 4: Peak load */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card size="sm">
                    <CardHeader>
                        <CardTitle>Peak load coverage (off-hours)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <ChartContainer
                            config={peakConfig}
                            className="h-44 w-full"
                        >
                            <BarChart data={HOURLY_DATA} barGap={0}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="hour"
                                    tick={{ fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <ChartTooltip
                                    content={<ChartTooltipContent />}
                                />
                                <Bar
                                    dataKey="bot"
                                    name="Bot only"
                                    stackId="a"
                                    fill="var(--color-bot)"
                                />
                                <Bar
                                    dataKey="both"
                                    name="Bot + human"
                                    stackId="a"
                                    fill="var(--color-both)"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ChartContainer>

                        <p className="text-xs text-muted-foreground">
                            Bot handles 100% of conversations outside
                            09:00–18:00 WIB when no agents are online.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
