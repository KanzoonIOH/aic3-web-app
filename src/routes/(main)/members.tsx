import {
    acceptMember,
    deleteMember,
    getMembers,
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
import {
    TanStackDataTable,
    type ColumnDef,
} from "@/components/ui/tanstack-table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { MoreHorizontal, Trash2, UserCheck, Users } from "lucide-react";

export const Route = createFileRoute("/(main)/members")({
    component: RouteComponent,
});

const ROLE_LABELS: Record<string, string> = {
    new: "New",
    user: "User",
    admin: "Admin",
};

const ROLE_COLORS: Record<string, string> = {
    new: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    user: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    admin: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
};

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

function MemberActions({ member }: { member: Member }) {
    const queryClient = useQueryClient();

    const { mutate: accept, isPending: isAccepting } = useMutation({
        mutationFn: () => acceptMember(member.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["members"] });
        },
    });

    const { mutate: setStatus, isPending: isUpdatingStatus } = useMutation({
        mutationFn: (status: string) =>
            updateMemberStatus(member.id, { role: status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["members"] });
        },
    });

    const { mutate: remove, isPending: isRemoving } = useMutation({
        mutationFn: () => deleteMember(member.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["members"] });
        },
    });

    const isPending = isAccepting || isUpdatingStatus || isRemoving;

    return (
        <div className="flex items-center justify-end gap-1">
            {member.role === "new" && (
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
                        {member.role !== "new" && (
                            <>
                                <DropdownMenuItem
                                    disabled={
                                        member.role === "user" || isPending
                                    }
                                    onClick={() => setStatus("user")}
                                >
                                    Set as User
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    disabled={
                                        member.role === "admin" || isPending
                                    }
                                    onClick={() => setStatus("admin")}
                                >
                                    Set as Admin
                                </DropdownMenuItem>
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

function RouteComponent() {
    const {
        data: members,
        isPending,
        isError,
    } = useQuery({
        queryKey: ["members"],
        queryFn: getMembers,
    });

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                <div className="sticky top-0 px-6 py-4 flex items-center gap-4 bg-background border-b">
                    <div className="min-w-0 flex-1">
                        <h1 className="font-heading text-2xl font-semibold">
                            Members
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Manage user accounts and their roles.
                        </p>
                    </div>
                </div>

                <div className="p-6">
                    <TanStackDataTable
                        columns={memberColumns}
                        data={members?.data ?? []}
                        getRowKey={(member) => member.id}
                        enableSorting={false}
                        isLoading={isPending}
                        isError={isError}
                        loadingMessage="Loading members..."
                        errorMessage="Failed to load members"
                        emptyMessage="No members found"
                        emptyIcon={
                            <Users className="size-8 text-muted-foreground/40" />
                        }
                    />
                </div>
            </div>
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

const memberColumns: ColumnDef<Member>[] = [
    {
        id: "name",
        header: "Name",
        meta: { className: "font-medium" },
        cell: ({ row }) => row.original.name || "—",
    },
    {
        id: "username",
        header: "Username",
        meta: { className: "text-muted-foreground" },
        cell: ({ row }) => row.original.username,
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
