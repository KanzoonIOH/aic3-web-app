import { getAgents, type Agent } from "@/api/agents";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
    BookIcon,
    Bot,
    ChevronRight,
    LayoutGrid,
    List,
    Plug,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/(main)/agents/")({
    component: RouteComponent,
});

function AgentInitialsAvatar({
    name,
    className,
}: {
    name: string;
    className?: string;
}) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    const initial = (parts[0][0] + parts[1][0]).toUpperCase();
    return (
        <div
            className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary border",
                className,
            )}
        >
            {initial}
        </div>
    );
}

function AgentCard({ agent }: { agent: Agent }) {
    return (
        <Card className="rounded-lg bg-inherit flex flex-col gap-1 overflow-hidden p-2 pl-4">
            <div className="flex items-center gap-3 pt-2">
                <AgentInitialsAvatar name={agent.name} />
                <span className="truncate font-medium text-lg">
                    {agent.name}
                </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
                {agent.description}
            </p>
            <div className="flex justify-between items-center pt-1 mt-auto">
                <div className="flex gap-4">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <BookIcon className="size-3" />
                        {agent.tools}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Plug className="size-3" />
                        {agent.mcps}
                    </span>
                </div>
                <Button size={"sm"} className="text-xs" asChild>
                    <Link to="/agents/$id" params={{ id: agent.id }}>
                        Details
                        <ChevronRight className="size-3 hover:translate-x-2" />
                    </Link>
                </Button>
            </div>
        </Card>
    );
}

function AgentListRow({ agent }: { agent: Agent }) {
    return (
        <div className="border rounded-lg flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
            <AgentInitialsAvatar name={agent.name} className="size-8 text-xs" />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{agent.name}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {agent.description}
                </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                    <BookIcon className="size-3" />
                    {agent.tools}
                </span>
                <span className="flex items-center gap-1">
                    <Plug className="size-3" />
                    {agent.mcps}
                </span>
            </div>
            <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground"
                asChild
            >
                <Link to="/agents/$id" params={{ id: agent.id }}>
                    <ChevronRight className="size-4" />
                </Link>
            </Button>
        </div>
    );
}

function RouteComponent() {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const {
        data: agents = [],
        isPending,
        isError,
    } = useQuery({
        queryKey: ["agents"],
        queryFn: getAgents,
    });

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                <div className="sticky top-0 px-6 py-4 flex flex-wrap items-start gap-4 bg-background border-b">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            All Agents
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground flex gap-2"></p>
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <div className="flex items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={cn(
                                    "rounded-md p-1.5 transition-colors",
                                    viewMode === "grid"
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground",
                                )}
                            >
                                <LayoutGrid className="size-3.5" />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={cn(
                                    "rounded-md p-1.5 transition-colors",
                                    viewMode === "list"
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground",
                                )}
                            >
                                <List className="size-3.5" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {isPending ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-16">
                            <p className="text-sm text-muted-foreground">
                                Loading agents...
                            </p>
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
                            <Bot className="size-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">
                                Failed to load agents
                            </p>
                        </div>
                    ) : agents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
                            <Bot className="size-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">
                                No agents found
                            </p>
                        </div>
                    ) : viewMode === "grid" ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {agents.map((agent) => (
                                <AgentCard key={agent.id} agent={agent} />
                            ))}
                        </div>
                    ) : (
                        // <div className="flex flex-col divide-y rounded-lg border">
                        <div className="flex flex-col gap-2">
                            {agents.map((agent) => (
                                <AgentListRow key={agent.id} agent={agent} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
