import { getAgentKnowledges, type AgentKnowledge } from "@/api/agents";
import { disconnectAgentKnowledge } from "@/api/connect";
import { AgentKnowledgeAccessDialog } from "@/components/agent-knowledge-access-dialog";
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
    TanStackDataTable,
    type ColumnDef,
} from "@/components/ui/tanstack-table";
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { BookOpen, Plus } from "lucide-react";
import { useState } from "react";
import { createKnowledgeColumns } from "../knowledges/index";

const LIMIT = 10;

const STATUS_STYLES: Record<string, string> = {
    completed: "bg-emerald-500/10 text-emerald-600",
    pending: "bg-amber-500/10 text-amber-600",
    failed: "bg-destructive/10 text-destructive",
};

const statusColumn: ColumnDef<AgentKnowledge> = {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
        const status = row.original.status;
        return (
            <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    STATUS_STYLES[status] ?? "bg-muted text-muted-foreground"
                }`}
            >
                {status}
            </span>
        );
    },
};

// Removes (disconnects) this knowledge from the agent, with confirmation.
function AgentKnowledgeRowActions({
    agentId,
    knowledge,
}: {
    agentId: string;
    knowledge: AgentKnowledge;
}) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const queryClient = useQueryClient();

    const { mutate: remove, isPending } = useMutation({
        mutationFn: () =>
            disconnectAgentKnowledge({
                agent_id: agentId,
                knowledge_id: knowledge.id,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["agents"] });
            queryClient.invalidateQueries({ queryKey: ["knowledges"] });
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
                        <AlertDialogTitle>Remove knowledge?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <span className="font-medium text-foreground">
                                {knowledge.name}
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

// Header button: open the picker to give this agent access to more knowledge.
function GiveKnowledgeAccessButton({ agentId }: { agentId: string }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button size="sm" onClick={() => setOpen(true)}>
                <Plus className="size-3.5" />
                Give access
            </Button>
            <AgentKnowledgeAccessDialog
                agentId={agentId}
                open={open}
                onOpenChange={setOpen}
            />
        </>
    );
}

export function Knowledges({ agentId }: { agentId: string }) {
    const [page, setPage] = useState(1);
    const baseColumns = createKnowledgeColumns({
        renderActions: (knowledge) => (
            <AgentKnowledgeRowActions
                agentId={agentId}
                knowledge={knowledge as AgentKnowledge}
            />
        ),
    }) as ColumnDef<AgentKnowledge>[];
    // insert Status before the trailing actions column
    const columns = [
        ...baseColumns.slice(0, -1),
        statusColumn,
        baseColumns[baseColumns.length - 1],
    ];

    const { data, isPending, isError, isFetching } = useQuery({
        queryKey: ["agents", agentId, "knowledges", page],
        queryFn: () => getAgentKnowledges(agentId, { page, limit: LIMIT }),
        placeholderData: keepPreviousData,
    });

    const pagination = data?.pagination;

    return (
        <div className="h-full overflow-y-auto p-6">
            <div className="mb-4 flex justify-end">
                <GiveKnowledgeAccessButton agentId={agentId} />
            </div>
            <TanStackDataTable
                columns={columns}
                data={data?.data ?? []}
                getRowKey={(knowledge) => knowledge.id}
                enableSorting={false}
                isLoading={isPending}
                isError={isError}
                loadingMessage="Loading knowledges..."
                errorMessage="Failed to load knowledges"
                emptyMessage="No knowledges found"
                emptyIcon={
                    <BookOpen className="size-8 text-muted-foreground/40" />
                }
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
