import {
    createDashboard,
    deleteDashboard,
    getDashboards,
    getPublishedDashboards,
    importDashboard,
    unimportDashboard,
    type Dashboard,
} from "@/api/dashboards";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PinButton } from "@/components/pin-button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { resolveServerMessage } from "@/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
    Download,
    LayoutDashboard,
    Plus,
    Trash2,
    Users,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";

export const Route = createFileRoute("/(main)/dashboards/")({
    component: RouteComponent,
});

const createSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    description: z.string().trim(),
});

function CreateDashboardDialog() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: createDashboard,
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["dashboards"] });
            setOpen(false);
            form.reset();
            // Jump straight into the editor for the new dashboard.
            navigate({
                to: "/dashboards/$id",
                params: { id: res.data.id },
            });
        },
    });

    const form = useForm({
        defaultValues: { name: "", description: "" },
        onSubmit: async ({ value }) => {
            const result = createSchema.safeParse(value);
            if (!result.success) return;
            await mutation.mutateAsync({
                name: result.data.name,
                description: result.data.description || null,
                config: { widgets: [] },
            });
        },
    });

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                setOpen(v);
                if (!v) {
                    mutation.reset();
                    form.reset();
                }
            }}
        >
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="size-3.5" />
                    New dashboard
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create dashboard</DialogTitle>
                    <DialogDescription>
                        Give it a name, then add widgets in the editor.
                    </DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                    className="flex flex-col gap-4"
                >
                    {mutation.isError && (
                        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {resolveServerMessage(mutation.error)}
                        </p>
                    )}
                    <form.Field
                        name="name"
                        validators={{
                            onChange: ({ value }) => {
                                const r =
                                    createSchema.shape.name.safeParse(value);
                                return r.success
                                    ? undefined
                                    : r.error.issues[0]?.message;
                            },
                        }}
                    >
                        {(field) => (
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor={field.name}>Name</Label>
                                <Input
                                    id={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) =>
                                        field.handleChange(e.target.value)
                                    }
                                    placeholder="Marketing overview"
                                    autoFocus
                                />
                                {field.state.meta.errors.length > 0 && (
                                    <p className="text-xs text-destructive">
                                        {field.state.meta.errors[0]}
                                    </p>
                                )}
                            </div>
                        )}
                    </form.Field>
                    <form.Field name="description">
                        {(field) => (
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor={field.name}>
                                    Description{" "}
                                    <span className="font-normal text-muted-foreground">
                                        (optional)
                                    </span>
                                </Label>
                                <Input
                                    id={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) =>
                                        field.handleChange(e.target.value)
                                    }
                                    placeholder="Key marketing KPIs at a glance"
                                />
                            </div>
                        )}
                    </form.Field>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>
                        <form.Subscribe
                            selector={(s) => [s.canSubmit, s.isSubmitting]}
                        >
                            {([canSubmit, isSubmitting]) => (
                                <Button
                                    type="submit"
                                    disabled={
                                        !canSubmit ||
                                        isSubmitting ||
                                        mutation.isPending
                                    }
                                >
                                    {mutation.isPending
                                        ? "Creating…"
                                        : "Create"}
                                </Button>
                            )}
                        </form.Subscribe>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function VisibilityBadge({ d }: { d: Dashboard }) {
    if (d.visibility === "published") {
        return (
            <Badge variant="secondary" className="gap-1">
                <Users className="size-3" />
                Published
            </Badge>
        );
    }
    return (
        <Badge variant="outline" className="text-muted-foreground">
            Private
        </Badge>
    );
}

function MyDashboardCard({ d }: { d: Dashboard }) {
    const queryClient = useQueryClient();
    const widgetCount = d.config?.widgets?.length ?? 0;

    const del = useMutation({
        mutationFn: () => deleteDashboard(d.id),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ["dashboards"] }),
    });
    const unimport = useMutation({
        mutationFn: () => unimportDashboard(d.id),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ["dashboards"] }),
    });

    const owned = d.is_owner ?? false;

    return (
        <Card size="sm" className="gap-3 p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-primary/10 text-primary">
                    <LayoutDashboard className="size-4" />
                </div>
                <div className="flex items-center gap-1.5">
                    <VisibilityBadge d={d} />
                    {!owned && (
                        <Badge variant="outline" className="text-muted-foreground">
                            Imported
                        </Badge>
                    )}
                    <PinButton entityType="dashboard" entityId={d.id} />
                </div>
            </div>
            <div className="min-w-0">
                <Link
                    to="/dashboards/$id"
                    params={{ id: d.id }}
                    className="font-medium text-sm hover:underline"
                >
                    {d.name}
                </Link>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {d.description || "No description"}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground/70">
                    {widgetCount} widget{widgetCount === 1 ? "" : "s"}
                    {!owned && d.owner_name ? ` · by ${d.owner_name}` : ""}
                </p>
            </div>
            <div className="mt-1 flex items-center gap-2">
                <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link to="/dashboards/$id" params={{ id: d.id }}>
                        {owned ? "Open & edit" : "View"}
                    </Link>
                </Button>
                {owned ? (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                size="icon-sm"
                                variant="ghost"
                                className="text-muted-foreground hover:text-destructive"
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Delete dashboard?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    “{d.name}” will be permanently removed. If
                                    it was published, team members lose access.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => del.mutate()}
                                    className="bg-destructive text-white hover:bg-destructive/90"
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                ) : (
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground"
                        onClick={() => unimport.mutate()}
                        disabled={unimport.isPending}
                    >
                        Remove
                    </Button>
                )}
            </div>
        </Card>
    );
}

function CatalogCard({ d }: { d: Dashboard }) {
    const queryClient = useQueryClient();
    const widgetCount = d.config?.widgets?.length ?? 0;
    const imp = useMutation({
        mutationFn: () => importDashboard(d.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["dashboards"] });
            queryClient.invalidateQueries({
                queryKey: ["dashboards", "published"],
            });
        },
    });

    return (
        <Card size="sm" className="gap-3 p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-primary/10 text-primary">
                    <LayoutDashboard className="size-4" />
                </div>
                {(d.imported || d.is_owner) && (
                    <Badge variant="secondary">
                        {d.is_owner ? "Yours" : "Imported"}
                    </Badge>
                )}
            </div>
            <div className="min-w-0">
                <span className="font-medium text-sm">{d.name}</span>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {d.description || "No description"}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground/70">
                    {widgetCount} widget{widgetCount === 1 ? "" : "s"}
                    {d.owner_name ? ` · by ${d.owner_name}` : ""}
                </p>
            </div>
            {d.is_owner ? (
                <Button asChild size="sm" variant="outline">
                    <Link to="/dashboards/$id" params={{ id: d.id }}>
                        Open
                    </Link>
                </Button>
            ) : d.imported ? (
                <Button asChild size="sm" variant="outline">
                    <Link to="/dashboards/$id" params={{ id: d.id }}>
                        View
                    </Link>
                </Button>
            ) : (
                <Button
                    size="sm"
                    onClick={() => imp.mutate()}
                    disabled={imp.isPending}
                >
                    <Download className="size-3.5" />
                    {imp.isPending ? "Importing…" : "Import"}
                </Button>
            )}
        </Card>
    );
}

function RouteComponent() {
    const mine = useQuery({
        queryKey: ["dashboards"],
        queryFn: getDashboards,
    });
    const published = useQuery({
        queryKey: ["dashboards", "published"],
        queryFn: getPublishedDashboards,
    });

    const myList = mine.data?.data ?? [];
    const catalog = published.data?.data ?? [];

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-xl font-semibold">
                        Dashboards
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Build your own dashboard or import one shared by the
                        team.
                    </p>
                </div>
                <CreateDashboardDialog />
            </div>

            <Tabs defaultValue="mine">
                <TabsList>
                    <TabsTrigger value="mine">
                        My dashboards ({myList.length})
                    </TabsTrigger>
                    <TabsTrigger value="catalog">
                        Team catalog ({catalog.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="mine" className="mt-4">
                    {mine.isPending ? (
                        <p className="text-sm text-muted-foreground">Loading…</p>
                    ) : myList.length === 0 ? (
                        <EmptyState
                            title="No dashboards yet"
                            body="Create your first dashboard or import one from the team catalog."
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {myList.map((d) => (
                                <MyDashboardCard key={d.id} d={d} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="catalog" className="mt-4">
                    {published.isPending ? (
                        <p className="text-sm text-muted-foreground">Loading…</p>
                    ) : catalog.length === 0 ? (
                        <EmptyState
                            title="Nothing published yet"
                            body="When an admin publishes a dashboard, it shows up here for the whole team to import."
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {catalog.map((d) => (
                                <CatalogCard key={d.id} d={d} />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

function EmptyState({ title, body }: { title: string; body: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
            <LayoutDashboard className="size-8 text-muted-foreground/40" />
            <p className="font-medium text-sm">{title}</p>
            <p className="max-w-sm text-xs text-muted-foreground">{body}</p>
        </div>
    );
}
