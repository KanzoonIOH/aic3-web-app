import { getAgents, type Agent } from "@/api/agents";
import { connectAgentKnowledge } from "@/api/connect";
import { getKnowledges, type Knowledge } from "@/api/knowledges";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { BookOpen, Bot } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

type ApiError = { message?: string };

function resolveServerMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as ApiError | undefined;
        return data?.message ?? error.message;
    }
    return "An unexpected error occurred.";
}

function EmptyPickerState({
    icon,
    message,
}: {
    icon: ReactNode;
    message: string;
}) {
    return (
        <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            {icon}
            <p className="text-sm">{message}</p>
        </div>
    );
}

function AgentPickerRow({
    agent,
    isDisabled,
    isPending,
    onConnect,
}: {
    agent: Agent;
    isDisabled: boolean;
    isPending: boolean;
    onConnect: () => void;
}) {
    return (
        <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{agent.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                    {agent.description || "No description"}
                </p>
            </div>
            <Button
                size="sm"
                variant="outline"
                disabled={isDisabled}
                onClick={onConnect}
            >
                {isPending ? "Connecting..." : "Connect"}
            </Button>
        </div>
    );
}

function KnowledgePickerRow({
    knowledge,
    isDisabled,
    isPending,
    onConnect,
}: {
    knowledge: Knowledge;
    isDisabled: boolean;
    isPending: boolean;
    onConnect: () => void;
}) {
    return (
        <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{knowledge.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                    {knowledge.description || "No description"}
                </p>
            </div>
            <Button
                size="sm"
                variant="outline"
                disabled={isDisabled}
                onClick={onConnect}
            >
                {isPending ? "Connecting..." : "Connect"}
            </Button>
        </div>
    );
}

export function KnowledgeAgentAccessDialog({
    knowledge,
    open,
    onOpenChange,
}: {
    knowledge: Knowledge;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [pendingAgentId, setPendingAgentId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const agents = useQuery({
        queryKey: ["agents"],
        queryFn: getAgents,
        enabled: open,
    });

    const mutation = useMutation({
        mutationFn: (agentId: string) =>
            connectAgentKnowledge({
                agent_id: agentId,
                knowledge_id: knowledge.id,
            }),
        onSuccess: (_response, agentId) => {
            queryClient.invalidateQueries({ queryKey: ["agents"] });
            queryClient.invalidateQueries({ queryKey: ["agents", agentId] });
            queryClient.invalidateQueries({
                queryKey: ["agents", agentId, "knowledges"],
            });
            queryClient.invalidateQueries({ queryKey: ["knowledges"] });
            queryClient.invalidateQueries({ queryKey: ["knowledges", knowledge.id] });
        },
        onSettled: () => setPendingAgentId(null),
    });

    function handleOpenChange(nextOpen: boolean) {
        onOpenChange(nextOpen);
        if (!nextOpen) {
            mutation.reset();
            setPendingAgentId(null);
        }
    }

    function handleConnect(agentId: string) {
        mutation.reset();
        setPendingAgentId(agentId);
        mutation.mutate(agentId);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Access</DialogTitle>
                    <DialogDescription>
                        Connect {knowledge.name} to an agent.
                    </DialogDescription>
                </DialogHeader>

                {mutation.isError && (
                    <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {resolveServerMessage(mutation.error)}
                    </p>
                )}
                {mutation.isSuccess && (
                    <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
                        Access connected.
                    </p>
                )}

                <div className="max-h-80 overflow-y-auto rounded-lg border divide-y">
                    {agents.isPending ? (
                        <EmptyPickerState
                            icon={<Bot className="size-8 text-muted-foreground/40" />}
                            message="Loading agents..."
                        />
                    ) : agents.isError ? (
                        <EmptyPickerState
                            icon={<Bot className="size-8 text-muted-foreground/40" />}
                            message="Failed to load agents"
                        />
                    ) : agents.data.data.length === 0 ? (
                        <EmptyPickerState
                            icon={<Bot className="size-8 text-muted-foreground/40" />}
                            message="No agents found"
                        />
                    ) : (
                        agents.data.data.map((agent) => (
                            <AgentPickerRow
                                key={agent.id}
                                agent={agent}
                                isDisabled={mutation.isPending}
                                isPending={pendingAgentId === agent.id}
                                onConnect={() => handleConnect(agent.id)}
                            />
                        ))
                    )}
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function AgentKnowledgeAccessDialog({
    agentId,
    open,
    onOpenChange,
}: {
    agentId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [pendingKnowledgeId, setPendingKnowledgeId] = useState<
        string | null
    >(null);
    const queryClient = useQueryClient();

    const knowledges = useQuery({
        queryKey: ["knowledges"],
        queryFn: getKnowledges,
        enabled: open,
    });

    const mutation = useMutation({
        mutationFn: (knowledgeId: string) =>
            connectAgentKnowledge({
                agent_id: agentId,
                knowledge_id: knowledgeId,
            }),
        onSuccess: (_response, knowledgeId) => {
            queryClient.invalidateQueries({ queryKey: ["agents"] });
            queryClient.invalidateQueries({ queryKey: ["agents", agentId] });
            queryClient.invalidateQueries({
                queryKey: ["agents", agentId, "knowledges"],
            });
            queryClient.invalidateQueries({ queryKey: ["knowledges"] });
            queryClient.invalidateQueries({ queryKey: ["knowledges", knowledgeId] });
        },
        onSettled: () => setPendingKnowledgeId(null),
    });

    function handleOpenChange(nextOpen: boolean) {
        onOpenChange(nextOpen);
        if (!nextOpen) {
            mutation.reset();
            setPendingKnowledgeId(null);
        }
    }

    function handleConnect(knowledgeId: string) {
        mutation.reset();
        setPendingKnowledgeId(knowledgeId);
        mutation.mutate(knowledgeId);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Access</DialogTitle>
                    <DialogDescription>
                        Connect this agent to a knowledge source.
                    </DialogDescription>
                </DialogHeader>

                {mutation.isError && (
                    <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {resolveServerMessage(mutation.error)}
                    </p>
                )}
                {mutation.isSuccess && (
                    <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
                        Access connected.
                    </p>
                )}

                <div className="max-h-80 overflow-y-auto rounded-lg border divide-y">
                    {knowledges.isPending ? (
                        <EmptyPickerState
                            icon={<BookOpen className="size-8 text-muted-foreground/40" />}
                            message="Loading knowledges..."
                        />
                    ) : knowledges.isError ? (
                        <EmptyPickerState
                            icon={<BookOpen className="size-8 text-muted-foreground/40" />}
                            message="Failed to load knowledges"
                        />
                    ) : knowledges.data.data.length === 0 ? (
                        <EmptyPickerState
                            icon={<BookOpen className="size-8 text-muted-foreground/40" />}
                            message="No knowledges found"
                        />
                    ) : (
                        knowledges.data.data.map((knowledge) => (
                            <KnowledgePickerRow
                                key={knowledge.id}
                                knowledge={knowledge}
                                isDisabled={mutation.isPending}
                                isPending={pendingKnowledgeId === knowledge.id}
                                onConnect={() => handleConnect(knowledge.id)}
                            />
                        ))
                    )}
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
