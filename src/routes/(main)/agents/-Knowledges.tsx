import { getAgentKnowledges, type AgentKnowledge } from "@/api/agents";
import { AgentKnowledgeAccessDialog } from "@/components/agent-knowledge-access-dialog";
import { Button } from "@/components/ui/button";
import {
    TanStackDataTable,
    type ColumnDef,
} from "@/components/ui/tanstack-table";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
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

// ponytail: replaced DropdownMenu with 1 item → direct Button
function AgentKnowledgeRowActions({ agentId }: { agentId: string }) {
    const [accessOpen, setAccessOpen] = useState(false);

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setAccessOpen(true)}
            >
                Access
            </Button>

            <AgentKnowledgeAccessDialog
                agentId={agentId}
                open={accessOpen}
                onOpenChange={setAccessOpen}
            />
        </>
    );
}

export function Knowledges({ agentId }: { agentId: string }) {
    const [page, setPage] = useState(1);
    const baseColumns = createKnowledgeColumns({
        renderActions: () => <AgentKnowledgeRowActions agentId={agentId} />,
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
