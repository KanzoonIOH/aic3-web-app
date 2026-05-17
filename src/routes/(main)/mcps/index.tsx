import { getMcps, type Mcp } from "@/api/mcps";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
    ChevronRight,
    LayoutGrid,
    List,
    Plug,
    Wrench,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/(main)/mcps/")({
    component: RouteComponent,
});

function InitialsAvatar({
    name,
    className,
}: {
    name: string;
    className?: string;
}) {
    const parts = name.trim().split(/\s+/);
    const initials =
        parts.length === 1
            ? parts[0][0].toUpperCase()
            : (parts[0][0] + parts[1][0]).toUpperCase();
    return (
        <div
            className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary border",
                className,
            )}
        >
            {initials}
        </div>
    );
}

function McpCard({ mcp }: { mcp: Mcp }) {
    return (
        <Card className="rounded-lg bg-inherit flex flex-col gap-1 overflow-hidden p-2 pl-4">
            <div className="flex items-center gap-3 pt-2">
                <InitialsAvatar name={mcp.name} />
                <span className="truncate font-medium text-lg">{mcp.name}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
                {mcp.description}
            </p>
            <div className="flex justify-between items-center pt-1 mt-auto">
                <div className="flex gap-4">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Wrench className="size-3" />
                        {mcp.tool_count} tools
                    </span>
                </div>
                <Button size={"sm"} className="text-xs" asChild>
                    <Link to="/mcps/$id" params={{ id: mcp.id }}>
                        Details
                        <ChevronRight className="size-3" />
                    </Link>
                </Button>
            </div>
        </Card>
    );
}

function McpListRow({ mcp }: { mcp: Mcp }) {
    return (
        <div className="border rounded-lg flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
            <InitialsAvatar name={mcp.name} className="size-8 text-xs" />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{mcp.name}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {mcp.description}
                </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                    <Wrench className="size-3" />
                    {mcp.tool_count} tools
                </span>
            </div>
            <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground"
                asChild
            >
                <Link to="/mcps/$id" params={{ id: mcp.id }}>
                    <ChevronRight className="size-4" />
                </Link>
            </Button>
        </div>
    );
}

function RouteComponent() {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const {
        data: mcps = [],
        isPending,
        isError,
    } = useQuery({
        queryKey: ["mcps"],
        queryFn: getMcps,
    });

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                <div className="sticky top-0 px-6 py-4 flex flex-wrap items-start gap-4 bg-background border-b">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            All MCPs
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
                                Loading MCPs...
                            </p>
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
                            <Plug className="size-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">
                                Failed to load MCPs
                            </p>
                        </div>
                    ) : mcps.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
                            <Plug className="size-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">
                                No MCPs found
                            </p>
                        </div>
                    ) : viewMode === "grid" ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {mcps.map((mcp) => (
                                <McpCard key={mcp.id} mcp={mcp} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {mcps.map((mcp) => (
                                <McpListRow key={mcp.id} mcp={mcp} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
