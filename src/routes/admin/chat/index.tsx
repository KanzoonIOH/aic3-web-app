import { getAgents } from "@/api/agents";
import type { ConversationDetail } from "@/api/conversations";
import { getOrchestrators } from "@/api/orchestrators";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bot, Check, ChevronsUpDown, Network } from "lucide-react";
import { useEffect, useState } from "react";
import { ChatSanbox } from "../agents/-ChatSandbox";

export const Route = createFileRoute("/admin/chat/")({
    component: RouteComponent,
});

// Unified shape for anything chattable: agent garden or orchestrator.
interface Chatable {
    id: string;
    name: string;
    description: string | null;
    image: string | null;
    isOrchestrator: boolean;
    // Agent-only fields (undefined for orchestrators):
    dynamicKeys?: string[];
    dynamicHeaderKeys?: string[];
    outputField?: string;
}

function ChatableAvatar({
    item,
    className,
}: {
    item: Chatable;
    className?: string;
}) {
    const icon = item.isOrchestrator ? (
        <Network className={cn("text-primary", className)} />
    ) : (
        <Bot className={cn("text-primary", className)} />
    );
    if (item.image && /^https?:\/\//.test(item.image)) {
        return (
            <span
                className={cn(
                    "flex items-center justify-center overflow-hidden rounded-full bg-primary/10",
                    className,
                )}
            >
                <img
                    src={item.image}
                    alt=""
                    className="size-full object-cover"
                />
            </span>
        );
    }
    if (item.image) {
        return (
            <span
                className={cn(
                    "flex items-center justify-center rounded-full bg-primary/10 text-primary",
                    className,
                )}
            >
                <span className="text-sm">{item.image}</span>
            </span>
        );
    }
    return (
        <span
            className={cn(
                "flex items-center justify-center rounded-full bg-primary/10",
                className,
            )}
        >
            {icon}
        </span>
    );
}

// Centered agent picker shown in the welcome hero (before the first message).
function AgentPicker({
    agents,
    orchestrators,
    selected,
    onSelect,
}: {
    agents: Chatable[];
    orchestrators: Chatable[];
    selected: Chatable | null;
    onSelect: (item: Chatable) => void;
}) {
    return (
        <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Chatting with
            </span>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2.5 rounded-full border bg-background px-4 py-2.5 text-sm font-medium shadow-sm transition-colors hover:bg-muted">
                        <ChatableAvatar
                            item={selected ?? agents[0]}
                            className="size-6"
                        />
                        <span className="max-w-56 truncate">
                            {selected?.name ?? "Select agent"}
                        </span>
                        <ChevronsUpDown className="size-4 text-muted-foreground" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-64">
                    <DropdownMenuLabel>Agents</DropdownMenuLabel>
                    {agents.map((item) => (
                        <DropdownMenuItem
                            key={item.id}
                            onSelect={() => onSelect(item)}
                            className="flex items-center gap-2"
                        >
                            <ChatableAvatar item={item} className="size-4" />
                            <span className="flex-1 truncate">
                                {item.name}
                            </span>
                            <Check
                                className={cn(
                                    "size-4 shrink-0",
                                    selected?.id === item.id
                                        ? "opacity-100"
                                        : "opacity-0",
                                )}
                            />
                        </DropdownMenuItem>
                    ))}
                    {orchestrators.length > 0 && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Orchestrators</DropdownMenuLabel>
                            {orchestrators.map((item) => (
                                <DropdownMenuItem
                                    key={item.id}
                                    onSelect={() => onSelect(item)}
                                    className="flex items-center gap-2"
                                >
                                    <ChatableAvatar
                                        item={item}
                                        className="size-4"
                                    />
                                    <span className="flex-1 truncate">
                                        {item.name}
                                    </span>
                                    <Check
                                        className={cn(
                                            "size-4 shrink-0",
                                            selected?.id === item.id
                                                ? "opacity-100"
                                                : "opacity-0",
                                        )}
                                    />
                                </DropdownMenuItem>
                            ))}
                        </>
                    )}
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
        data: agentsData,
        isPending: agentsPending,
        isError: agentsError,
    } = useQuery({
        queryKey: ["agents", "all"],
        queryFn: () => getAgents({ limit: 1000 }),
    });

    const {
        data: orchData,
        isPending: orchPending,
        isError: orchError,
    } = useQuery({
        queryKey: ["orchestrators", "all"],
        queryFn: () => getOrchestrators({ limit: 1000 }),
    });

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Map agents + orchestrators to the unified Chatable shape.
    const agents: Chatable[] = (agentsData?.data ?? []).map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        image: a.image,
        isOrchestrator: false,
        dynamicKeys: (a.webhook_body_fields ?? [])
            .filter((f) => f.type === "dynamic")
            .map((f) => f.key),
        dynamicHeaderKeys: (a.webhook_header_fields ?? [])
            .filter((f) => f.type === "dynamic")
            .map((f) => f.key),
        outputField: a.webhook_output_field || "reply",
    }));

    const orchestrators: Chatable[] = (orchData?.data ?? []).map((o) => ({
        id: o.id,
        name: o.name,
        description: o.description,
        image: o.image,
        isOrchestrator: true,
        outputField: "reply",
    }));

    const all = [...agents, ...orchestrators];
    const isPending = agentsPending || orchPending;
    const isError = agentsError || orchError;

    // Default to the first agent once the list loads.
    useEffect(() => {
        if (!selectedId && agents.length > 0) {
            setSelectedId(agents[0].id);
        }
    }, [agents, selectedId]);

    const selected = all.find((a) => a.id === selectedId) ?? null;

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
                dynamicKeys={selected.dynamicKeys ?? []}
                dynamicHeaderKeys={selected.dynamicHeaderKeys ?? []}
                outputField={selected.outputField ?? "reply"}
                welcomeTitle="Hello there"
                welcomeImage={selected.image}
                onSessionStart={(sessionId, msgs) => {
                    // First reply on a new chat: refresh the list and switch the
                    // URL to the real conversation so "New chat" works again.
                    queryClient.invalidateQueries({
                        queryKey: ["conversations"],
                    });
                    // Seed the /chat/$id cache with the transcript we already
                    // have so the target route renders instantly (no loading
                    // flash). refetchOnMount revalidates silently in the bg.
                    const now = new Date().toISOString();
                    const seeded: ConversationDetail = {
                        conversation: {
                            id: sessionId,
                            agent_id: selected.id,
                            agent_name: selected.name,
                            started_at: now,
                            ended_at: null,
                            is_active: true,
                        },
                        messages: msgs.map((m, i) => ({
                            id: `seed-${i}`,
                            conversation_id: sessionId,
                            role: m.role,
                            content: m.text,
                            attachments: null,
                            data: null,
                            created_at: now,
                        })),
                    };
                    queryClient.setQueryData(
                        ["conversation", sessionId],
                        seeded,
                    );
                    navigate({ to: "/admin/chat/$id", params: { id: sessionId } });
                }}
                welcomeSlot={
                    <AgentPicker
                        agents={agents}
                        orchestrators={orchestrators}
                        selected={selected}
                        onSelect={(a) => setSelectedId(a.id)}
                    />
                }
            />
        </div>
    );
}
