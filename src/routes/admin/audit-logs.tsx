import { AuditLogTable } from "@/components/audit-log-table";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/audit-logs")({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="px-6 py-4 bg-background border-b shrink-0">
                <h1 className="font-heading text-2xl font-semibold">
                    Audit Log
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    Who created, edited, or deleted what — across all features
                </p>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
                <AuditLogTable />
            </div>
        </div>
    );
}
