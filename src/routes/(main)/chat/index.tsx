import { getAgents, type Agent } from "@/api/agents";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Bot, Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";
import { ChatSanbox } from "../agents/-ChatSandbox";

export const Route = createFileRoute("/(main)/chat/")({
    component: RouteComponent,
});

function AgentSwitcher({
    agents,
    selected,
    onSelect,
}: {
    agents: Agent[];
    selected: Agent | null;
    onSelect: (agent: Agent) => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors">
                    <Bot className="size-4 text-muted-foreground" />
                    <span className="max-w-40 truncate">
                        {selected?.name ?? "Select agent"}
                    </span>
                    <ChevronsUpDown className="size-3.5 text-muted-foreground" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                {agents.map((agent) => (
                    <DropdownMenuItem
                        key={agent.id}
                        onSelect={() => onSelect(agent)}
                        className="flex items-center gap-2"
                    >
                        <Bot className="size-4 text-muted-foreground shrink-0" />
                        <span className="flex-1 truncate">{agent.name}</span>
                        <Check
                            className={cn(
                                "size-4 shrink-0",
                                selected?.id === agent.id
                                    ? "opacity-100"
                                    : "opacity-0",
                            )}
                        />
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function RouteComponent() {
    const {
        data: agents,
        isPending,
        isError,
    } = useQuery({
        queryKey: ["agents"],
        queryFn: getAgents,
    });

    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Default to the first agent once the list loads.
    useEffect(() => {
        if (!selectedId && agents?.data?.length) {
            setSelectedId(agents.data[0].id);
        }
    }, [agents, selectedId]);

    const selected =
        agents?.data?.find((a) => a.id === selectedId) ?? null;

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="shrink-0 flex items-center gap-4 border-b bg-background px-6 py-4">
                <div className="min-w-0 flex-1">
                    <h1 className="font-heading text-2xl font-semibold">Chat</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Chat with any of your agents.
                    </p>
                </div>
                {agents?.data?.length ? (
                    <AgentSwitcher
                        agents={agents.data}
                        selected={selected}
                        onSelect={(agent) => setSelectedId(agent.id)}
                    />
                ) : null}
            </div>

            <div className="flex-1 overflow-hidden">
                {isPending ? (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-sm text-muted-foreground">
                            Loading agents...
                        </p>
                    </div>
                ) : isError ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2">
                        <Bot className="size-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                            Failed to load agents
                        </p>
                    </div>
                ) : !selected ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2">
                        <Bot className="size-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                            No agents found
                        </p>
                    </div>
                ) : (
                    <ChatSanbox
                        key={selected.id}
                        agentId={selected.id}
                        agentName={selected.name}
                    />
                )}
            </div>
        </div>
    );
}
