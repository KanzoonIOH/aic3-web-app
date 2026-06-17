import { getLogMessages, type LogMessage } from "@/api/logs";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn, formatDateTime } from "@/lib/utils";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ScrollText } from "lucide-react";
import { useState } from "react";

const LIMIT = 10;

function StatusBadge({ message }: { message: LogMessage }) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                message.is_success
                    ? "bg-chart-2/10 text-chart-2"
                    : "bg-destructive/10 text-destructive",
            )}
        >
            <span
                className={cn(
                    "size-1.5 rounded-full",
                    message.is_success ? "bg-chart-2" : "bg-destructive",
                )}
            />
            {message.status_code}
        </span>
    );
}

export function LogsTable({ agentId }: { agentId?: string }) {
    const [page, setPage] = useState(1);

    const { data, isPending, isError, isFetching } = useQuery({
        queryKey: ["logs", "messages", agentId ?? "all", page],
        queryFn: () =>
            getLogMessages(
                { offset: (page - 1) * LIMIT, limit: LIMIT },
                agentId,
            ),
        placeholderData: keepPreviousData,
    });

    const rows = data?.data ?? [];
    const pagination = data?.pagination;
    const totalPage = pagination?.total_page ?? 1;
    const totalRow = pagination?.total_row ?? 0;
    const currentPage = page;

    return (
        <div className="flex flex-col gap-3">
            <div className="rounded-lg border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead>Conversation</TableHead>
                            {!agentId && <TableHead>Agent</TableHead>}
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">
                                Response time
                            </TableHead>
                            <TableHead className="text-right">
                                Occurred at
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isPending ? (
                            <TableRow>
                                <TableCell
                                    colSpan={agentId ? 4 : 5}
                                    className="h-32 text-center text-sm text-muted-foreground"
                                >
                                    Loading logs...
                                </TableCell>
                            </TableRow>
                        ) : isError ? (
                            <TableRow>
                                <TableCell
                                    colSpan={agentId ? 4 : 5}
                                    className="h-32 text-center text-sm text-muted-foreground"
                                >
                                    Failed to load logs
                                </TableCell>
                            </TableRow>
                        ) : rows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={agentId ? 4 : 5}
                                    className="h-32 text-center"
                                >
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <ScrollText className="size-7 text-muted-foreground/40" />
                                        <span className="text-sm">
                                            No logs found
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((log, i) => (
                                <TableRow
                                    key={`${currentPage}-${i}-${log.conversation_id}-${log.occurred_at}`}
                                >
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {log.conversation_id}
                                    </TableCell>
                                    {!agentId && (
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            {log.agent_id}
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        <StatusBadge message={log} />
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {log.response_time_ms.toLocaleString()}{" "}
                                        ms
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {formatDateTime(log.occurred_at)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                    {totalRow > 0
                        ? `Page ${currentPage} of ${totalPage} · ${totalRow} total`
                        : ""}
                </p>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1 || isFetching}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        <ChevronLeft className="size-3.5" />
                        Prev
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPage || isFetching}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Next
                        <ChevronRight className="size-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
