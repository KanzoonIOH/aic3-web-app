import {
    createMcp,
    deleteMcp,
    getMcps,
    getMcpTools,
    refreshMcpTools,
    updateMcp,
    type Mcp,
    type McpHeaders,
    type McpTool,
    type UpdateMcpRequest,
} from "@/api/mcps";
import { McpAgentAccessDialog } from "@/components/agent-mcp-access-dialog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { ListToolbar, type Option } from "@/components/list-toolbar";
import { CopyableUri } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTablePaginationBar } from "@/components/ui/tanstack-table";
import { resolveServerMessage, textareaClass } from "@/lib/utils";
import { useForm } from "@tanstack/react-form";
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
    ChevronDown,
    MoreHorizontal,
    Plug,
    Plus,
    RefreshCw,
    Trash2,
    Wrench,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";

export const Route = createFileRoute("/(main)/mcps/")({
    component: RouteComponent,
});

// ---------- Schema ----------

const editMcpSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    description: z.string().trim(),
    uri: z.string().trim().url("Must be a valid URL"),
});

type EditMcpValues = z.infer<typeof editMcpSchema>;

const createMcpSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    description: z.string().trim(),
    uri: z.string().trim().url("Must be a valid URL"),
});

type CreateMcpValues = z.infer<typeof createMcpSchema>;

// ---------- Headers editor ----------

type HeaderRow = { key: string; value: string };

function headersToRows(headers: McpHeaders | null | undefined): HeaderRow[] {
    if (!headers) return [];
    return Object.entries(headers).map(([key, value]) => ({ key, value }));
}

function rowsToHeaders(rows: HeaderRow[]): McpHeaders {
    const out: McpHeaders = {};
    for (const { key, value } of rows) {
        const k = key.trim();
        if (k) out[k] = value;
    }
    return out;
}

// Simple key/value list for MCP auth headers (e.g. Authorization: Bearer xxx).
function HeadersEditor({
    rows,
    onChange,
}: {
    rows: HeaderRow[];
    onChange: (rows: HeaderRow[]) => void;
}) {
    function update(i: number, patch: Partial<HeaderRow>) {
        onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
    }
    function remove(i: number) {
        onChange(rows.filter((_, idx) => idx !== i));
    }
    function add() {
        onChange([...rows, { key: "", value: "" }]);
    }

    return (
        <div className="flex flex-col gap-2">
            <Label>Headers</Label>
            <p className="-mt-1 text-xs text-muted-foreground">
                Sent when connecting to the server, e.g.{" "}
                <span className="font-mono">Authorization</span> ={" "}
                <span className="font-mono">Bearer &lt;token&gt;</span>.
            </p>
            {rows.length > 0 && (
                <div className="flex flex-col gap-2">
                    {rows.map((row, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <Input
                                value={row.key}
                                onChange={(e) =>
                                    update(i, { key: e.target.value })
                                }
                                placeholder="Header name"
                                className="flex-1"
                            />
                            <Input
                                value={row.value}
                                onChange={(e) =>
                                    update(i, { value: e.target.value })
                                }
                                placeholder="Value"
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="shrink-0 text-muted-foreground"
                                onClick={() => remove(i)}
                                aria-label="Remove header"
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={add}
            >
                <Plus className="size-3.5" />
                Add header
            </Button>
        </div>
    );
}

// ---------- Add MCP — create form ----------

function AddMcpDialog() {
    const [open, setOpen] = useState(false);
    const [headerRows, setHeaderRows] = useState<HeaderRow[]>([]);
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: createMcp,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["mcps"] });
            setOpen(false);
            setHeaderRows([]);
            form.reset();
        },
    });

    const form = useForm({
        defaultValues: {
            name: "",
            description: "",
            uri: "",
        } satisfies CreateMcpValues,
        onSubmit: async ({ value }) => {
            const result = createMcpSchema.safeParse(value);
            if (!result.success) return;
            await mutation.mutateAsync({
                ...result.data,
                headers: rowsToHeaders(headerRows),
            });
        },
    });

    function handleOpenChange(nextOpen: boolean) {
        setOpen(nextOpen);
        if (!nextOpen) {
            mutation.reset();
            setHeaderRows([]);
            form.reset();
        }
    }

    const fieldValidator =
        (key: keyof CreateMcpValues) =>
        ({ value }: { value: string }) => {
            const r = createMcpSchema.shape[key].safeParse(value);
            return r.success ? undefined : r.error.issues[0]?.message;
        };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="size-3.5" />
                    Add MCP
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add MCP</DialogTitle>
                    <DialogDescription>
                        Connect a new MCP server. Tools are discovered
                        automatically.
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
                            onChange: fieldValidator("name"),
                            onSubmit: fieldValidator("name"),
                        }}
                    >
                        {(field) => (
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor={field.name}>Name</Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => {
                                        field.handleChange(e.target.value);
                                        mutation.reset();
                                    }}
                                    placeholder="My MCP server"
                                    aria-invalid={
                                        field.state.meta.errors.length > 0
                                    }
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
                                <Label htmlFor={field.name}>Description</Label>
                                <textarea
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => {
                                        field.handleChange(e.target.value);
                                        mutation.reset();
                                    }}
                                    placeholder="Optional description"
                                    className={textareaClass}
                                />
                            </div>
                        )}
                    </form.Field>

                    <form.Field
                        name="uri"
                        validators={{
                            onChange: fieldValidator("uri"),
                            onSubmit: fieldValidator("uri"),
                        }}
                    >
                        {(field) => (
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor={field.name}>Server URL</Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => {
                                        field.handleChange(e.target.value);
                                        mutation.reset();
                                    }}
                                    placeholder="https://mcp.example.com/mcp"
                                    aria-invalid={
                                        field.state.meta.errors.length > 0
                                    }
                                />
                                {field.state.meta.errors.length > 0 && (
                                    <p className="text-xs text-destructive">
                                        {field.state.meta.errors[0]}
                                    </p>
                                )}
                            </div>
                        )}
                    </form.Field>

                    <HeadersEditor
                        rows={headerRows}
                        onChange={(rows) => {
                            setHeaderRows(rows);
                            mutation.reset();
                        }}
                    />

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>
                        <form.Subscribe
                            selector={(state) => [
                                state.canSubmit,
                                state.isSubmitting,
                            ]}
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
                                        ? "Creating..."
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

// ---------- Edit MCP dialog ----------

function EditMcpDialog({
    mcp,
    open,
    onOpenChange,
}: {
    mcp: Mcp;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [headerRows, setHeaderRows] = useState<HeaderRow[]>(
        headersToRows(mcp.headers),
    );
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (payload: UpdateMcpRequest) => updateMcp(mcp.id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["mcps"] });
            queryClient.invalidateQueries({
                queryKey: ["mcps", mcp.id, "tools"],
            });
            onOpenChange(false);
        },
    });

    const form = useForm({
        defaultValues: {
            name: mcp.name,
            description: mcp.description ?? "",
            uri: mcp.uri,
        } satisfies EditMcpValues,
        onSubmit: async ({ value }) => {
            const result = editMcpSchema.safeParse(value);
            if (!result.success) return;
            await mutation.mutateAsync({
                ...result.data,
                headers: rowsToHeaders(headerRows),
            });
        },
    });

    function handleOpenChange(nextOpen: boolean) {
        onOpenChange(nextOpen);
        mutation.reset();
        setHeaderRows(headersToRows(mcp.headers));
        form.reset({
            name: mcp.name,
            description: mcp.description ?? "",
            uri: mcp.uri,
        });
    }

    const fieldValidator =
        (key: keyof EditMcpValues) =>
        ({ value }: { value: string }) => {
            const r = editMcpSchema.shape[key].safeParse(value);
            return r.success ? undefined : r.error.issues[0]?.message;
        };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit MCP</DialogTitle>
                    <DialogDescription>
                        Update the name, description, and server URL. Changing
                        the URL re-discovers tools.
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
                            onChange: fieldValidator("name"),
                            onSubmit: fieldValidator("name"),
                        }}
                    >
                        {(field) => (
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor={field.name}>Name</Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => {
                                        field.handleChange(e.target.value);
                                        mutation.reset();
                                    }}
                                    aria-invalid={
                                        field.state.meta.errors.length > 0
                                    }
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

                    <form.Field
                        name="description"
                        validators={{
                            onChange: fieldValidator("description"),
                            onSubmit: fieldValidator("description"),
                        }}
                    >
                        {(field) => (
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor={field.name}>Description</Label>
                                <textarea
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => {
                                        field.handleChange(e.target.value);
                                        mutation.reset();
                                    }}
                                    className={textareaClass}
                                    aria-invalid={
                                        field.state.meta.errors.length > 0
                                    }
                                />
                                {field.state.meta.errors.length > 0 && (
                                    <p className="text-xs text-destructive">
                                        {field.state.meta.errors[0]}
                                    </p>
                                )}
                            </div>
                        )}
                    </form.Field>

                    <form.Field
                        name="uri"
                        validators={{
                            onChange: fieldValidator("uri"),
                            onSubmit: fieldValidator("uri"),
                        }}
                    >
                        {(field) => (
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor={field.name}>Server URL</Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => {
                                        field.handleChange(e.target.value);
                                        mutation.reset();
                                    }}
                                    placeholder="https://mcp.example.com/mcp"
                                    aria-invalid={
                                        field.state.meta.errors.length > 0
                                    }
                                />
                                {field.state.meta.errors.length > 0 && (
                                    <p className="text-xs text-destructive">
                                        {field.state.meta.errors[0]}
                                    </p>
                                )}
                            </div>
                        )}
                    </form.Field>

                    <HeadersEditor
                        rows={headerRows}
                        onChange={(rows) => {
                            setHeaderRows(rows);
                            mutation.reset();
                        }}
                    />

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>
                        <form.Subscribe
                            selector={(state) => [
                                state.canSubmit,
                                state.isSubmitting,
                            ]}
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
                                    {mutation.isPending ? "Saving..." : "Save"}
                                </Button>
                            )}
                        </form.Subscribe>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ---------- MCP actions menu ----------

function McpActions({ mcp }: { mcp: Mcp }) {
    const [accessOpen, setAccessOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const queryClient = useQueryClient();

    const { mutate: remove, isPending: isDeleting } = useMutation({
        mutationFn: () => deleteMcp(mcp.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["mcps"] });
            setDeleteOpen(false);
        },
    });

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
                        Give Access
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={() => setDeleteOpen(true)}
                    >
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <McpAgentAccessDialog
                mcp={mcp}
                open={accessOpen}
                onOpenChange={setAccessOpen}
            />

            <EditMcpDialog
                mcp={mcp}
                open={editOpen}
                onOpenChange={setEditOpen}
            />

            <ConfirmDeleteDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                onConfirm={() => remove()}
                isPending={isDeleting}
                title="Delete MCP?"
                name={mcp.name}
            />
        </>
    );
}

// ---------- Tools expandable panel ----------

function ToolItem({ tool }: { tool: McpTool }) {
    const properties = tool.input_schema?.properties ?? {};
    const required = new Set(tool.input_schema?.required ?? []);
    const paramNames = Object.keys(properties);

    return (
        <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-start gap-2">
                <Wrench className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs font-medium">{tool.name}</p>
                    {tool.description && (
                        <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">
                            {tool.description}
                        </p>
                    )}
                    {paramNames.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {paramNames.map((name) => (
                                <span
                                    key={name}
                                    className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                                >
                                    {name}
                                    {required.has(name) && (
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    )}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ToolsPanel({ mcpId }: { mcpId: string }) {
    const queryClient = useQueryClient();
    const { data, isPending, isError } = useQuery({
        queryKey: ["mcps", mcpId, "tools"],
        queryFn: () => getMcpTools(mcpId),
    });

    // Manual re-sync: reconnect to the server (using stored headers) so users
    // can retry after fixing auth/headers.
    const refresh = useMutation({
        mutationFn: () => refreshMcpTools(mcpId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["mcps", mcpId, "tools"] });
            queryClient.invalidateQueries({ queryKey: ["mcps"] });
        },
    });

    return (
        <div className="rounded-lg border bg-muted/20 p-2">
            <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-xs font-medium text-muted-foreground">
                    Tools
                </span>
                <Button
                    variant="ghost"
                    size="xs"
                    className="text-muted-foreground"
                    disabled={refresh.isPending}
                    onClick={() => refresh.mutate()}
                >
                    <RefreshCw
                        className={`size-3 ${refresh.isPending ? "animate-spin" : ""}`}
                    />
                    {refresh.isPending ? "Fetching..." : "Refresh"}
                </Button>
            </div>

            <div className="max-h-64 overflow-y-auto pr-0.5">
                {refresh.isError && (
                    <p className="px-1 py-2 text-xs text-destructive">
                        Failed to fetch tools. Check the server URL and headers.
                    </p>
                )}
                {isPending ? (
                    <p className="px-1 py-2 text-xs text-muted-foreground">
                        Loading tools...
                    </p>
                ) : isError || !data ? (
                    <p className="px-1 py-2 text-xs text-destructive">
                        Failed to load tools
                    </p>
                ) : data.data.length === 0 ? (
                    <p className="px-1 py-2 text-xs text-muted-foreground">
                        No tools found. Try Refresh if this server needs auth.
                    </p>
                ) : (
                    <div className="flex flex-col gap-2">
                        {data.data.map((tool) => (
                            <ToolItem key={tool.id} tool={tool} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ---------- MCP card ----------

function McpCard({ mcp }: { mcp: Mcp }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <Card size="sm" className="h-fit self-start p-4">
            <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-primary/10 text-primary">
                        <Plug className="size-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate font-medium">{mcp.name}</p>
                        <CopyableUri uri={mcp.uri} />
                    </div>
                </div>
                <McpActions mcp={mcp} />
            </div>

            {mcp.description && (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                    {mcp.description}
                </p>
            )}

            <div>
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="flex w-full items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-sm transition-colors hover:bg-muted"
                    aria-expanded={expanded}
                >
                    <span className="flex items-center gap-1.5 font-medium">
                        <Wrench className="size-3.5 text-muted-foreground" />
                        {mcp.tools_count}{" "}
                        {mcp.tools_count === 1 ? "tool" : "tools"}
                    </span>
                    <ChevronDown
                        className={`size-4 text-muted-foreground transition-transform ${
                            expanded ? "rotate-180" : ""
                        }`}
                    />
                </button>

                {expanded && (
                    <div className="mt-2">
                        <ToolsPanel mcpId={mcp.id} />
                    </div>
                )}
            </div>
        </Card>
    );
}

// ---------- Route ----------

const LIMIT = 12;

const MCP_SORTS: Option[] = [
    { label: "Newest", value: "created_desc" },
    { label: "Oldest", value: "created_asc" },
    { label: "Name (A–Z)", value: "name_asc" },
    { label: "Name (Z–A)", value: "name_desc" },
    { label: "Most tools", value: "tools_count_desc" },
    { label: "Fewest tools", value: "tools_count_asc" },
];

function RouteComponent() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("");

    const {
        data: mcps,
        isPending,
        isError,
        isFetching,
    } = useQuery({
        queryKey: ["mcps", { page, search, sort }],
        queryFn: () =>
            getMcps({
                offset: page - 1,
                limit: LIMIT,
                search: search || undefined,
                sort: sort || undefined,
            }),
        placeholderData: keepPreviousData,
    });
    const pagination = mcps?.pagination;

    function resetTo<T>(setter: (v: T) => void) {
        return (v: T) => {
            setter(v);
            setPage(1);
        };
    }

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                <div className="sticky top-0 flex items-center gap-4 border-b bg-background px-6 py-4">
                    <div className="min-w-0 flex-1">
                        <h1 className="font-heading text-2xl font-semibold">
                            All MCPs
                        </h1>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <ListToolbar
                        search={search}
                        onSearchChange={resetTo(setSearch)}
                        searchPlaceholder="Search MCPs..."
                        sort={{
                            label: "Sort",
                            value: sort,
                            options: MCP_SORTS,
                            onChange: resetTo(setSort),
                        }}
                        action={<AddMcpDialog />}
                    />
                    {isPending ? (
                        <div className="flex items-center justify-center py-16">
                            <p className="text-sm text-muted-foreground">
                                Loading MCPs...
                            </p>
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
                            <Plug className="size-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">
                                Failed to load MCPs
                            </p>
                        </div>
                    ) : mcps.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
                            <Plug className="size-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">
                                No MCPs found
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {mcps.data.map((mcp) => (
                                    <McpCard key={mcp.id} mcp={mcp} />
                                ))}
                            </div>
                            <DataTablePaginationBar
                                page={page}
                                totalPage={pagination?.total_page ?? 1}
                                totalRow={pagination?.total_row ?? 0}
                                onPageChange={setPage}
                                disabled={isFetching}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
