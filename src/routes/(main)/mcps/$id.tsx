import { getMcp } from "@/api/mcps";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Wrench } from "lucide-react";

export const Route = createFileRoute("/(main)/mcps/$id")({
    component: RouteComponent,
});

function RouteComponent() {
    const { id } = Route.useParams();

    const {
        data: mcp,
        isPending,
        isError,
    } = useQuery({
        queryKey: ["mcps", id],
        queryFn: () => getMcp(id),
    });

    if (isPending) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading MCP...</p>
            </div>
        );
    }

    if (isError || !mcp) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                    Failed to load MCP
                </p>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                <div className="sticky top-0 px-6 py-4 bg-background border-b">
                    <h1 className="font-heading text-2xl font-semibold">
                        {mcp.data.name}
                    </h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {mcp.data.description}
                    </p>
                </div>

                <div className="p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <Wrench className="size-4" />
                            {mcp.data.tool_count} tools
                        </span>
                        <span>
                            Status:{" "}
                            <span
                                className={
                                    mcp.data.is_active
                                        ? "text-green-500"
                                        : "text-muted-foreground"
                                }
                            >
                                {mcp.data.is_active ? "Active" : "Inactive"}
                            </span>
                        </span>
                    </div>

                    {mcp.data.endpoint_url && (
                        <div className="rounded-lg border p-4">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                                Endpoint URL
                            </p>
                            <p className="text-sm font-mono break-all">
                                {mcp.data.endpoint_url}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
