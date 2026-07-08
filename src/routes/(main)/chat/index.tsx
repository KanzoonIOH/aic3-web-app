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

// Centered agent picker shown in the welcome hero (before the first message).
function AgentPicker({
    agents,
    selected,
    onSelect,
}: {
    agents: Agent[];
    selected: Agent | null;
    onSelect: (agent: Agent) => void;
}) {
    return (
        <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Chatting with
            </span>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2.5 rounded-full border bg-background px-4 py-2.5 text-sm font-medium shadow-sm transition-colors hover:bg-muted">
                        <span className="flex size-6 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
                            {selected?.image && /^https?:\/\//.test(selected.image) ? (
                                <img src={selected.image} alt="" className="size-full object-cover" />
                            ) : selected?.image ? (
                                <span className="text-sm">{selected.image}</span>
                            ) : (
                                <Bot className="size-3.5" />
                            )}
                        </span>
                        <span className="max-w-56 truncate">
                            {selected?.name ?? "Select agent"}
                        </span>
                        <ChevronsUpDown className="size-4 text-muted-foreground" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-64">
                    {agents.map((agent) => (
                        <DropdownMenuItem
                            key={agent.id}
                            onSelect={() => onSelect(agent)}
                            className="flex items-center gap-2"
                        >
                            <span className="flex size-4 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
                                {agent.image && /^https?:\/\//.test(agent.image) ? (
                                    <img src={agent.image} alt="" className="size-full object-cover" />
                                ) : agent.image ? (
                                    <span className="text-xs">{agent.image}</span>
                                ) : (
                                    <Bot className="size-3" />
                                )}
                            </span>
                            <span className="flex-1 truncate">
                                {agent.name}
                            </span>
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
            {selected?.description?.trim() && (
                <p className="mt-1 max-w-md text-center text-sm text-muted-foreground">
                    {selected.description}
                </p>
            )}
        </div>
    );
}

function RouteComponent() {
    const {
        data: agents,
        isPending,
        isError,
    } = useQuery({
        queryKey: ["agents", "all"],
        // Chat needs the full agent list for the picker, so ask for a large page.
        queryFn: () => getAgents({ limit: 1000 }),
    });

    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Default to the first agent once the list loads.
    useEffect(() => {
        if (!selectedId && agents?.data?.length) {
            setSelectedId(agents.data[0].id);
        }
    }, [agents, selectedId]);

    const selected = agents?.data?.find((a) => a.id === selectedId) ?? null;

    if (isPending) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                    Loading agents...
                </p>
            </div>
        );
    }

    if (isError || !selected) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-2">
                <Bot className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                    {isError ? "Failed to load agents" : "No agents found"}
                </p>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <ChatSanbox
                key={selected.id}
                agentId={selected.id}
                agentName={selected.name}
                dynamicKeys={(selected.webhook_body_fields ?? [])
                    .filter((f) => f.type === "dynamic")
                    .map((f) => f.key)}
                dynamicHeaderKeys={(selected.webhook_header_fields ?? [])
                    .filter((f) => f.type === "dynamic")
                    .map((f) => f.key)}
                outputField={selected.webhook_output_field || "reply"}
                welcomeTitle="Hello there"
                welcomeImage={selected.image}
                welcomeSlot={
                    <AgentPicker
                        agents={agents.data}
                        selected={selected}
                        onSelect={(a) => setSelectedId(a.id)}
                    />
                }
            />
        </div>
    );
}
