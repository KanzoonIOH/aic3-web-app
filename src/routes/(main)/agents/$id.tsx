import { getAgent } from "@/api/agents";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BookIcon, Plug } from "lucide-react";

export const Route = createFileRoute("/(main)/agents/$id")({
    component: RouteComponent,
});

function RouteComponent() {
    const { id } = Route.useParams();

    const { data: agent, isPending, isError } = useQuery({
        queryKey: ["agents", id],
        queryFn: () => getAgent(id),
    });

    if (isPending) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading agent...</p>
            </div>
        );
    }

    if (isError || !agent) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">Failed to load agent</p>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                <div className="sticky top-0 px-6 py-4 bg-background border-b">
                    <h1 className="font-heading text-2xl font-semibold">{agent.name}</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">{agent.description}</p>
                </div>

                <div className="p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <BookIcon className="size-4" />
                            {agent.tools} tools
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Plug className="size-4" />
                            {agent.mcps} MCPs
                        </span>
                        <span>
                            Status:{" "}
                            <span className={agent.is_active ? "text-green-500" : "text-muted-foreground"}>
                                {agent.is_active ? "Active" : "Inactive"}
                            </span>
                        </span>
                    </div>

                    {agent.webhook_uri && (
                        <div className="rounded-lg border p-4">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Webhook URI</p>
                            <p className="text-sm font-mono break-all">{agent.webhook_uri}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
