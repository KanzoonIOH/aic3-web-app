import { getAuditLogs, type AuditLog } from "@/api/audit-logs";
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
import { ChevronLeft, ChevronRight, History } from "lucide-react";
import { useState } from "react";

const LIMIT = 10;

const ACTION_STYLES: Record<string, string> = {
    CREATE: "bg-chart-2/10 text-chart-2",
    UPDATE: "bg-chart-4/10 text-chart-4",
    DELETE: "bg-destructive/10 text-destructive",
};

function ActionBadge({ action }: { action: string }) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                ACTION_STYLES[action] ?? "bg-muted text-muted-foreground",
            )}
        >
            {action}
        </span>
    );
}

export function AuditLogTable() {
    const [page, setPage] = useState(1);

    const { data, isPending, isError, isFetching } = useQuery({
        queryKey: ["logs", "audit", page],
        queryFn: () => getAuditLogs({ offset: page - 1, limit: LIMIT }),
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
                            <TableHead>Time</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Menu</TableHead>
                            <TableHead>Path</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isPending ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="h-32 text-center text-sm text-muted-foreground"
                                >
                                    Loading audit logs...
                                </TableCell>
                            </TableRow>
                        ) : isError ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="h-32 text-center text-sm text-muted-foreground"
                                >
                                    Failed to load audit logs
                                </TableCell>
                            </TableRow>
                        ) : rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center">
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <History className="size-7 text-muted-foreground/40" />
                                        <span className="text-sm">
                                            No audit logs found
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((log: AuditLog, i) => (
                                <TableRow
                                    key={`${currentPage}-${i}-${log.occurred_at}-${log.path}`}
                                >
                                    <TableCell className="text-muted-foreground whitespace-nowrap">
                                        {formatDateTime(log.occurred_at)}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {log.user_id || "—"}
                                    </TableCell>
                                    <TableCell className="text-xs">
                                        {log.role || "—"}
                                    </TableCell>
                                    <TableCell>
                                        <ActionBadge action={log.action} />
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {log.menu}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        <span className="text-foreground/60">
                                            {log.method}
                                        </span>{" "}
                                        {log.path}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums text-muted-foreground">
                                        {log.status}
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
