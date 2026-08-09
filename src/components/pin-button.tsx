import {
    createPin,
    deletePin,
    getPinIds,
    type PinEntityType,
} from "@/api/pins";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pin, PinOff } from "lucide-react";

// usePinnedSet loads the caller's pinned (type, id) pairs once and exposes a
// fast membership check. Shared across every list/detail page so pin state is
// consistent app-wide.
export function usePinnedSet() {
    const { data } = useQuery({
        queryKey: ["pins", "ids"],
        queryFn: getPinIds,
    });
    const set = new Set(
        (data?.data ?? []).map((p) => `${p.entity_type}:${p.entity_id}`),
    );
    return {
        isPinned: (type: PinEntityType, id: string) =>
            set.has(`${type}:${id}`),
    };
}

// invalidatePins refreshes both the sidebar list and the id-set after a change.
function useInvalidatePins() {
    const queryClient = useQueryClient();
    return () => {
        queryClient.invalidateQueries({ queryKey: ["pins"] });
    };
}

interface PinButtonProps {
    entityType: PinEntityType;
    entityId: string;
    // Optional controlled state; when omitted the button reads from usePinnedSet.
    pinned?: boolean;
    // "icon" = compact icon-only (list rows); "labeled" = icon + text (detail
    // page headers).
    variant?: "icon" | "labeled";
    className?: string;
}

// PinButton is the single app-wide control for pinning any entity to the
// sidebar. Drop it into a dashboard card, an agent header, a chat row — the
// behaviour and look stay identical everywhere.
export function PinButton({
    entityType,
    entityId,
    pinned: pinnedProp,
    variant = "icon",
    className,
}: PinButtonProps) {
    const { isPinned } = usePinnedSet();
    const invalidate = useInvalidatePins();
    const pinned = pinnedProp ?? isPinned(entityType, entityId);

    const toggle = useMutation({
        mutationFn: () =>
            pinned
                ? deletePin({ entity_type: entityType, entity_id: entityId })
                : createPin({ entity_type: entityType, entity_id: entityId }),
        onSuccess: invalidate,
    });

    if (variant === "labeled") {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={() => toggle.mutate()}
                disabled={toggle.isPending}
                className={className}
            >
                {pinned ? (
                    <>
                        <PinOff className="size-3.5" /> Unpin
                    </>
                ) : (
                    <>
                        <Pin className="size-3.5" /> Pin
                    </>
                )}
            </Button>
        );
    }

    return (
        <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggle.mutate();
            }}
            disabled={toggle.isPending}
            title={pinned ? "Unpin from sidebar" : "Pin to sidebar"}
            aria-pressed={pinned}
            className={cn(
                "shrink-0",
                pinned
                    ? "text-primary hover:text-primary"
                    : "text-muted-foreground hover:text-foreground",
                className,
            )}
        >
            <Pin className={cn("size-4", pinned && "fill-current")} />
        </Button>
    );
}
