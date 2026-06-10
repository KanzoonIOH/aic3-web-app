import { getAgentMcps } from "@/api/agents";
import { TanStackDataTable } from "@/components/ui/tanstack-table";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Plug } from "lucide-react";
import { useState } from "react";
import { mcpColumns } from "../mcps/index";

const LIMIT = 10;

export function Mcps({ agentId }: { agentId: string }) {
    const [page, setPage] = useState(1);

    const { data, isPending, isError, isFetching } = useQuery({
        queryKey: ["agents", agentId, "mcps", page],
        queryFn: () => getAgentMcps(agentId, { page, limit: LIMIT }),
        placeholderData: keepPreviousData,
    });

    const pagination = data?.pagination;

    return (
        <div className="h-full overflow-y-auto p-6">
            <TanStackDataTable
                columns={mcpColumns}
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
