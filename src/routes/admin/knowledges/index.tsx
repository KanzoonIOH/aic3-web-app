import {
    createKnowledge,
    deleteKnowledge,
    getKnowledges,
    updateKnowledge,
    type Knowledge,
} from "@/api/knowledges";
import { getTags } from "@/api/tags";
import { KnowledgeAgentAccessDialog } from "@/components/agent-knowledge-access-dialog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { ListToolbar, type Option } from "@/components/list-toolbar";
import { TagsInput } from "@/components/tags-input";
import { tagChipStyle } from "@/lib/tag-color";
import { CopyableUri } from "@/components/copy-button";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    TanStackDataTable,
    type ColumnDef,
} from "@/components/ui/tanstack-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    BookOpen,
    FileUp,
    MoreHorizontal,
    Paperclip,
    Plus,
} from "lucide-react";
import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { z } from "zod";

export const Route = createFileRoute("/admin/knowledges/")({
    component: RouteComponent,
});

// ---------- Schemas ----------

const createKnowledgeSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    description: z.string().trim(),
});

// ponytail: source_type is just the file extension. No dropdown, no field.
function sourceTypeFromFile(file: File): string {
    const ext = file.name.split(".").pop()?.toLowerCase();
    return ext && ext !== file.name.toLowerCase() ? ext : "file";
}

const editKnowledgeSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    description: z.string().trim(),
});

type CreateKnowledgeValues = z.infer<typeof createKnowledgeSchema>;
type EditKnowledgeValues = z.infer<typeof editKnowledgeSchema>;

// ---------- Create dialog ----------

function CreateKnowledgeDialog() {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<"file" | "link">("file");
    const [file, setFile] = useState<File | null>(null);
    const [url, setUrl] = useState("");
    const [crawl, setCrawl] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [tags, setTags] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    function resetExtras() {
        setMode("file");
        setFile(null);
        setUrl("");
        setCrawl(false);
        setTags([]);
    }

    const mutation = useMutation({
        mutationFn: createKnowledge,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["knowledges"] });
            queryClient.invalidateQueries({ queryKey: ["tags"] });
            setOpen(false);
            form.reset();
            resetExtras();
        },
    });

    const form = useForm({
        defaultValues: {
            name: "",
            description: "",
        } satisfies CreateKnowledgeValues,
        onSubmit: async ({ value }) => {
            const result = createKnowledgeSchema.safeParse(value);
            if (!result.success) return;
            if (mode === "link") {
                if (!url.trim()) return;
                await mutation.mutateAsync({
                    ...result.data,
                    source_type: "web",
                    source_uri: url.trim(),
                    is_crawl: crawl,
                    tags,
                });
                return;
            }
            if (!file) return;
            await mutation.mutateAsync({
                ...result.data,
                source_type: sourceTypeFromFile(file),
                file,
                tags,
            });
        },
    });

    function handleOpenChange(nextOpen: boolean) {
        setOpen(nextOpen);
        if (!nextOpen) {
            mutation.reset();
            form.reset();
            resetExtras();
        }
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const picked = e.target.files?.[0];
        if (!picked) return;
        setFile(picked);
        mutation.reset();
        // reset input so the same file can be re-selected if needed
        e.target.value = "";
    }

    function handleChangeFile() {
        setFile(null);
        fileInputRef.current?.click();
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragging(false);
        const dropped = e.dataTransfer.files?.[0];
        if (!dropped) return;
        setFile(dropped);
        mutation.reset();
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="size-3.5" />
                    Add knowledge
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add knowledge</DialogTitle>
                    <DialogDescription>
                        Create a new knowledge source.
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

                    {/* Name */}
                    <form.Field
                        name="name"
                        validators={{
                            onChange: ({ value }) => {
                                const r = createKnowledgeSchema.shape.name.safeParse(value);
                                return r.success ? undefined : r.error.issues[0]?.message;
                            },
                            onSubmit: ({ value }) => {
                                const r = createKnowledgeSchema.shape.name.safeParse(value);
                                return r.success ? undefined : r.error.issues[0]?.message;
                            },
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
                                    placeholder="My knowledge base"
                                    aria-invalid={field.state.meta.errors.length > 0}
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

                    {/* Description */}
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

                    {/* Source: upload a file or point at a link */}
                    <div className="flex flex-col gap-1.5">
                        <Label>Source</Label>
                        <div className="grid grid-cols-2 gap-1 rounded-md bg-muted/50 p-1">
                            {(["file", "link"] as const).map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => {
                                        setMode(m);
                                        mutation.reset();
                                    }}
                                    className={`rounded px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                                        mode === m
                                            ? "bg-background shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {m === "file" ? "Upload file" : "Link"}
                                </button>
                            ))}
                        </div>

                        {mode === "file" ? (
                            <>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                {!file ? (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setDragging(true);
                                        }}
                                        onDragLeave={() => setDragging(false)}
                                        onDrop={handleDrop}
                                        className={`flex items-center gap-2 rounded-md border border-dashed px-3 py-4 text-sm transition-colors w-full justify-center ${
                                            dragging
                                                ? "border-ring bg-muted/50 text-foreground"
                                                : "border-input text-muted-foreground hover:border-ring hover:text-foreground"
                                        }`}
                                    >
                                        <FileUp className="size-4" />
                                        {dragging
                                            ? "Drop the document here"
                                            : "Click or drag & drop a document"}
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2 rounded-md border border-input bg-muted/30 px-3 py-2.5 text-sm">
                                        <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                                        <span className="truncate flex-1 text-foreground font-medium">
                                            {file.name}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleChangeFile}
                                            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 shrink-0"
                                        >
                                            Change
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <Input
                                    type="url"
                                    value={url}
                                    onChange={(e) => {
                                        setUrl(e.target.value);
                                        mutation.reset();
                                    }}
                                    placeholder="https://example.com/docs"
                                />
                                <label className="mt-1 flex cursor-pointer items-start gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={crawl}
                                        onChange={(e) => setCrawl(e.target.checked)}
                                        className="mt-0.5 size-4"
                                    />
                                    <span>
                                        Crawl the whole site
                                        <span className="block text-xs text-muted-foreground">
                                            Off = index just this one page.
                                        </span>
                                    </span>
                                </label>
                            </>
                        )}
                    </div>

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
                            selector={(state) => [state.canSubmit, state.isSubmitting]}
                        >
                            {([canSubmit, isSubmitting]) => (
                                <Button
                                    type="submit"
                                    disabled={
                                        !canSubmit ||
                                        isSubmitting ||
                                        mutation.isPending ||
                                        (mode === "file" ? !file : !url.trim())
                                    }
                                >
                                    {mutation.isPending ? "Creating..." : "Create"}
                                </Button>
                            )}
                        </form.Subscribe>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ---------- Edit dialog ----------

function EditKnowledgeDialog({
    knowledge,
    open,
    onOpenChange,
}: {
    knowledge: Knowledge;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [tags, setTags] = useState<string[]>(
        (knowledge.tags ?? []).map((t) => t.name),
    );
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (payload: EditKnowledgeValues & { tags: string[] }) =>
            updateKnowledge(knowledge.id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["knowledges"] });
            queryClient.invalidateQueries({ queryKey: ["tags"] });
            onOpenChange(false);
        },
    });

    const form = useForm({
        defaultValues: {
            name: knowledge.name,
            description: knowledge.description ?? "",
        } satisfies EditKnowledgeValues,
        onSubmit: async ({ value }) => {
            const result = editKnowledgeSchema.safeParse(value);
            if (!result.success) return;
            await mutation.mutateAsync({ ...result.data, tags });
        },
    });

    function handleOpenChange(nextOpen: boolean) {
        onOpenChange(nextOpen);
        mutation.reset();
        setTags((knowledge.tags ?? []).map((t) => t.name));
        form.reset({ name: knowledge.name, description: knowledge.description ?? "" });
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit knowledge</DialogTitle>
                    <DialogDescription>
                        Update the name and description.
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

                    {/* Name */}
                    <form.Field
                        name="name"
                        validators={{
                            onChange: ({ value }) => {
                                const r = editKnowledgeSchema.shape.name.safeParse(value);
                                return r.success ? undefined : r.error.issues[0]?.message;
                            },
                            onSubmit: ({ value }) => {
                                const r = editKnowledgeSchema.shape.name.safeParse(value);
                                return r.success ? undefined : r.error.issues[0]?.message;
                            },
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
                                    aria-invalid={field.state.meta.errors.length > 0}
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

                    {/* Description */}
                    <form.Field
                        name="description"
                        validators={{
                            onChange: ({ value }) => {
                                const r = editKnowledgeSchema.shape.description.safeParse(value);
                                return r.success ? undefined : r.error.issues[0]?.message;
                            },
                            onSubmit: ({ value }) => {
                                const r = editKnowledgeSchema.shape.description.safeParse(value);
                                return r.success ? undefined : r.error.issues[0]?.message;
                            },
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
                                    aria-invalid={field.state.meta.errors.length > 0}
                                />
                                {field.state.meta.errors.length > 0 && (
                                    <p className="text-xs text-destructive">
                                        {field.state.meta.errors[0]}
                                    </p>
                                )}
                            </div>
                        )}
                    </form.Field>

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
                            selector={(state) => [state.canSubmit, state.isSubmitting]}
                        >
                            {([canSubmit, isSubmitting]) => (
                                <Button
                                    type="submit"
                                    disabled={!canSubmit || isSubmitting || mutation.isPending}
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

// ---------- Row actions ----------

function KnowledgeRowActions({ knowledge }: { knowledge: Knowledge }) {
    const [accessOpen, setAccessOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const queryClient = useQueryClient();

    const { mutate: remove, isPending: isDeleting } = useMutation({
        mutationFn: () => deleteKnowledge(knowledge.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["knowledges"] });
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

            <KnowledgeAgentAccessDialog
                knowledge={knowledge}
                open={accessOpen}
                onOpenChange={setAccessOpen}
            />

            <EditKnowledgeDialog
                knowledge={knowledge}
                open={editOpen}
                onOpenChange={setEditOpen}
            />

            <ConfirmDeleteDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                onConfirm={() => remove()}
                isPending={isDeleting}
                title="Delete knowledge?"
                name={knowledge.name}
            />
        </>
    );
}

// ---------- Columns ----------

export function createKnowledgeColumns({
    renderActions,
}: {
    renderActions?: (knowledge: Knowledge) => ReactNode;
} = {}): ColumnDef<Knowledge>[] {
    return [
        {
            id: "name",
            header: "Name",
            meta: { className: "font-medium max-w-48 truncate" },
            cell: ({ row }) => row.original.name,
        },
        {
            id: "description",
            header: "Description",
            meta: { className: "text-muted-foreground text-sm max-w-56 truncate" },
            cell: ({ row }) =>
                row.original.description ?? (
                    <span className="italic text-muted-foreground/50">—</span>
                ),
        },
        {
            id: "source_type",
            header: "Source Type",
            cell: ({ row }) => (
                <span className="capitalize text-sm">
                    {row.original.source_type}
                </span>
            ),
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
            id: "source_uri",
            header: "Source URI",
            meta: { className: "max-w-48" },
            cell: ({ row }) =>
                row.original.source_uri ? (
                    <CopyableUri uri={row.original.source_uri} />
                ) : (
                    <span className="text-muted-foreground/50 text-sm italic">
                        —
                    </span>
                ),
        },
        {
            id: "used_by",
            header: "Used By",
            meta: { className: "text-sm text-muted-foreground" },
            cell: ({ row }) => {
                const agentsCount = row.original.agents_count ?? 0;
                return `${agentsCount} ${agentsCount === 1 ? "agent" : "agents"}`;
            },
        },
        {
            id: "actions",
            meta: { cellClassName: "text-right" },
            cell: ({ row }) =>
                renderActions ? (
                    renderActions(row.original)
                ) : (
                    <KnowledgeRowActions knowledge={row.original} />
                ),
        },
    ];
}

export const knowledgeColumns = createKnowledgeColumns();

// ---------- Route ----------

const LIMIT = 10;

const KNOWLEDGE_SORTS: Option[] = [
    { label: "Newest", value: "created_desc" },
    { label: "Oldest", value: "created_asc" },
    { label: "Name (A–Z)", value: "name_asc" },
    { label: "Name (Z–A)", value: "name_desc" },
    { label: "Source type (A–Z)", value: "source_type_asc" },
    { label: "Source type (Z–A)", value: "source_type_desc" },
];

function RouteComponent() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("");
    const [sourceType, setSourceType] = useState("");
    const [tagId, setTagId] = useState("");

    const {
        data: knowledges,
        isPending,
        isError,
        isFetching,
    } = useQuery({
        queryKey: ["knowledges", { page, search, sort, sourceType, tagId }],
        queryFn: () =>
            getKnowledges({
                offset: page - 1,
                limit: LIMIT,
                search: search || undefined,
                sort: sort || undefined,
                source_type: sourceType || undefined,
                tag_id: tagId || undefined,
            }),
        placeholderData: keepPreviousData,
    });
    const pagination = knowledges?.pagination;

    const { data: tags } = useQuery({ queryKey: ["tags"], queryFn: getTags });
    const tagOptions: Option[] = (tags?.data ?? []).map((t) => ({
        label: t.name,
        value: t.id,
    }));

    // Reset to first page whenever the filters change.
    function resetTo<T>(setter: (v: T) => void) {
        return (v: T) => {
            setter(v);
            setPage(1);
        };
    }

    // Source types are open-ended file extensions; build the option list from
    // what's loaded and keep the active one so the selection never vanishes.
    const sourceTypeOptions: Option[] = Array.from(
        new Set(
            [...(knowledges?.data ?? []).map((k) => k.source_type), sourceType].filter(
                Boolean,
            ),
        ),
    ).map((t) => ({ label: t, value: t }));

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                <div className="sticky top-0 px-6 py-4 flex items-center gap-4 bg-background border-b">
                    <div className="min-w-0 flex-1">
                        <h1 className="font-heading text-2xl font-semibold">
                            All Knowledges
                        </h1>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <ListToolbar
                        search={search}
                        onSearchChange={resetTo(setSearch)}
                        searchPlaceholder="Search knowledges..."
                        filters={[
                            {
                                label: "Source type",
                                value: sourceType,
                                options: sourceTypeOptions,
                                onChange: resetTo(setSourceType),
                                allLabel: "All types",
                            },
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
                            options: KNOWLEDGE_SORTS,
                            onChange: resetTo(setSort),
                        }}
                        action={<CreateKnowledgeDialog />}
                    />
                    <TanStackDataTable
                        columns={knowledgeColumns}
                        data={knowledges?.data ?? []}
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
            </div>
        </div>
    );
}
