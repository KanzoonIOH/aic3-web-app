import { getAgentMcps } from "@/api/agents";
import { disconnectAgentMcp } from "@/api/connect";
import type { Mcp } from "@/api/mcps";
import { AgentMcpAccessDialog } from "@/components/agent-mcp-access-dialog";
import { CopyableUri } from "@/components/copy-button";
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
import { Button } from "@/components/ui/button";
import {
    TanStackDataTable,
    type ColumnDef,
} from "@/components/ui/tanstack-table";
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { Plug, Plus } from "lucide-react";
import { useState } from "react";

const LIMIT = 10;

// Removes (disconnects) this MCP from the agent, with confirmation.
function AgentMcpRowActions({ agentId, mcp }: { agentId: string; mcp: Mcp }) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const queryClient = useQueryClient();

    const { mutate: remove, isPending } = useMutation({
        mutationFn: () =>
            disconnectAgentMcp({ agent_id: agentId, mcp_id: mcp.id }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["agents"] });
            queryClient.invalidateQueries({ queryKey: ["mcps"] });
            setConfirmOpen(false);
        },
    });

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmOpen(true)}
            >
                Remove
            </Button>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove MCP?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <span className="font-medium text-foreground">
                                {mcp.name}
                            </span>{" "}
                            will be disconnected from this agent.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel variant="ghost">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={isPending}
                            onClick={() => remove()}
                        >
                            {isPending ? "Removing..." : "Remove"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// Header button: open the picker to give this agent access to more MCPs.
function GiveMcpAccessButton({ agentId }: { agentId: string }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button size="sm" onClick={() => setOpen(true)}>
                <Plus className="size-3.5" />
                Give access
            </Button>
            <AgentMcpAccessDialog
                agentId={agentId}
                open={open}
                onOpenChange={setOpen}
            />
        </>
    );
}

export function Mcps({ agentId }: { agentId: string }) {
    const [page, setPage] = useState(1);

    const columns: ColumnDef<Mcp>[] = [
        {
            id: "name",
            header: "Name",
            meta: { className: "font-medium" },
            cell: ({ row }) => row.original.name,
        },
        {
            id: "description",
            header: "Description",
            meta: { className: "text-muted-foreground text-sm max-w-64" },
            cell: ({ row }) =>
                row.original.description ?? (
                    <span className="italic text-muted-foreground/50">—</span>
                ),
        },
        {
            id: "tools",
            header: "Tools",
            meta: { className: "font-medium" },
            cell: ({ row }) => row.original.tools_count,
        },
        {
            id: "uri",
            header: "URI",
            meta: {
                className:
                    "font-mono text-xs text-muted-foreground max-w-56 truncate",
            },
            cell: ({ row }) => <CopyableUri uri={row.original.uri} />,
        },
        {
            id: "actions",
            meta: { cellClassName: "text-right" },
            cell: ({ row }) => (
                <AgentMcpRowActions agentId={agentId} mcp={row.original} />
            ),
        },
    ];

    const { data, isPending, isError, isFetching } = useQuery({
        queryKey: ["agents", agentId, "mcps", page],
        queryFn: () =>
            getAgentMcps(agentId, { offset: page - 1, limit: LIMIT }),
        placeholderData: keepPreviousData,
    });

    const pagination = data?.pagination;

    return (
        <div className="h-full overflow-y-auto p-6">
            <div className="mb-4 flex justify-end">
                <GiveMcpAccessButton agentId={agentId} />
            </div>
            <TanStackDataTable
                columns={columns}
                data={data?.data ?? []}
                getRowKey={(mcp) => mcp.id}
                enableSorting={false}
                isLoading={isPending}
                isError={isError}
                loadingMessage="Loading MCPs..."
                errorMessage="Failed to load MCPs"
                emptyMessage="No MCPs found"
                emptyIcon={<Plug className="size-8 text-muted-foreground/40" />}
                pagination={{
                    page,
                    totalPage: pagination?.total_page ?? 1,
                    totalRow: pagination?.total_row ?? 0,
                    onPageChange: setPage,
                    disabled: isFetching,
                }}
            />
        </div>
    );
}
