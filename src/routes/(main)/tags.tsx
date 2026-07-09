import { deleteTag, getTags, updateTag, type Tag } from "@/api/tags";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    TanStackDataTable,
    type ColumnDef,
} from "@/components/ui/tanstack-table";
import { TAG_COLORS } from "@/lib/tag-color";
import { cn, resolveServerMessage } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Tag as TagIcon, Trash2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/(main)/tags")({
    component: RouteComponent,
});

// Renames/recolors cascade to every agent, so refresh agents too.
function useTagInvalidate() {
    const queryClient = useQueryClient();
    return () => {
        queryClient.invalidateQueries({ queryKey: ["tags"] });
        queryClient.invalidateQueries({ queryKey: ["agents"] });
    };
}

function EditTagDialog({
    tag,
    open,
    onOpenChange,
}: {
    tag: Tag;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const invalidate = useTagInvalidate();
    const [name, setName] = useState(tag.name);
    const [color, setColor] = useState(tag.color);

    const mutation = useMutation({
        mutationFn: () => updateTag(tag.id, { name: name.trim(), color }),
        onSuccess: () => {
            invalidate();
            onOpenChange(false);
        },
    });

    function handleOpenChange(next: boolean) {
        if (next) {
            setName(tag.name);
            setColor(tag.color);
            mutation.reset();
        }
        onOpenChange(next);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Edit tag</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    {mutation.isError && (
                        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {resolveServerMessage(mutation.error)}
                        </p>
                    )}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="tag-name">Name</Label>
                        <Input
                            id="tag-name"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                mutation.reset();
                            }}
                            autoFocus
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>Color</Label>
                        <div className="flex flex-wrap items-center gap-2">
                            {TAG_COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    aria-label={`Use color ${c}`}
                                    onClick={() => {
                                        setColor(c);
                                        mutation.reset();
                                    }}
                                    className={cn(
                                        "size-7 rounded-full border transition-transform hover:scale-110",
                                        color.toLowerCase() === c
                                            ? "ring-2 ring-ring ring-offset-2 ring-offset-background"
                                            : "",
                                    )}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                            {/* Custom pick: a nicer swatch that opens the native
                                picker, so we're not stuck showing the ugly OS box. */}
                            <label
                                className={cn(
                                    "relative flex size-7 cursor-pointer items-center justify-center rounded-full border bg-gradient-to-br from-red-500 via-green-500 to-blue-500 transition-transform hover:scale-110",
                                    !TAG_COLORS.includes(
                                        color.toLowerCase() as (typeof TAG_COLORS)[number],
                                    )
                                        ? "ring-2 ring-ring ring-offset-2 ring-offset-background"
                                        : "",
                                )}
                                title="Custom color"
                            >
                                <Plus className="size-3.5 text-white drop-shadow" />
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => {
                                        setColor(e.target.value);
                                        mutation.reset();
                                    }}
                                    className="absolute inset-0 cursor-pointer opacity-0"
                                />
                            </label>
                            <span className="text-sm text-muted-foreground">
                                {color}
                            </span>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button
                        disabled={!name.trim() || mutation.isPending}
                        onClick={() => mutation.mutate()}
                    >
                        {mutation.isPending ? "Saving..." : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function TagActions({ tag }: { tag: Tag }) {
    const invalidate = useTagInvalidate();
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const remove = useMutation({
        mutationFn: () => deleteTag(tag.id),
        onSuccess: () => {
            invalidate();
            setDeleteOpen(false);
        },
    });

    return (
        <div className="flex justify-end gap-1">
            <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground"
                aria-label="Edit tag"
                onClick={() => setEditOpen(true)}
            >
                <Pencil className="size-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-destructive"
                aria-label="Delete tag"
                onClick={() => setDeleteOpen(true)}
            >
                <Trash2 className="size-4" />
            </Button>

            <EditTagDialog
                tag={tag}
                open={editOpen}
                onOpenChange={setEditOpen}
            />
            <ConfirmDeleteDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                onConfirm={() => remove.mutate()}
                isPending={remove.isPending}
                title="Delete tag?"
                name={tag.name}
                description={
                    <>
                        <span className="font-medium text-foreground">
                            {tag.name}
                        </span>{" "}
                        will be removed from every agent that uses it. This
                        action cannot be undone.
                    </>
                }
            />
        </div>
    );
}

// "" when zero, so the caller can drop empty types from the breakdown.
function pluralize(n: number, singular: string, plural = `${singular}s`): string {
    if (n === 0) return "";
    return `${n} ${n === 1 ? singular : plural}`;
}

const columns: ColumnDef<Tag>[] = [
    {
        id: "name",
        header: "Name",
        meta: { className: "font-medium" },
        cell: ({ row }) => row.original.name,
    },
    {
        id: "color",
        header: "Color",
        enableSorting: false,
        cell: ({ row }) => (
            <span
                className="inline-block size-5 rounded-full border"
                style={{ backgroundColor: row.original.color }}
                title={row.original.color}
            />
        ),
    },
    {
        id: "used_by",
        header: "Used by",
        meta: { className: "text-muted-foreground" },
        cell: ({ row }) => {
            const parts = [
                pluralize(row.original.agents_count ?? 0, "agent"),
                pluralize(row.original.mcps_count ?? 0, "MCP"),
                pluralize(row.original.knowledges_count ?? 0, "knowledge", "knowledges"),
            ].filter(Boolean);
            return parts.length ? parts.join(" · ") : "Unused";
        },
    },
    {
        id: "actions",
        header: "",
        enableSorting: false,
        meta: { headerClassName: "w-0", className: "text-right" },
        cell: ({ row }) => <TagActions tag={row.original} />,
    },
];

function RouteComponent() {
    const { data, isPending, isError } = useQuery({
        queryKey: ["tags"],
        queryFn: getTags,
    });

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                <div className="sticky top-0 z-10 border-b bg-background px-6 py-4">
                    <h1 className="font-heading text-2xl font-semibold">Tags</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Rename or recolor a tag — every agent using it updates
                        automatically.
                    </p>
                </div>

                <div className="p-6">
                    <TanStackDataTable
                        columns={columns}
                        data={data?.data ?? []}
                        getRowKey={(tag) => tag.id}
                        enableSorting={false}
                        isLoading={isPending}
                        isError={isError}
                        loadingMessage="Loading tags..."
                        errorMessage="Failed to load tags"
                        emptyMessage="No tags yet. Add tags to an agent to create them."
                        emptyIcon={
                            <TagIcon className="size-8 text-muted-foreground/40" />
                        }
                    />
                </div>
            </div>
        </div>
    );
}
