import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
    Activity,
    Clock,
    Globe,
    MessageSquare,
    MessagesSquare,
    Smartphone,
    Smile,
    ThumbsUp,
    TrendingUp,
    type LucideIcon,
} from "lucide-react";

// ponytail: dummy overview — static numbers, no API. Swap in real metrics later.
// The whole point is to give the tab something to look at.

interface Stat {
    label: string;
    value: string;
    delta: string;
    up: boolean;
    icon: LucideIcon;
}

const STATS: Stat[] = [
    {
        label: "Conversations",
        value: "1,284",
        delta: "+12.4%",
        up: true,
        icon: MessagesSquare,
    },
    {
        label: "Resolution rate",
        value: "87%",
        delta: "+3.1%",
        up: true,
        icon: ThumbsUp,
    },
    {
        label: "Avg. response time",
        value: "1.9s",
        delta: "-0.4s",
        up: true,
        icon: Clock,
    },
    {
        label: "Satisfaction (CSAT)",
        value: "4.6 / 5",
        delta: "-0.1",
        up: false,
        icon: Smile,
    },
];

// 14-day conversation volume (dummy).
const VOLUME = [
    18, 24, 20, 32, 28, 40, 36, 30, 44, 52, 48, 60, 55, 68,
];

const TOP_INTENTS = [
    { label: "Product inquiry", share: 38 },
    { label: "Billing & payment", share: 24 },
    { label: "Booking / activation", share: 19 },
    { label: "Complaint handling", share: 12 },
    { label: "General questions", share: 7 },
];

// Where conversations came from.
const CHANNELS: { label: string; share: number; icon: LucideIcon }[] = [
    { label: "Web widget", share: 46, icon: Globe },
    { label: "WhatsApp", share: 34, icon: Smartphone },
    { label: "In-app chat", share: 20, icon: MessageSquare },
];

// Hourly activity heat (0–100), 24 buckets — a simple activity strip.
const HOURLY = [
    4, 3, 2, 2, 3, 6, 12, 22, 38, 55, 68, 74, 71, 66, 72, 80, 88, 76, 60, 44,
    30, 20, 12, 7,
];

type Sentiment = "positive" | "neutral" | "negative";

const RECENT: {
    user: string;
    intent: string;
    time: string;
    sentiment: Sentiment;
    resolved: boolean;
}[] = [
    {
        user: "Budi Santoso",
        intent: "Asked about IM3 Freedom Internet packages",
        time: "2m ago",
        sentiment: "positive",
        resolved: true,
    },
    {
        user: "Siti Rahayu",
        intent: "Trouble activating a new eSIM",
        time: "11m ago",
        sentiment: "neutral",
        resolved: true,
    },
    {
        user: "Andi Wijaya",
        intent: "Complaint: slow data in Surabaya",
        time: "26m ago",
        sentiment: "negative",
        resolved: false,
    },
    {
        user: "Dewi Lestari",
        intent: "Compared prepaid vs postpaid plans",
        time: "43m ago",
        sentiment: "positive",
        resolved: true,
    },
    {
        user: "Rizky Pratama",
        intent: "Booking home internet installation",
        time: "1h ago",
        sentiment: "neutral",
        resolved: true,
    },
];

const SENTIMENT_STYLES: Record<Sentiment, string> = {
    positive: "bg-green-500/10 text-green-600",
    neutral: "bg-muted text-muted-foreground",
    negative: "bg-destructive/10 text-destructive",
};

function StatCard({ stat }: { stat: Stat }) {
    const Icon = stat.icon;
    return (
        <Card size="sm">
            <CardContent className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                        {stat.label}
                    </span>
                    <Icon className="size-4 text-muted-foreground" />
                </div>
                <span className="text-2xl font-semibold text-foreground">
                    {stat.value}
                </span>
                <span
                    className={
                        stat.up
                            ? "flex items-center gap-1 text-xs text-green-600"
                            : "flex items-center gap-1 text-xs text-destructive"
                    }
                >
                    <TrendingUp
                        className={stat.up ? "size-3" : "size-3 rotate-180"}
                    />
                    {stat.delta} vs last week
                </span>
            </CardContent>
        </Card>
    );
}

// ponytail: agentId accepted for a stable prop contract but unused — dummy
// overview reads no per-agent data yet. void keeps the linter quiet.
export function Overview({ agentId }: { agentId: string }) {
    void agentId;
    const max = Math.max(...VOLUME);
    return (
        <div className="h-full overflow-y-auto px-6 py-6">
            <div className="flex flex-col gap-5">
                <div>
                    <h2 className="text-base font-semibold text-foreground">
                        Overview
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        A snapshot of how this agent has been performing over the
                        last 14 days.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {STATS.map((s) => (
                        <StatCard key={s.label} stat={s} />
                    ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Volume chart */}
                    <Card size="sm" className="lg:col-span-2">
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex items-center gap-1.5">
                                <Activity className="size-4 text-primary" />
                                <h3 className="text-sm font-semibold text-foreground">
                                    Conversation volume
                                </h3>
                            </div>
                            <div className="flex h-40 items-end gap-1.5">
                                {VOLUME.map((v, i) => (
                                    <div
                                        key={i}
                                        className="flex-1 rounded-t bg-primary/70 transition-all hover:bg-primary"
                                        style={{
                                            height: `${(v / max) * 100}%`,
                                        }}
                                        title={`${v} conversations`}
                                    />
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Last 14 days
                            </p>
                        </CardContent>
                    </Card>

                    {/* Top intents */}
                    <Card size="sm">
                        <CardContent className="flex flex-col gap-4">
                            <h3 className="text-sm font-semibold text-foreground">
                                Top intents
                            </h3>
                            <div className="flex flex-col gap-3">
                                {TOP_INTENTS.map((intent) => (
                                    <div
                                        key={intent.label}
                                        className="flex flex-col gap-1"
                                    >
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-foreground">
                                                {intent.label}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {intent.share}%
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-muted">
                                            <div
                                                className="h-full rounded-full bg-primary"
                                                style={{
                                                    width: `${intent.share}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Channels */}
                    <Card size="sm">
                        <CardContent className="flex flex-col gap-4">
                            <h3 className="text-sm font-semibold text-foreground">
                                Channels
                            </h3>
                            <div className="flex flex-col gap-3">
                                {CHANNELS.map((c) => {
                                    const Icon = c.icon;
                                    return (
                                        <div
                                            key={c.label}
                                            className="flex flex-col gap-1"
                                        >
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="flex items-center gap-1.5 text-foreground">
                                                    <Icon className="size-3.5 text-muted-foreground" />
                                                    {c.label}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    {c.share}%
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full rounded-full bg-muted">
                                                <div
                                                    className="h-full rounded-full bg-primary"
                                                    style={{
                                                        width: `${c.share}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Hourly activity */}
                    <Card size="sm" className="lg:col-span-2">
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex items-center gap-1.5">
                                <Clock className="size-4 text-primary" />
                                <h3 className="text-sm font-semibold text-foreground">
                                    Activity by hour
                                </h3>
                            </div>
                            <div className="flex h-24 items-end gap-0.5">
                                {HOURLY.map((v, i) => (
                                    <div
                                        key={i}
                                        className="flex-1 rounded-sm bg-primary/30 transition-colors hover:bg-primary/60"
                                        style={{ height: `${v}%` }}
                                        title={`${i}:00 — ${v}% of peak`}
                                    />
                                ))}
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>00:00</span>
                                <span>06:00</span>
                                <span>12:00</span>
                                <span>18:00</span>
                                <span>23:00</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent conversations */}
                <Card size="sm">
                    <CardContent className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground">
                                Recent conversations
                            </h3>
                            <span className="text-xs text-muted-foreground">
                                Last hour
                            </span>
                        </div>
                        <div className="flex flex-col divide-y">
                            {RECENT.map((r, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                                >
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                                        {r.user
                                            .split(" ")
                                            .map((p) => p[0])
                                            .join("")
                                            .slice(0, 2)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-foreground">
                                            {r.user}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {r.intent}
                                        </p>
                                    </div>
                                    <span
                                        className={cn(
                                            "hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize sm:inline-block",
                                            SENTIMENT_STYLES[r.sentiment],
                                        )}
                                    >
                                        {r.sentiment}
                                    </span>
                                    <Badge
                                        variant={
                                            r.resolved ? "outline" : "secondary"
                                        }
                                        className="shrink-0"
                                    >
                                        {r.resolved ? "Resolved" : "Escalated"}
                                    </Badge>
                                    <span className="hidden w-14 shrink-0 text-right text-xs text-muted-foreground md:inline-block">
                                        {r.time}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-muted-foreground/70">
                    Showing sample data — live analytics coming soon.
                </p>
            </div>
        </div>
    );
}
