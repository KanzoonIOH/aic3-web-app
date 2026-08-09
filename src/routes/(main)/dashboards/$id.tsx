import {
    getDashboard,
    publishDashboard,
    unpublishDashboard,
    updateDashboard,
    type Dashboard,
    type Widget,
    type WidgetRange,
} from "@/api/dashboards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn, resolveServerMessage } from "@/lib/utils";
import { PinButton } from "@/components/pin-button";
import { useAuthStore } from "@/stores/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
    ArrowLeft,
    Check,
    GripVertical,
    Plus,
    Save,
    Trash2,
    Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
    isWide,
    templateFor,
    WidgetRenderer,
    WIDGET_TEMPLATES,
    type WidgetTemplate,
} from "./-widgets";

export const Route = createFileRoute("/(main)/dashboards/$id")({
    component: RouteComponent,
});

const RANGES: { value: WidgetRange; label: string }[] = [
    { value: "24h", label: "Last 24 hours" },
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
];

function newWidgetId(): string {
    return `w_${Math.random().toString(36).slice(2, 9)}`;
}

function makeWidget(t: WidgetTemplate): Widget {
    return {
        id: newWidgetId(),
        type: t.type,
        title: t.defaultTitle,
        source: t.source,
        params: {
            range: "7d",
            metric: t.metrics?.[0]?.value,
        },
    };
}

// AddWidgetDialog lets the user pick a template to append.
function AddWidgetDialog({ onAdd }: { onAdd: (w: Widget) => void }) {
    const [open, setOpen] = useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                    <Plus className="size-3.5" />
                    Add widget
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add a widget</DialogTitle>
                    <DialogDescription>
                        Pick a template. You can tune its parameters after
                        adding it.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {WIDGET_TEMPLATES.map((t) => (
                        <button
                            key={t.type}
                            type="button"
                            onClick={() => {
                                onAdd(makeWidget(t));
                                setOpen(false);
                            }}
                            className="flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40"
                        >
                            <span className="text-sm font-medium">
                                {t.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {t.description}
                            </span>
                        </button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// WidgetConfigCard is the edit-mode representation: live preview + param
// controls + remove/reorder.
function WidgetConfigCard({
    widget,
    index,
    total,
    onChange,
    onRemove,
    onMove,
}: {
    widget: Widget;
    index: number;
    total: number;
    onChange: (w: Widget) => void;
    onRemove: () => void;
    onMove: (dir: -1 | 1) => void;
}) {
    const template = templateFor(widget);
    return (
        <div
            className={cn(
                "flex flex-col gap-3 rounded-xl border bg-muted/20 p-3",
                isWide(widget) ? "lg:col-span-2" : "",
            )}
        >
            <div className="flex items-center gap-2">
                <GripVertical className="size-4 shrink-0 text-muted-foreground/50" />
                <Input
                    value={widget.title}
                    onChange={(e) =>
                        onChange({ ...widget, title: e.target.value })
                    }
                    className="h-8 flex-1 text-sm"
                    placeholder="Widget title"
                />
                <div className="flex items-center gap-0.5">
                    <Button
                        size="icon-xs"
                        variant="ghost"
                        disabled={index === 0}
                        onClick={() => onMove(-1)}
                        title="Move up"
                    >
                        ↑
                    </Button>
                    <Button
                        size="icon-xs"
                        variant="ghost"
                        disabled={index === total - 1}
                        onClick={() => onMove(1)}
                        title="Move down"
                    >
                        ↓
                    </Button>
                    <Button
                        size="icon-xs"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={onRemove}
                        title="Remove widget"
                    >
                        <Trash2 className="size-3.5" />
                    </Button>
                </div>
            </div>

            {/* Param controls */}
            <div className="flex flex-wrap gap-2 px-6">
                {template?.hasRange && (
                    <label className="flex flex-col gap-1 text-[11px] font-medium text-muted-foreground">
                        Range
                        <select
                            value={widget.params.range ?? "7d"}
                            onChange={(e) =>
                                onChange({
                                    ...widget,
                                    params: {
                                        ...widget.params,
                                        range: e.target.value as WidgetRange,
                                    },
                                })
                            }
                            className="h-8 rounded-md border bg-background px-2 text-xs text-foreground"
                        >
                            {RANGES.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
                {template?.metrics && (
                    <label className="flex flex-col gap-1 text-[11px] font-medium text-muted-foreground">
                        Metric
                        <select
                            value={widget.params.metric ?? template.metrics[0].value}
                            onChange={(e) =>
                                onChange({
                                    ...widget,
                                    params: {
                                        ...widget.params,
                                        metric: e.target.value,
                                    },
                                })
                            }
                            className="h-8 rounded-md border bg-background px-2 text-xs text-foreground"
                        >
                            {template.metrics.map((m) => (
                                <option key={m.value} value={m.value}>
                                    {m.label}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
            </div>

            {/* Live preview */}
            <div className="px-6 pb-1">
                <WidgetRenderer widget={widget} />
            </div>
        </div>
    );
}

function RouteComponent() {
    const { id } = Route.useParams();
    const queryClient = useQueryClient();
    const myId = useAuthStore((s) => s.user?.id);
    const myRole = useAuthStore((s) => s.user?.role);
    const isAdmin = myRole === "ADMIN" || myRole === "SUPERADMIN";

    const { data, isPending, isError, error } = useQuery({
        queryKey: ["dashboards", id],
        queryFn: () => getDashboard(id),
    });

    const dashboard = data?.data;
    const isOwner = dashboard ? dashboard.owner_id === myId : false;

    // Local editable copy of the widgets (only meaningful for the owner).
    const [widgets, setWidgets] = useState<Widget[]>([]);
    const [dirty, setDirty] = useState(false);

    useEffect(() => {
        if (dashboard) {
            setWidgets(dashboard.config?.widgets ?? []);
            setDirty(false);
        }
    }, [dashboard?.id, dashboard?.updated_at]);

    const save = useMutation({
        mutationFn: () =>
            updateDashboard(id, {
                name: dashboard!.name,
                description: dashboard!.description,
                config: { widgets },
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["dashboards"] });
            setDirty(false);
        },
    });

    if (isPending) {
        return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
    }
    if (isError || !dashboard) {
        return (
            <div className="flex flex-col items-start gap-3 p-6">
                <p className="text-sm text-destructive">
                    {resolveServerMessage(error) || "Dashboard not found"}
                </p>
                <Button asChild variant="outline" size="sm">
                    <Link to="/dashboards">
                        <ArrowLeft className="size-3.5" /> Back
                    </Link>
                </Button>
            </div>
        );
    }

    function updateWidget(i: number, w: Widget) {
        setWidgets((prev) => prev.map((x, idx) => (idx === i ? w : x)));
        setDirty(true);
    }
    function removeWidget(i: number) {
        setWidgets((prev) => prev.filter((_, idx) => idx !== i));
        setDirty(true);
    }
    function moveWidget(i: number, dir: -1 | 1) {
        setWidgets((prev) => {
            const next = [...prev];
            const j = i + dir;
            if (j < 0 || j >= next.length) return prev;
            [next[i], next[j]] = [next[j], next[i]];
            return next;
        });
        setDirty(true);
    }
    function addWidget(w: Widget) {
        setWidgets((prev) => [...prev, w]);
        setDirty(true);
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <DashboardHeader
                dashboard={dashboard}
                isOwner={isOwner}
                isAdmin={isAdmin}
                dirty={dirty}
                saving={save.isPending}
                onSave={() => save.mutate()}
            />

            {save.isError && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {resolveServerMessage(save.error)}
                </p>
            )}

            {isOwner ? (
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            {widgets.length} widget
                            {widgets.length === 1 ? "" : "s"} · changes preview
                            live, hit Save to persist.
                        </p>
                        <AddWidgetDialog onAdd={addWidget} />
                    </div>
                    {widgets.length === 0 ? (
                        <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
                            No widgets yet. Click “Add widget” to start.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {widgets.map((w, i) => (
                                <WidgetConfigCard
                                    key={w.id}
                                    widget={w}
                                    index={i}
                                    total={widgets.length}
                                    onChange={(nw) => updateWidget(i, nw)}
                                    onRemove={() => removeWidget(i)}
                                    onMove={(dir) => moveWidget(i, dir)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                // Read-only view for importers: renders straight from the
                // owner's live config, so it's always in sync.
                <ReadOnlyGrid widgets={dashboard.config?.widgets ?? []} />
            )}
        </div>
    );
}

function ReadOnlyGrid({ widgets }: { widgets: Widget[] }) {
    if (widgets.length === 0) {
        return (
            <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
                This dashboard has no widgets yet.
            </div>
        );
    }
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {widgets.map((w) => (
                <div
                    key={w.id}
                    className={cn(isWide(w) ? "sm:col-span-2" : "")}
                >
                    <WidgetRenderer widget={w} />
                </div>
            ))}
        </div>
    );
}

function DashboardHeader({
    dashboard,
    isOwner,
    isAdmin,
    dirty,
    saving,
    onSave,
}: {
    dashboard: Dashboard;
    isOwner: boolean;
    isAdmin: boolean;
    dirty: boolean;
    saving: boolean;
    onSave: () => void;
}) {
    const queryClient = useQueryClient();
    const isPublished = dashboard.visibility === "published";

    const publish = useMutation({
        mutationFn: () =>
            isPublished
                ? unpublishDashboard(dashboard.id)
                : publishDashboard(dashboard.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["dashboards"] });
            queryClient.invalidateQueries({
                queryKey: ["dashboards", dashboard.id],
            });
            queryClient.invalidateQueries({
                queryKey: ["dashboards", "published"],
            });
        },
    });

    // Owner (non-admin) may unpublish their own, but only admins can publish.
    const canPublish = isAdmin;
    const canUnpublish = isAdmin || isOwner;

    return (
        <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
                <Button asChild variant="ghost" size="icon-sm" className="mt-0.5">
                    <Link to="/dashboards">
                        <ArrowLeft className="size-4" />
                    </Link>
                </Button>
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="font-heading text-xl font-semibold">
                            {dashboard.name}
                        </h1>
                        {isPublished ? (
                            <Badge variant="secondary" className="gap-1">
                                <Users className="size-3" />
                                Published
                            </Badge>
                        ) : (
                            <Badge
                                variant="outline"
                                className="text-muted-foreground"
                            >
                                Private
                            </Badge>
                        )}
                        {!isOwner && (
                            <Badge
                                variant="outline"
                                className="text-muted-foreground"
                            >
                                Read-only
                            </Badge>
                        )}
                    </div>
                    {dashboard.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                            {dashboard.description}
                        </p>
                    )}
                    {!isOwner && dashboard.owner_name && (
                        <p className="mt-0.5 text-xs text-muted-foreground/70">
                            Owned by {dashboard.owner_name} · syncs
                            automatically
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <PinButton
                    entityType="dashboard"
                    entityId={dashboard.id}
                    variant="labeled"
                />
                {/* Publish / unpublish */}
                {isPublished && canUnpublish && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => publish.mutate()}
                        disabled={publish.isPending}
                    >
                        Unpublish
                    </Button>
                )}
                {!isPublished && canPublish && isOwner && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => publish.mutate()}
                        disabled={publish.isPending}
                    >
                        <Users className="size-3.5" />
                        {publish.isPending ? "Publishing…" : "Publish to team"}
                    </Button>
                )}
                {!isPublished && canPublish && !isOwner && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => publish.mutate()}
                        disabled={publish.isPending}
                    >
                        <Users className="size-3.5" />
                        Publish
                    </Button>
                )}

                {/* Save (owner only) */}
                {isOwner && (
                    <Button
                        size="sm"
                        onClick={onSave}
                        disabled={!dirty || saving}
                    >
                        {saving ? (
                            "Saving…"
                        ) : dirty ? (
                            <>
                                <Save className="size-3.5" /> Save changes
                            </>
                        ) : (
                            <>
                                <Check className="size-3.5" /> Saved
                            </>
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}
