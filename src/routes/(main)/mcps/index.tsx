import {
    createMcp,
    deleteMcp,
    getMcps,
    getMcpAgents,
    getMcpTools,
    refreshMcpTools,
    updateMcp,
    type Mcp,
    type McpAgent,
    type McpHeaders,
    type McpTool,
    type UpdateMcpRequest,
} from "@/api/mcps";
import { getTags } from "@/api/tags";
import { McpAgentAccessDialog } from "@/components/agent-mcp-access-dialog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { CopyableUri } from "@/components/copy-button";
import { ListToolbar, type Option } from "@/components/list-toolbar";
import { TagsInput } from "@/components/tags-input";
import { tagChipStyle } from "@/lib/tag-color";
import { Button } from "@/components/ui/button";
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
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    useResponsiveDrawerDirection,
} from "@/components/ui/drawer";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    TanStackDataTable,
    type ColumnDef,
} from "@/components/ui/tanstack-table";
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
    MoreHorizontal,
    Plug,
    Plus,
    RefreshCw,
    Trash2,
    Wrench,
} from "lucide-react";
import { useState, type ReactNode } from "react";
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
    const [tags, setTags] = useState<string[]>([]);
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: createMcp,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["mcps"] });
            queryClient.invalidateQueries({ queryKey: ["tags"] });
            setOpen(false);
            setHeaderRows([]);
            setTags([]);
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
                tags,
            });
        },
    });

    function handleOpenChange(nextOpen: boolean) {
        setOpen(nextOpen);
        if (!nextOpen) {
            mutation.reset();
            setHeaderRows([]);
            setTags([]);
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

                    <TagsInput
                        value={tags}
                        onChange={(t) => {
                            setTags(t);
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
    const [tags, setTags] = useState<string[]>(
        (mcp.tags ?? []).map((t) => t.name),
    );
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (payload: UpdateMcpRequest) => updateMcp(mcp.id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["mcps"] });
            queryClient.invalidateQueries({ queryKey: ["tags"] });
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
                tags,
            });
        },
    });

    function handleOpenChange(nextOpen: boolean) {
        onOpenChange(nextOpen);
        mutation.reset();
        setHeaderRows(headersToRows(mcp.headers));
        setTags((mcp.tags ?? []).map((t) => t.name));
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

                    <TagsInput
                        value={tags}
                        onChange={(t) => {
                            setTags(t);
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
    const [detailsOpen, setDetailsOpen] = useState(false);
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
                    <DropdownMenuItem onSelect={() => setDetailsOpen(true)}>
                        Details
                    </DropdownMenuItem>
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

            <McpDetailsDrawer
                mcp={mcp}
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
            />

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

// Tools list with a Refresh button. Rendered inside the drawer body, so it
// drops the bordered box / max-h the inline card version had — the drawer
// itself provides the scroll container.
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
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
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

            {refresh.isError && (
                <p className="py-2 text-xs text-destructive">
                    Failed to fetch tools. Check the server URL and headers.
                </p>
            )}
            {isPending ? (
                <p className="py-2 text-xs text-muted-foreground">
                    Loading tools...
                </p>
            ) : isError || !data ? (
                <p className="py-2 text-xs text-destructive">
                    Failed to load tools
                </p>
            ) : data.data.length === 0 ? (
                <p className="py-2 text-xs text-muted-foreground">
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
    );
}

// ---------- Details drawer ----------

// Agents connected to this MCP. Read-only list (connecting happens via the
// "Give Access" action in the row menu). Paginated like the access dialog.
function McpAgentsPanel({ mcpId }: { mcpId: string }) {
    const [page, setPage] = useState(1);
    const limit = 10;
    const { data, isPending, isError } = useQuery({
        queryKey: ["mcps", mcpId, "agents", page],
        queryFn: () => getMcpAgents(mcpId, { offset: page - 1, limit }),
    });

    const totalPage = data?.pagination?.total_page ?? 1;
    const agents: McpAgent[] = data?.data ?? [];

    return (
        <div className="flex flex-col gap-2">
            {isPending ? (
                <p className="py-2 text-xs text-muted-foreground">
                    Loading agents...
                </p>
            ) : isError ? (
                <p className="py-2 text-xs text-destructive">
                    Failed to load agents
                </p>
            ) : agents.length === 0 ? (
                <p className="py-2 text-xs text-muted-foreground">
                    Not connected to any agent yet.
                </p>
            ) : (
                <div className="flex flex-col divide-y rounded-lg border">
                    {agents.map((agent) => (
                        <div
                            key={agent.id}
                            className="flex items-center gap-3 px-3 py-2.5"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="truncate text-sm font-medium">
                                        {agent.name}
                                    </p>
                                    {agent.connected && (
                                        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                            Connected
                                        </span>
                                    )}
                                </div>
                                <p className="truncate text-xs text-muted-foreground">
                                    {agent.description || "No description"}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {totalPage > 1 && (
                <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        Prev
                    </Button>
                    <span className="text-xs text-muted-foreground">
                        {page} / {totalPage}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPage}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}

function DetailRow({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-0.5 py-2">
            <dt className="text-xs font-medium text-muted-foreground">
                {label}
            </dt>
            <dd className="text-sm">{children}</dd>
        </div>
    );
}

// Right-side (desktop) / bottom (mobile) drawer with Overview / Tools / Agents.
// Each tab's data is fetch-on-open (Tools/Agents only mount when the drawer is
// open; Overview uses only the row data already in hand).
function McpDetailsDrawer({
    mcp,
    open,
    onOpenChange,
    initialTab = "overview",
}: {
    mcp: Mcp;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialTab?: "overview" | "tools" | "agents";
}) {
    const direction = useResponsiveDrawerDirection();

    return (
        <Drawer open={open} onOpenChange={onOpenChange} direction={direction}>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>{mcp.name}</DrawerTitle>
                    <DrawerDescription>
                        <span className="font-mono">{mcp.uri}</span>
                    </DrawerDescription>
                </DrawerHeader>

                <Tabs defaultValue={initialTab} className="flex min-h-0 flex-1 flex-col">
                    <TabsList className="mx-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="tools">
                            Tools ({mcp.tools_count})
                        </TabsTrigger>
                        <TabsTrigger value="agents">Agents</TabsTrigger>
                    </TabsList>

                    <TabsContent
                        value="overview"
                        className="flex-1 overflow-y-auto px-4 pb-4"
                    >
                        <dl className="divide-y">
                            <DetailRow label="Name">{mcp.name}</DetailRow>
                            <DetailRow label="Description">
                                {mcp.description || (
                                    <span className="italic text-muted-foreground/50">
                                        No description
                                    </span>
                                )}
                            </DetailRow>
                            <DetailRow label="Server URL">
                                <CopyableUri uri={mcp.uri} />
                            </DetailRow>
                            <DetailRow label="Tools">
                                {mcp.tools_count}{" "}
                                {mcp.tools_count === 1 ? "tool" : "tools"}
                            </DetailRow>
                            <DetailRow label="Tags">
                                {(mcp.tags ?? []).length === 0 ? (
                                    <span className="italic text-muted-foreground/50">
                                        No tags
                                    </span>
                                ) : (
                                    <div className="flex flex-wrap items-center gap-1">
                                        {(mcp.tags ?? []).map((tag) => (
                                            <span
                                                key={tag.id}
                                                className="max-w-[8rem] truncate rounded-full border px-2 py-0.5 text-xs"
                                                style={tagChipStyle(tag.color)}
                                            >
                                                {tag.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </DetailRow>
                        </dl>
                    </TabsContent>

                    <TabsContent
                        value="tools"
                        className="flex-1 overflow-y-auto px-4 pb-4"
                    >
                        {open && <ToolsPanel mcpId={mcp.id} />}
                    </TabsContent>

                    <TabsContent
                        value="agents"
                        className="flex-1 overflow-y-auto px-4 pb-4"
                    >
                        {open && <McpAgentsPanel mcpId={mcp.id} />}
                    </TabsContent>
                </Tabs>
            </DrawerContent>
        </Drawer>
    );
}

// ---------- Columns ----------

// Name cell opens the details drawer on the Overview tab.
function NameCell({ mcp }: { mcp: Mcp }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="truncate text-left font-medium hover:underline"
            >
                {mcp.name}
            </button>
            <McpDetailsDrawer mcp={mcp} open={open} onOpenChange={setOpen} />
        </>
    );
}

// Tools cell opens the details drawer straight on the Tools tab.
function ToolsCell({ mcp }: { mcp: Mcp }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => setOpen(true)}
            >
                <Wrench className="size-3.5" />
                {mcp.tools_count} {mcp.tools_count === 1 ? "tool" : "tools"}
            </Button>
            <McpDetailsDrawer
                mcp={mcp}
                open={open}
                onOpenChange={setOpen}
                initialTab="tools"
            />
        </>
    );
}



export function createMcpColumns({
    renderActions,
}: {
    renderActions?: (mcp: Mcp) => ReactNode;
} = {}): ColumnDef<Mcp>[] {
    return [
        {
            id: "name",
            header: "Name",
            meta: { className: "max-w-48 truncate" },
            cell: ({ row }) => <NameCell mcp={row.original} />,
        },
        {
            id: "uri",
            header: "Server URL",
            meta: { className: "max-w-56" },
            cell: ({ row }) => <CopyableUri uri={row.original.uri} />,
        },
        {
            id: "tags",
            header: "Tags",
            cell: ({ row }) => {
                const tags = row.original.tags ?? [];
                if (tags.length === 0)
                    return (
                        <span className="italic text-muted-foreground/50">—</span>
                    );
                return (
                    <div className="flex flex-wrap items-center gap-1">
                        {tags.map((tag) => (
                            <span
                                key={tag.id}
                                className="max-w-[8rem] truncate rounded-full border px-2 py-0.5 text-xs"
                                style={tagChipStyle(tag.color)}
                            >
                                {tag.name}
                            </span>
                        ))}
                    </div>
                );
            },
        },
        {
            id: "tools",
            header: "Tools",
            enableSorting: false,
            cell: ({ row }) => <ToolsCell mcp={row.original} />,
        },
        {
            id: "used_by",
            header: "Used By",
            enableSorting: false,
            meta: { className: "text-sm text-muted-foreground" },
            cell: ({ row }) => {
                const agentsCount = row.original.agents_count ?? 0;
                return `${agentsCount} ${agentsCount === 1 ? "agent" : "agents"}`;
            },
        },
        {
            id: "actions",
            header: "",
            enableSorting: false,
            meta: { headerClassName: "w-0", cellClassName: "text-right" },
            cell: ({ row }) =>
                renderActions ? (
                    renderActions(row.original)
                ) : (
                    <McpActions mcp={row.original} />
                ),
        },
    ];
}

export const mcpColumns = createMcpColumns();

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
    const [tagId, setTagId] = useState("");

    const {
        data: mcps,
        isPending,
        isError,
        isFetching,
    } = useQuery({
        queryKey: ["mcps", { page, search, sort, tagId }],
        queryFn: () =>
            getMcps({
                offset: page - 1,
                limit: LIMIT,
                search: search || undefined,
                sort: sort || undefined,
                tag_id: tagId || undefined,
            }),
        placeholderData: keepPreviousData,
    });
    const pagination = mcps?.pagination;

    const { data: tags } = useQuery({ queryKey: ["tags"], queryFn: getTags });
    const tagOptions: Option[] = (tags?.data ?? []).map((t) => ({
        label: t.name,
        value: t.id,
    }));

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
                        filters={[
                            {
                                label: "Tag",
                                value: tagId,
                                options: tagOptions,
                                onChange: resetTo(setTagId),
                                allLabel: "All tags",
                            },
                        ]}
                        sort={{
                            label: "Sort",
                            value: sort,
                            options: MCP_SORTS,
                            onChange: resetTo(setSort),
                        }}
                        action={<AddMcpDialog />}
                    />
                    <TanStackDataTable
                        columns={mcpColumns}
                        data={mcps?.data ?? []}
                        getRowKey={(mcp) => mcp.id}
                        enableSorting={false}
                        isLoading={isPending}
                        isError={isError}
                        loadingMessage="Loading MCPs..."
                        errorMessage="Failed to load MCPs"
                        emptyMessage="No MCPs found"
                        emptyIcon={
                            <Plug className="size-8 text-muted-foreground/40" />
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
            </div>
        </div>
    );
}
