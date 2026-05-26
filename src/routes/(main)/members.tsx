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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
                    {isPending ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-16">
                            <p className="text-sm text-muted-foreground">
                                Loading members...
                            </p>
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
                            <Users className="size-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">
                                Failed to load members
                            </p>
                        </div>
                    ) : members.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
                            <Users className="size-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">
                                No members found
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Username</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead className="w-0" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {members.data.map((member) => (
                                        <MemberRow
                                            key={member.id}
                                            member={member}
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

function MemberRow({ member }: { member: Member }) {
    const formattedDate = new Date(member.created_at).toLocaleDateString(
        undefined,
        { year: "numeric", month: "short", day: "numeric" },
    );

    return (
        <TableRow>
            <TableCell className="font-medium">{member.name || "—"}</TableCell>
            <TableCell className="text-muted-foreground">
                {member.username}
            </TableCell>
            <TableCell className="text-muted-foreground">
                {member.email}
            </TableCell>
            <TableCell>
                <RoleBadge role={member.role} />
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">
                {formattedDate}
            </TableCell>
            <TableCell>
                <MemberActions member={member} />
            </TableCell>
        </TableRow>
    );
}
