import {
    createKnowledge,
    deleteKnowledge,
    getKnowledges,
    updateKnowledge,
    type Knowledge,
} from "@/api/knowledges";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import axios from "axios";
import {
    BookOpen,
    Check,
    Copy,
    FileUp,
    Loader2,
    MoreHorizontal,
    Paperclip,
    Plus,
} from "lucide-react";
import { useRef, useState } from "react";
import { z } from "zod";

export const Route = createFileRoute("/(main)/knowledges/")({
    component: RouteComponent,
});

// ---------- Helpers ----------

type ApiError = { message?: string };

function resolveServerMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as ApiError | undefined;
        return data?.message ?? error.message;
    }
    return "An unexpected error occurred.";
}

const textareaClass = cn(
    "min-h-20 w-full rounded-md border border-input bg-transparent px-2.5 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground",
    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
    "md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
);

// ---------- Schemas ----------

const createKnowledgeSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    description: z.string().trim(),
    source_type: z.string().trim().min(1, "Source type is required"),
    source_uri: z.string().trim(),
});

const editKnowledgeSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    description: z.string().trim(),
});

type CreateKnowledgeValues = z.infer<typeof createKnowledgeSchema>;
type EditKnowledgeValues = z.infer<typeof editKnowledgeSchema>;

// ---------- Fake upload ----------

const RUSTFS_BASE = "https://aiac-store.kocakhost.com/aiac/";

type UploadState =
    | { status: "idle" }
    | { status: "uploading"; fileName: string }
    | { status: "done"; fileName: string; url: string };

function simulateUpload(file: File): Promise<string> {
    return new Promise((resolve) => {
        setTimeout(() => {
            const safeName = file.name.replace(/\s+/g, "_");
            const ts = Date.now();
            resolve(`${RUSTFS_BASE}${ts}_${safeName}`);
        }, 1500);
    });
}

// ---------- Create dialog ----------

function CreateKnowledgeDialog() {
    const [open, setOpen] = useState(false);
    const [upload, setUpload] = useState<UploadState>({ status: "idle" });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: createKnowledge,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["knowledges"] });
            setOpen(false);
            form.reset();
            setUpload({ status: "idle" });
        },
    });

    const form = useForm({
        defaultValues: {
            name: "",
            description: "",
            source_type: "",
            source_uri: "",
        } satisfies CreateKnowledgeValues,
        onSubmit: async ({ value }) => {
            const result = createKnowledgeSchema.safeParse(value);
            if (!result.success) return;
            await mutation.mutateAsync(result.data);
        },
    });

    function handleOpenChange(nextOpen: boolean) {
        setOpen(nextOpen);
        if (!nextOpen) {
            mutation.reset();
            form.reset();
            setUpload({ status: "idle" });
        }
    }

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUpload({ status: "uploading", fileName: file.name });
        const url = await simulateUpload(file);
        setUpload({ status: "done", fileName: file.name, url });
        form.setFieldValue("source_uri", url);
        // reset input so the same file can be re-selected if needed
        e.target.value = "";
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

                    {/* Source type */}
                    <form.Field
                        name="source_type"
                        validators={{
                            onChange: ({ value }) => {
                                const r = createKnowledgeSchema.shape.source_type.safeParse(value);
                                return r.success ? undefined : r.error.issues[0]?.message;
                            },
                            onSubmit: ({ value }) => {
                                const r = createKnowledgeSchema.shape.source_type.safeParse(value);
                                return r.success ? undefined : r.error.issues[0]?.message;
                            },
                        }}
                    >
                        {(field) => (
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor={field.name}>Source Type</Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => {
                                        field.handleChange(e.target.value);
                                        mutation.reset();
                                    }}
                                    placeholder="e.g. web, pdf, database"
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

                    {/* Document upload */}
                    <div className="flex flex-col gap-1.5">
                        <Label>Document</Label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={upload.status === "uploading"}
                        />

                        {upload.status === "idle" && (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 rounded-md border border-dashed border-input px-3 py-4 text-sm text-muted-foreground hover:border-ring hover:text-foreground transition-colors w-full justify-center"
                            >
                                <FileUp className="size-4" />
                                Click to upload a document
                            </button>
                        )}

                        {upload.status === "uploading" && (
                            <div className="flex items-center gap-2 rounded-md border border-input bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
                                <Loader2 className="size-4 animate-spin shrink-0" />
                                <span className="truncate">
                                    Uploading{" "}
                                    <span className="font-medium text-foreground">
                                        {upload.fileName}
                                    </span>
                                    …
                                </span>
                            </div>
                        )}

                        {upload.status === "done" && (
                            <div className="flex items-center gap-2 rounded-md border border-input bg-muted/30 px-3 py-2.5 text-sm">
                                <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                                <span className="truncate flex-1 text-foreground font-medium">
                                    {upload.fileName}
                                </span>
                                <Check className="size-4 shrink-0 text-green-500" />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setUpload({ status: "idle" });
                                        form.setFieldValue("source_uri", "");
                                        fileInputRef.current?.click();
                                    }}
                                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 shrink-0"
                                >
                                    Change
                                </button>
                            </div>
                        )}
                    </div>

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
                                        upload.status === "uploading"
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
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (payload: EditKnowledgeValues) =>
            updateKnowledge(knowledge.id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["knowledges"] });
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
            await mutation.mutateAsync(result.data);
        },
    });

    function handleOpenChange(nextOpen: boolean) {
        onOpenChange(nextOpen);
        mutation.reset();
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

// ---------- Copyable URI ----------

function CopyableUri({ uri }: { uri: string }) {
    const [copied, setCopied] = useState(false);

    function handleCopy() {
        navigator.clipboard.writeText(uri).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    }

    const MAX = 32;
    const clipped = uri.length > MAX ? uri.slice(0, MAX) + "…" : uri;

    return (
        <div className="flex items-center gap-1.5 min-w-0">
            <span
                className="truncate font-mono text-xs text-muted-foreground"
                title={uri}
            >
                {clipped}
            </span>
            <Button
                variant="ghost"
                size="icon-xs"
                className="shrink-0 text-muted-foreground hover:text-foreground"
                onClick={handleCopy}
                aria-label="Copy URI"
            >
                {copied ? (
                    <Check className="size-3 text-green-500" />
                ) : (
                    <Copy className="size-3" />
                )}
            </Button>
        </div>
    );
}

// ---------- Table row ----------

function KnowledgeRow({ knowledge }: { knowledge: Knowledge }) {
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const queryClient = useQueryClient();
    const agentsCount = knowledge.agents_count ?? 3;

    const { mutate: remove, isPending: isDeleting } = useMutation({
        mutationFn: () => deleteKnowledge(knowledge.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["knowledges"] });
            setDeleteOpen(false);
        },
    });

    return (
        <>
            <TableRow>
                <TableCell className="font-medium max-w-48 truncate">{knowledge.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-56 truncate">
                    {knowledge.description ?? (
                        <span className="italic text-muted-foreground/50">—</span>
                    )}
                </TableCell>
                <TableCell>
                    <span className="capitalize text-sm">{knowledge.source_type}</span>
                </TableCell>
                <TableCell className="max-w-48">
                    {knowledge.source_uri ? (
                        <CopyableUri uri={knowledge.source_uri} />
                    ) : (
                        <span className="text-muted-foreground/50 text-sm italic">—</span>
                    )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                    {agentsCount} {agentsCount === 1 ? "agent" : "agents"}
                </TableCell>
                <TableCell className="text-right">
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
                </TableCell>
            </TableRow>

            <EditKnowledgeDialog
                knowledge={knowledge}
                open={editOpen}
                onOpenChange={setEditOpen}
            />

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete knowledge?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <span className="font-medium text-foreground">
                                {knowledge.name}
                            </span>{" "}
                            will be permanently deleted. This action cannot be
                            undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel variant="ghost">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={isDeleting}
                            onClick={() => remove()}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// ---------- Route ----------

function RouteComponent() {
    const {
        data: knowledges,
        isPending,
        isError,
    } = useQuery({
        queryKey: ["knowledges"],
        queryFn: getKnowledges,
    });

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                <div className="sticky top-0 px-6 py-4 flex items-center gap-4 bg-background border-b">
                    <div className="min-w-0 flex-1">
                        <h1 className="font-heading text-2xl font-semibold">
                            All Knowledges
                        </h1>
                    </div>
                    <CreateKnowledgeDialog />
                </div>

                <div className="p-6">
                    {isPending ? (
                        <div className="flex items-center justify-center py-16">
                            <p className="text-sm text-muted-foreground">
                                Loading knowledges...
                            </p>
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
                            <BookOpen className="size-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">
                                Failed to load knowledges
                            </p>
                        </div>
                    ) : knowledges.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
                            <BookOpen className="size-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">
                                No knowledges found
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-lg border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Source Type</TableHead>
                                        <TableHead>Source URI</TableHead>
                                        <TableHead>Used By</TableHead>
                                        <TableHead />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {knowledges.data.map((knowledge) => (
                                        <KnowledgeRow
                                            key={knowledge.id}
                                            knowledge={knowledge}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
