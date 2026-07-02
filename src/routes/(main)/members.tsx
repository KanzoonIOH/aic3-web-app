import {
    acceptMember,
    deleteMember,
    getMembers,
    inviteMember,
    updateMemberStatus,
    type Member,
} from "@/api/members";
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
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    TanStackDataTable,
    type ColumnDef,
} from "@/components/ui/tanstack-table";
import { cn, resolveServerMessage } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
    MailPlus,
    MoreHorizontal,
    Trash2,
    UserCheck,
    Users,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/(main)/members")({
    component: RouteComponent,
});

const ROLE_LABELS: Record<string, string> = {
    PENDING: "Pending",
    VIEWER: "Viewer",
    TECHNICAL: "Technical",
    ADMIN: "Admin",
    SUPERADMIN: "Superadmin",
};

const ROLE_COLORS: Record<string, string> = {
    PENDING:
        "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    VIEWER: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    TECHNICAL:
        "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
    ADMIN: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    SUPERADMIN:
        "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
};

const ASSIGNABLE_ROLES = ["VIEWER", "TECHNICAL", "ADMIN"] as const;

function RoleBadge({ role }: { role: string }) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                ROLE_COLORS[role] ??
                    "bg-muted text-muted-foreground border-border",
            )}
        >
            {ROLE_LABELS[role] ?? role}
        </span>
    );
}

function useCanManage() {
    const role = useAuthStore((s) => s.user?.role);
    return role === "ADMIN" || role === "SUPERADMIN";
}

// ---------- Invite dialog (D1) ----------

function InviteMemberDialog() {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [inviteUrl, setInviteUrl] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: () => inviteMember(email.trim()),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["members"] });
            setInviteUrl(res.data.invite_url);
            setEmail("");
        },
    });

    function handleOpenChange(next: boolean) {
        setOpen(next);
        if (!next) {
            mutation.reset();
            setEmail("");
            setInviteUrl(null);
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <MailPlus className="size-3.5" />
                    Invite member
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite member</DialogTitle>
                    <DialogDescription>
                        Send an email invite. They set a password and join as a
                        Viewer.
                    </DialogDescription>
                </DialogHeader>

                {inviteUrl ? (
                    <div className="flex flex-col gap-3 overflow-hidden">
                        <p className="text-sm text-muted-foreground">
                            Invite sent. You can also share this link directly:
                        </p>
                        <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-2 min-w-0">
                            <span className="flex-1 truncate font-mono text-xs overflow-hidden">
                                {inviteUrl}
                            </span>
                            <CopyButton value={inviteUrl} />
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                            >
                                Done
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (email.trim()) mutation.mutate();
                        }}
                        className="flex flex-col gap-4"
                    >
                        {mutation.isError && (
                            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                {resolveServerMessage(mutation.error)}
                            </p>
                        )}
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="invite-email">Email</Label>
                            <Input
                                id="invite-email"
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    mutation.reset();
                                }}
                                placeholder="teammate@example.com"
                                autoFocus
                            />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={
                                    !email.trim() || mutation.isPending
                                }
                            >
                                {mutation.isPending
                                    ? "Sending..."
                                    : "Send invite"}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ---------- Row actions ----------

function MemberActions({ member }: { member: Member }) {
    const queryClient = useQueryClient();
    const canManage = useCanManage();

    const { mutate: accept, isPending: isAccepting } = useMutation({
        mutationFn: () => acceptMember(member.id),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ["members"] }),
    });

    const { mutate: setStatus, isPending: isUpdatingStatus } = useMutation({
        mutationFn: (role: string) =>
            updateMemberStatus(member.id, { role }),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ["members"] }),
    });

    const { mutate: remove, isPending: isRemoving } = useMutation({
        mutationFn: () => deleteMember(member.id),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ["members"] }),
    });

    const isPending = isAccepting || isUpdatingStatus || isRemoving;

    // Non-admins can't change anyone's role (D4).
    if (!canManage) {
        return <span className="text-xs text-muted-foreground">—</span>;
    }

    return (
        <div className="flex items-center justify-end gap-1">
            {member.role === "PENDING" && member.has_password && (
                <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    disabled={isPending}
                    onClick={() => accept()}
                >
                    <UserCheck className="size-3.5" />
                    {isAccepting ? "Accepting..." : "Accept"}
                </Button>
            )}
            <AlertDialog>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground"
                            disabled={isPending}
                        >
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        {member.role !== "PENDING" && (
                            <>
                                {ASSIGNABLE_ROLES.map((role) => (
                                    <DropdownMenuItem
                                        key={role}
                                        disabled={
                                            member.role === role || isPending
                                        }
                                        onClick={() => setStatus(role)}
                                    >
                                        Set as {ROLE_LABELS[role]}
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                            </>
                        )}
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem variant="destructive">
                                <Trash2 className="size-4" />
                                Remove
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                    </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove member?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <span className="font-medium text-foreground">
                                {member.name || member.username}
                            </span>{" "}
                            will be permanently removed. This action cannot be
                            undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel variant="ghost">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={isRemoving}
                            onClick={() => remove()}
                        >
                            {isRemoving ? "Removing..." : "Remove"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function formatJoinedDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

const baseColumns: ColumnDef<Member>[] = [
    {
        id: "name",
        header: "Name",
        meta: { className: "font-medium" },
        cell: ({ row }) => row.original.name || "—",
    },
    {
        id: "email",
        header: "Email",
        meta: { className: "text-muted-foreground" },
        cell: ({ row }) => row.original.email,
    },
    {
        id: "role",
        header: "Role",
        cell: ({ row }) => <RoleBadge role={row.original.role} />,
    },
    {
        id: "joined",
        header: "Joined",
        meta: { className: "text-muted-foreground text-xs" },
        cell: ({ row }) => formatJoinedDate(row.original.created_at),
    },
    {
        id: "actions",
        meta: { headerClassName: "w-0" },
        cell: ({ row }) => <MemberActions member={row.original} />,
    },
];

// Pending table swaps the "joined" column for a source + invite-link column.
function InviteLinkCell({ member }: { member: Member }) {
    if (!member.invite_token) {
        return <span className="text-xs text-muted-foreground">—</span>;
    }
    const url = `${window.location.origin}/invite?key=${member.invite_token}`;
    return (
        <div className="flex items-center gap-1.5">
            <span className="max-w-40 truncate font-mono text-xs text-muted-foreground">
                {url}
            </span>
            <CopyButton value={url} />
        </div>
    );
}

const pendingColumns: ColumnDef<Member>[] = [
    baseColumns[0],
    baseColumns[1],
    {
        id: "source",
        header: "Source",
        cell: ({ row }) => (
            <span className="text-xs text-muted-foreground">
                {row.original.has_password ? "Self-registered" : "Invited"}
            </span>
        ),
    },
    {
        id: "invite_link",
        header: "Invite link",
        cell: ({ row }) => <InviteLinkCell member={row.original} />,
    },
    baseColumns[4],
];

function RouteComponent() {
    const canManage = useCanManage();

    const activeQuery = useQuery({
        queryKey: ["members", "active"],
        queryFn: () => getMembers(),
    });

    const pendingQuery = useQuery({
        queryKey: ["members", "pending"],
        queryFn: () => getMembers("PENDING"),
    });

    // The unfiltered list includes PENDING; show only non-pending in the main
    // table so the two tables don't overlap.
    const activeMembers = (activeQuery.data?.data ?? []).filter(
        (m) => m.role !== "PENDING",
    );

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="flex-1 space-y-8 overflow-y-auto">
                <div className="sticky top-0 z-10 border-b bg-background px-6 py-4">
                    <h1 className="font-heading text-2xl font-semibold">
                        Members
                    </h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Manage user accounts and their roles.
                    </p>
                </div>

                <div className="px-6">
                    <TanStackDataTable
                        columns={baseColumns}
                        data={activeMembers}
                        getRowKey={(member) => member.id}
                        enableSorting={false}
                        isLoading={activeQuery.isPending}
                        isError={activeQuery.isError}
                        loadingMessage="Loading members..."
                        errorMessage="Failed to load members"
                        emptyMessage="No members found"
                        emptyIcon={
                            <Users className="size-8 text-muted-foreground/40" />
                        }
                    />
                </div>

                <div className="px-6 pb-6">
                    <div className="mb-3 flex items-center justify-between">
                        <div>
                            <h2 className="font-heading text-lg font-semibold">
                                Pending
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Self-registered & invited, awaiting approval
                            </p>
                        </div>
                        {canManage && <InviteMemberDialog />}
                    </div>
                    <TanStackDataTable
                        columns={pendingColumns}
                        data={pendingQuery.data?.data ?? []}
                        getRowKey={(member) => member.id}
                        enableSorting={false}
                        isLoading={pendingQuery.isPending}
                        isError={pendingQuery.isError}
                        loadingMessage="Loading pending members..."
                        errorMessage="Failed to load pending members"
                        emptyMessage="No pending members"
                        emptyIcon={
                            <Users className="size-8 text-muted-foreground/40" />
                        }
                    />
                </div>
            </div>
        </div>
    );
}
