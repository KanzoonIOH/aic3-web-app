import { getAgentKnowledges } from "@/api/agents";
import { AgentKnowledgeAccessDialog } from "@/components/agent-knowledge-access-dialog";
import { Button } from "@/components/ui/button";
import { TanStackDataTable } from "@/components/ui/tanstack-table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { BookOpen, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { createKnowledgeColumns } from "../knowledges/index";

const LIMIT = 10;

function AgentKnowledgeRowActions({ agentId }: { agentId: string }) {
    const [accessOpen, setAccessOpen] = useState(false);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Open menu"
                    >
                        <MoreHorizontal className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setAccessOpen(true)}>
                        Access
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

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
    const columns = createKnowledgeColumns({
        renderActions: () => <AgentKnowledgeRowActions agentId={agentId} />,
    });

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
