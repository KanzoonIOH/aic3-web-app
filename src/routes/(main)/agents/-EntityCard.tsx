import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { tagChipStyle } from "@/lib/tag-color";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { type ReactNode, useState } from "react";

// Avatar matching the agent-garden convention: size-14 square, rounded-xl.
function EntityAvatar({
    name,
    image,
}: {
    name: string;
    image?: string | null;
}) {
    const box =
        "flex aspect-square size-14 items-center justify-center overflow-hidden rounded-xl border bg-primary/10 text-xl font-semibold text-primary";
    if (image && /^https?:\/\//.test(image)) {
        return (
            <div className={box}>
                <img
                    src={image}
                    alt={name}
                    className="size-full object-cover"
                />
            </div>
        );
    }
    if (image) return <div className={box}>{image}</div>;
    const parts = name.trim().split(/\s+/);
    const initial =
        parts.length === 1
            ? (parts[0][0] ?? "?").toUpperCase()
            : (parts[0][0] + parts[1][0]).toUpperCase();
    return <div className={box}>{initial}</div>;
}

export interface CardTag {
    name: string;
    color?: string;
}

// Shared list card for Agent Garden and Agent Orchestrator. The only thing
// that differs between the two is the bottom info row (footer), so that's a
// slot. Edit + delete are wired here so both cards behave identically;
// `onOpen` is the owning page's typed navigate.
export function EntityCard({
    name,
    description,
    image,
    isActive,
    tags,
    editTrigger,
    onDelete,
    invalidateKey,
    onOpen,
    footer,
}: {
    name: string;
    description?: string | null;
    image?: string | null;
    isActive: boolean;
    tags?: CardTag[];
    // Renders the edit drawer; the caller supplies its own dialog + trigger button.
    editTrigger: ReactNode;
    // delete orchestrator/agent by id; the card owns the confirm dialog.
    onDelete: () => Promise<unknown>;
    invalidateKey: unknown[];
    onOpen: () => void;
    // Bottom info row — knowledges/mcps for agents, agents count for orchestrators.
    footer: ReactNode;
}) {
    const queryClient = useQueryClient();
    const [deleteOpen, setDeleteOpen] = useState(false);

    const remove = useMutation({
        mutationFn: onDelete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: invalidateKey });
            setDeleteOpen(false);
        },
    });

    return (
        <Card
            role="button"
            tabIndex={0}
            onClick={onOpen}
            onKeyDown={(e) => {
                // ponytail: only the focused card handles keys; ignore keys bubbling from children (dialog inputs)
                if (e.target !== e.currentTarget) return;
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen();
                }
            }}
            className="group/card flex cursor-pointer flex-col gap-3 rounded-xl bg-inherit p-4 transition-colors hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-stretch gap-3">
                    <EntityAvatar name={name} image={image} />
                    <div className="flex h-14 flex-col justify-between">
                        <Badge
                            variant={isActive ? "outline" : "secondary"}
                            className="w-fit"
                        >
                            {isActive && (
                                <span className="relative flex size-2">
                                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-75" />
                                    <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                                </span>
                            )}
                            {isActive ? "Active" : "Inactive"}
                        </Badge>
                        {tags && tags.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <span
                                    className="max-w-[8rem] truncate rounded-full border px-2 py-0.5 text-xs"
                                    style={tagChipStyle(tags[0].color)}
                                >
                                    {tags[0].name}
                                </span>
                                {tags.length > 1 && (
                                    <span className="text-xs text-muted-foreground">
                                        +{tags.length - 1}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 opacity-0 transition-opacity group-hover/card:opacity-100 focus-within:opacity-100"
                >
                    {editTrigger}
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Delete ${name}`}
                        onClick={() => setDeleteOpen(true)}
                    >
                        <Trash2 className="size-3.5" />
                    </Button>

                    {/* Inside the stopPropagation wrapper: Radix portals bubble
                        React events to their tree parent (the Card), which
                        would navigate to the detail page. */}
                    <ConfirmDeleteDialog
                        open={deleteOpen}
                        onOpenChange={setDeleteOpen}
                        onConfirm={() => remove.mutate()}
                        isPending={remove.isPending}
                        title={`Delete ${name}?`}
                        name={name}
                    />
                </div>
            </div>

            <span className="line-clamp-2 text-xl font-semibold">{name}</span>

            <p className="max-h-[4.5rem] overflow-y-auto text-sm leading-relaxed text-muted-foreground">
                {description}
            </p>

            <div className="mt-auto flex gap-4 pt-1">{footer}</div>
        </Card>
    );
}

// Re-export Pencil so callers building edit triggers share one import shape.
export { Pencil };
