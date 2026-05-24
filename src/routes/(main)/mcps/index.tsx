import { getMcps, updateMcp, type Mcp } from "@/api/mcps";
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
import { MoreHorizontal, Plug, Plus } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

export const Route = createFileRoute("/(main)/mcps/")({
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

// ---------- Schema ----------

const editMcpSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    description: z.string().trim(),
});

type EditMcpValues = z.infer<typeof editMcpSchema>;

// ---------- Add MCP — request notice dialog ----------

function AddMcpDialog() {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
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
                        Adding a new MCP requires an official request.
                    </DialogDescription>
                </DialogHeader>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    MCP integrations are provisioned through a formal request
                    process. Please contact your administrator or submit a
                    request through the official channel to have a new MCP
                    added.
                </p>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                    </DialogClose>
                </DialogFooter>
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
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (payload: EditMcpValues) => updateMcp(mcp.id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["mcps"] });
            onOpenChange(false);
        },
    });

    const form = useForm({
        defaultValues: {
            name: mcp.name,
            description: mcp.description ?? "",
        } satisfies EditMcpValues,
        onSubmit: async ({ value }) => {
            const result = editMcpSchema.safeParse(value);
            if (!result.success) return;
            await mutation.mutateAsync(result.data);
        },
    });

    function handleOpenChange(nextOpen: boolean) {
        onOpenChange(nextOpen);
        mutation.reset();
        form.reset({ name: mcp.name, description: mcp.description ?? "" });
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit MCP</DialogTitle>
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
                                const r =
                                    editMcpSchema.shape.name.safeParse(value);
                                return r.success
                                    ? undefined
                                    : r.error.issues[0]?.message;
                            },
                            onSubmit: ({ value }) => {
                                const r =
                                    editMcpSchema.shape.name.safeParse(value);
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

                    {/* Description */}
                    <form.Field
                        name="description"
                        validators={{
                            onChange: ({ value }) => {
                                const r =
                                    editMcpSchema.shape.description.safeParse(
                                        value,
                                    );
                                return r.success
                                    ? undefined
                                    : r.error.issues[0]?.message;
                            },
                            onSubmit: ({ value }) => {
                                const r =
                                    editMcpSchema.shape.description.safeParse(
                                        value,
                                    );
                                return r.success
                                    ? undefined
                                    : r.error.issues[0]?.message;
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

// ---------- Table row ----------

function McpRow({ mcp }: { mcp: Mcp }) {
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    // const queryClient = useQueryClient();

    // const { mutate: remove, isPending: isDeleting } = useMutation({
    //     mutationFn: () => deleteMcp(mcp.id),
    //     onSuccess: () => {
    //         queryClient.invalidateQueries({ queryKey: ["mcps"] });
    //         setDeleteOpen(false);
    //     },
    // });

    return (
        <>
            <TableRow>
                <TableCell className="font-medium">{mcp.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-64">
                    {mcp.description ?? (
                        <span className="italic text-muted-foreground/50">
                            —
                        </span>
                    )}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground max-w-56 truncate">
                    {mcp.uri}
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
                            <DropdownMenuItem
                                onSelect={() => setEditOpen(true)}
                            >
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

            <EditMcpDialog
                mcp={mcp}
                open={editOpen}
                onOpenChange={setEditOpen}
            />

            {/* Delete — request notice */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete MCP</DialogTitle>
                        <DialogDescription>
                            Deleting an MCP requires an official request.
                        </DialogDescription>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        MCP deletion will effect agents reply success rate.
                        Please contact your administrator or submit a request
                        through the official channel to have an MCP removed.
                    </p>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/*<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete MCP?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <span className="font-medium text-foreground">
                                {mcp.name}
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
            </AlertDialog>*/}
        </>
    );
}

// ---------- Route ----------

function RouteComponent() {
    const {
        data: mcps,
        isPending,
        isError,
    } = useQuery({
        queryKey: ["mcps"],
        queryFn: getMcps,
    });

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                <div className="sticky top-0 px-6 py-4 flex items-center gap-4 bg-background border-b">
                    <div className="min-w-0 flex-1">
                        <h1 className="font-heading text-2xl font-semibold">
                            All MCPs
                        </h1>
                    </div>
                    <AddMcpDialog />
                </div>

                <div className="p-6">
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
                        <div className="rounded-lg border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>URI</TableHead>
                                        <TableHead />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mcps.data.map((mcp) => (
                                        <McpRow key={mcp.id} mcp={mcp} />
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
