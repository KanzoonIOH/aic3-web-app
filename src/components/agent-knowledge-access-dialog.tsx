import {
    connectAgentKnowledge,
    disconnectAgentKnowledge,
} from "@/api/connect";
import { getAgentKnowledgesAll } from "@/api/agents";
import { getKnowledgeAgents } from "@/api/knowledges";
import type { Knowledge } from "@/api/knowledges";
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
import { resolveServerMessage } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Bot, ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

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

// Lists ALL agents (paginated) with their connection status to this knowledge,
// allowing connect/remove per row.
export function KnowledgeAgentAccessDialog({
    knowledge,
    open,
    onOpenChange,
}: {
    knowledge: Knowledge;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [page, setPage] = useState(1); // 1-based
    const [pendingId, setPendingId] = useState<string | null>(null);
    const queryClient = useQueryClient();
    const limit = 5;

    const agents = useQuery({
        queryKey: ["knowledges", knowledge.id, "agents", page],
        queryFn: () =>
            getKnowledgeAgents(knowledge.id, { offset: page - 1, limit }),
        enabled: open,
    });

    function invalidate(agentId: string) {
        queryClient.invalidateQueries({ queryKey: ["agents"] });
        queryClient.invalidateQueries({ queryKey: ["agents", agentId] });
        queryClient.invalidateQueries({ queryKey: ["knowledges"] });
        queryClient.invalidateQueries({ queryKey: ["knowledges", knowledge.id] });
    }

    const mutation = useMutation({
        mutationFn: async ({ agentId, connected }: { agentId: string; connected: boolean }) => {
            const payload = { agent_id: agentId, knowledge_id: knowledge.id };
            if (connected) await disconnectAgentKnowledge(payload);
            else await connectAgentKnowledge(payload);
        },
        onSuccess: (_response, { agentId }) => invalidate(agentId),
        onSettled: () => setPendingId(null),
    });

    function handleOpenChange(nextOpen: boolean) {
        onOpenChange(nextOpen);
        if (!nextOpen) { mutation.reset(); setPendingId(null); setPage(1); }
    }

    function handleToggle(agentId: string, connected: boolean) {
        mutation.reset();
        setPendingId(agentId);
        mutation.mutate({ agentId, connected });
    }

    const icon = <Bot className="size-8 text-muted-foreground/40" />;
    const totalPage = agents.data?.pagination?.total_page ?? 1;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Access</DialogTitle>
                    <DialogDescription>
                        Connect {knowledge.name} to agents.
                    </DialogDescription>
                </DialogHeader>

                {mutation.isError && (
                    <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {resolveServerMessage(mutation.error)}
                    </p>
                )}

                <div className="max-h-80 overflow-y-auto rounded-lg border divide-y">
                    {agents.isPending ? (
                        <EmptyPickerState icon={icon} message="Loading agents..." />
                    ) : agents.isError ? (
                        <EmptyPickerState icon={icon} message="Failed to load agents" />
                    ) : agents.data.data.length === 0 ? (
                        <EmptyPickerState icon={icon} message="No agents found" />
                    ) : (
                        agents.data.data.map((agent) => (
                            <div
                                key={agent.id}
                                className="flex items-center gap-3 px-3 py-2.5"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="truncate text-sm font-medium">
                                            {agent.name}
                                        </p>
                                        {agent.connected && (
                                            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                                Connected
                                            </span>
                                        )}
                                    </div>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {agent.description || "No description"}
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant={agent.connected ? "destructive" : "outline"}
                                    disabled={mutation.isPending}
                                    onClick={() => handleToggle(agent.id, agent.connected)}
                                >
                                    {pendingId === agent.id
                                        ? agent.connected
                                            ? "Removing..."
                                            : "Connecting..."
                                        : agent.connected
                                          ? "Remove"
                                          : "Connect"}
                                </Button>
                            </div>
                        ))
                    )}
                </div>

                <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                        {agents.data?.data.length
                            ? `Page ${page} of ${totalPage}`
                            : ""}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1 || agents.isFetching}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            <ChevronLeft className="size-3.5" />
                            Prev
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPage || agents.isFetching}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Next
                            <ChevronRight className="size-3.5" />
                        </Button>
                    </div>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Lists ALL knowledges (paginated) with their connection status to this agent,
// allowing connect/remove per row.
export function AgentKnowledgeAccessDialog({
    agentId,
    open,
    onOpenChange,
}: {
    agentId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [page, setPage] = useState(1); // 1-based
    const [pendingId, setPendingId] = useState<string | null>(null);
    const queryClient = useQueryClient();
    const limit = 5;

    const knowledges = useQuery({
        queryKey: ["agents", agentId, "knowledges", "all", page],
        queryFn: () => getAgentKnowledgesAll(agentId, { offset: page - 1, limit }),
        enabled: open,
    });

    function invalidate(knowledgeId: string) {
        queryClient.invalidateQueries({ queryKey: ["agents"] });
        queryClient.invalidateQueries({ queryKey: ["agents", agentId] });
        queryClient.invalidateQueries({ queryKey: ["knowledges"] });
        queryClient.invalidateQueries({ queryKey: ["knowledges", knowledgeId] });
    }

    const mutation = useMutation({
        mutationFn: async ({ knowledgeId, connected }: { knowledgeId: string; connected: boolean }) => {
            const payload = { agent_id: agentId, knowledge_id: knowledgeId };
            if (connected) await disconnectAgentKnowledge(payload);
            else await connectAgentKnowledge(payload);
        },
        onSuccess: (_response, { knowledgeId }) => invalidate(knowledgeId),
        onSettled: () => setPendingId(null),
    });

    function handleOpenChange(nextOpen: boolean) {
        onOpenChange(nextOpen);
        if (!nextOpen) { mutation.reset(); setPendingId(null); setPage(1); }
    }

    function handleToggle(knowledgeId: string, connected: boolean) {
        mutation.reset();
        setPendingId(knowledgeId);
        mutation.mutate({ knowledgeId, connected });
    }

    const icon = <BookOpen className="size-8 text-muted-foreground/40" />;
    const totalPage = knowledges.data?.pagination?.total_page ?? 1;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Access</DialogTitle>
                    <DialogDescription>
                        Connect this agent to knowledge sources.
                    </DialogDescription>
                </DialogHeader>

                {mutation.isError && (
                    <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {resolveServerMessage(mutation.error)}
                    </p>
                )}

                <div className="max-h-80 overflow-y-auto rounded-lg border divide-y">
                    {knowledges.isPending ? (
                        <EmptyPickerState icon={icon} message="Loading knowledges..." />
                    ) : knowledges.isError ? (
                        <EmptyPickerState icon={icon} message="Failed to load knowledges" />
                    ) : knowledges.data.data.length === 0 ? (
                        <EmptyPickerState icon={icon} message="No knowledges found" />
                    ) : (
                        knowledges.data.data.map((knowledge) => (
                            <div
                                key={knowledge.id}
                                className="flex items-center gap-3 px-3 py-2.5"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="truncate text-sm font-medium">
                                            {knowledge.name}
                                        </p>
                                        {knowledge.connected && (
                                            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                                Connected
                                            </span>
                                        )}
                                    </div>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {knowledge.description || "No description"}
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant={knowledge.connected ? "destructive" : "outline"}
                                    disabled={mutation.isPending}
                                    onClick={() => handleToggle(knowledge.id, knowledge.connected)}
                                >
                                    {pendingId === knowledge.id
                                        ? knowledge.connected
                                            ? "Removing..."
                                            : "Connecting..."
                                        : knowledge.connected
                                          ? "Remove"
                                          : "Connect"}
                                </Button>
                            </div>
                        ))
                    )}
                </div>

                <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                        {knowledges.data?.data.length
                            ? `Page ${page} of ${totalPage}`
                            : ""}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1 || knowledges.isFetching}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            <ChevronLeft className="size-3.5" />
                            Prev
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPage || knowledges.isFetching}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Next
                            <ChevronRight className="size-3.5" />
                        </Button>
                    </div>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
