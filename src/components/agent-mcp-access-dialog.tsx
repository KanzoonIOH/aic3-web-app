import { connectAgentMcp, disconnectAgentMcp } from "@/api/connect";
import { getAgentMcpsAll, getMcpAgents, type Mcp } from "@/api/mcps";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Bot, ChevronLeft, ChevronRight, Plug } from "lucide-react";
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

// Lists ALL agents (paginated) with their connection status to this MCP,
// allowing connect/remove per row.
export function McpAgentAccessDialog({
    mcp,
    open,
    onOpenChange,
}: {
    mcp: Mcp;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [page, setPage] = useState(1);
    const [pendingId, setPendingId] = useState<string | null>(null);
    const [confirmRemove, setConfirmRemove] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const queryClient = useQueryClient();
    const limit = 5;

    const agents = useQuery({
        queryKey: ["mcps", mcp.id, "agents", page],
        queryFn: () => getMcpAgents(mcp.id, { offset: page - 1, limit }),
        enabled: open,
    });

    function invalidate(agentId: string) {
        queryClient.invalidateQueries({ queryKey: ["agents"] });
        queryClient.invalidateQueries({ queryKey: ["agents", agentId] });
        queryClient.invalidateQueries({ queryKey: ["mcps"] });
        queryClient.invalidateQueries({ queryKey: ["mcps", mcp.id] });
    }

    const mutation = useMutation({
        mutationFn: async ({
            agentId,
            connected,
        }: {
            agentId: string;
            connected: boolean;
        }) => {
            const payload = { agent_id: agentId, mcp_id: mcp.id };
            if (connected) await disconnectAgentMcp(payload);
            else await connectAgentMcp(payload);
        },
        onSuccess: (_r, { agentId }) => invalidate(agentId),
        onSettled: () => setPendingId(null),
    });

    function handleOpenChange(nextOpen: boolean) {
        onOpenChange(nextOpen);
        if (!nextOpen) {
            mutation.reset();
            setPendingId(null);
            setPage(1);
        }
    }

    function handleToggle(agentId: string, connected: boolean, name: string) {
        if (connected) {
            setConfirmRemove({ id: agentId, name });
            return;
        }
        mutation.reset();
        setPendingId(agentId);
        mutation.mutate({ agentId, connected });
    }

    function confirmRemoveNow() {
        if (!confirmRemove) return;
        const agentId = confirmRemove.id;
        setConfirmRemove(null);
        mutation.reset();
        setPendingId(agentId);
        mutation.mutate({ agentId, connected: true });
    }

    const icon = <Bot className="size-8 text-muted-foreground/40" />;
    const totalPage = agents.data?.pagination?.total_page ?? 1;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Access</DialogTitle>
                    <DialogDescription>
                        Connect {mcp.name} to agents.
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
                                    onClick={() =>
                                        handleToggle(agent.id, agent.connected, agent.name)
                                    }
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
                        {agents.data?.data.length ? `Page ${page} of ${totalPage}` : ""}
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
                        <Button type="button" variant="outline">
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>

            <AlertDialog
                open={confirmRemove !== null}
                onOpenChange={(o) => !o && setConfirmRemove(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove access?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <span className="font-medium text-foreground">
                                {confirmRemove?.name}
                            </span>{" "}
                            will lose access to {mcp.name}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel variant="ghost">Cancel</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={confirmRemoveNow}>
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    );
}

// Lists ALL MCPs (paginated) with their connection status to this agent,
// allowing connect/remove per row.
export function AgentMcpAccessDialog({
    agentId,
    open,
    onOpenChange,
}: {
    agentId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [page, setPage] = useState(1);
    const [pendingId, setPendingId] = useState<string | null>(null);
    const [confirmRemove, setConfirmRemove] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const queryClient = useQueryClient();
    const limit = 5;

    const mcps = useQuery({
        queryKey: ["agents", agentId, "mcps", "all", page],
        queryFn: () => getAgentMcpsAll(agentId, { offset: page - 1, limit }),
        enabled: open,
    });

    function invalidate(mcpId: string) {
        queryClient.invalidateQueries({ queryKey: ["agents"] });
        queryClient.invalidateQueries({ queryKey: ["agents", agentId] });
        queryClient.invalidateQueries({ queryKey: ["mcps"] });
        queryClient.invalidateQueries({ queryKey: ["mcps", mcpId] });
    }

    const mutation = useMutation({
        mutationFn: async ({
            mcpId,
            connected,
        }: {
            mcpId: string;
            connected: boolean;
        }) => {
            const payload = { agent_id: agentId, mcp_id: mcpId };
            if (connected) await disconnectAgentMcp(payload);
            else await connectAgentMcp(payload);
        },
        onSuccess: (_r, { mcpId }) => invalidate(mcpId),
        onSettled: () => setPendingId(null),
    });

    function handleOpenChange(nextOpen: boolean) {
        onOpenChange(nextOpen);
        if (!nextOpen) {
            mutation.reset();
            setPendingId(null);
            setPage(1);
        }
    }

    function handleToggle(mcpId: string, connected: boolean, name: string) {
        if (connected) {
            setConfirmRemove({ id: mcpId, name });
            return;
        }
        mutation.reset();
        setPendingId(mcpId);
        mutation.mutate({ mcpId, connected });
    }

    function confirmRemoveNow() {
        if (!confirmRemove) return;
        const mcpId = confirmRemove.id;
        setConfirmRemove(null);
        mutation.reset();
        setPendingId(mcpId);
        mutation.mutate({ mcpId, connected: true });
    }

    const icon = <Plug className="size-8 text-muted-foreground/40" />;
    const totalPage = mcps.data?.pagination?.total_page ?? 1;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Access</DialogTitle>
                    <DialogDescription>
                        Connect this agent to MCP servers.
                    </DialogDescription>
                </DialogHeader>

                {mutation.isError && (
                    <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {resolveServerMessage(mutation.error)}
                    </p>
                )}

                <div className="max-h-80 overflow-y-auto rounded-lg border divide-y">
                    {mcps.isPending ? (
                        <EmptyPickerState icon={icon} message="Loading MCPs..." />
                    ) : mcps.isError ? (
                        <EmptyPickerState icon={icon} message="Failed to load MCPs" />
                    ) : mcps.data.data.length === 0 ? (
                        <EmptyPickerState icon={icon} message="No MCPs found" />
                    ) : (
                        mcps.data.data.map((mcp) => (
                            <div
                                key={mcp.id}
                                className="flex items-center gap-3 px-3 py-2.5"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="truncate text-sm font-medium">
                                            {mcp.name}
                                        </p>
                                        {mcp.connected && (
                                            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                                Connected
                                            </span>
                                        )}
                                    </div>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {mcp.description || "No description"}
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant={mcp.connected ? "destructive" : "outline"}
                                    disabled={mutation.isPending}
                                    onClick={() =>
                                        handleToggle(mcp.id, mcp.connected, mcp.name)
                                    }
                                >
                                    {pendingId === mcp.id
                                        ? mcp.connected
                                            ? "Removing..."
                                            : "Connecting..."
                                        : mcp.connected
                                          ? "Remove"
                                          : "Connect"}
                                </Button>
                            </div>
                        ))
                    )}
                </div>

                <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                        {mcps.data?.data.length ? `Page ${page} of ${totalPage}` : ""}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1 || mcps.isFetching}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            <ChevronLeft className="size-3.5" />
                            Prev
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPage || mcps.isFetching}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Next
                            <ChevronRight className="size-3.5" />
                        </Button>
                    </div>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>

            <AlertDialog
                open={confirmRemove !== null}
                onOpenChange={(o) => !o && setConfirmRemove(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove access?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This agent will lose access to{" "}
                            <span className="font-medium text-foreground">
                                {confirmRemove?.name}
                            </span>
                            .
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel variant="ghost">Cancel</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={confirmRemoveNow}>
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    );
}
