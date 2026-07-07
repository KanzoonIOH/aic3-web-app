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
import type { ReactNode } from "react";

// Canonical delete confirmation used everywhere (agents, tags, mcps,
// knowledges, members, chat). Controlled: open/onOpenChange + onConfirm.
export function ConfirmDeleteDialog({
    open,
    onOpenChange,
    onConfirm,
    isPending = false,
    title = "Delete?",
    // The bolded name spliced into the default description.
    name,
    description,
    confirmLabel = "Delete",
    pendingLabel = "Deleting...",
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isPending?: boolean;
    title?: string;
    name?: string;
    description?: ReactNode;
    confirmLabel?: string;
    pendingLabel?: string;
}) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description ?? (
                            <>
                                {name && (
                                    <>
                                        <span className="font-medium text-foreground">
                                            {name}
                                        </span>{" "}
                                    </>
                                )}
                                will be permanently deleted. This action cannot
                                be undone.
                            </>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel variant="ghost">
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        variant="destructive"
                        disabled={isPending}
                        onClick={(e) => {
                            // Keep the dialog controlled by the caller's mutation
                            // so it can close on success, not on click.
                            e.preventDefault();
                            onConfirm();
                        }}
                    >
                        {isPending ? pendingLabel : confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
