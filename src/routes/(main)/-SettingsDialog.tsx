import {
    getMe,
    updateDetails,
    updatePassword,
    uploadAvatar,
    type Me,
} from "@/api/me";
import { EmojiPickerPopover } from "@/components/emoji-picker";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { resolveServerMessage } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Smile } from "lucide-react";
import { useRef, useState } from "react";

export function SettingsDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    // Load canonical profile (name isn't in the auth store) when opened, then
    // mount the form fresh so its local state seeds from real values — no effect.
    // Always refetch on open so edits from a previous session aren't stale.
    const me = useQuery({
        queryKey: ["me"],
        queryFn: getMe,
        enabled: open,
        staleTime: 0,
        refetchOnMount: "always",
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Account settings</DialogTitle>
                    <DialogDescription>
                        Update your profile, avatar, and password.
                    </DialogDescription>
                </DialogHeader>
                {me.data?.data ? (
                    <SettingsForm
                        me={me.data.data}
                        onClose={() => onOpenChange(false)}
                    />
                ) : (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                        Loading…
                    </p>
                )}
            </DialogContent>
        </Dialog>
    );
}

function SettingsForm({ me, onClose }: { me: Me; onClose: () => void }) {
    const setUser = useAuthStore((s) => s.setUser);
    const queryClient = useQueryClient();
    const fileRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState(me.name);
    const [username, setUsername] = useState(me.username);
    const [image, setImage] = useState<string>(me.image ?? "");

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const profile = useMutation({
        mutationFn: () => updateDetails({ name, username, image: image || null }),
        onSuccess: (res) => {
            queryClient.setQueryData(["me"], res);
            setUser({ username: res.data.username, image: res.data.image });
            onClose();
        },
    });

    const avatar = useMutation({
        mutationFn: (file: File) => uploadAvatar(file),
        onSuccess: (res) => {
            queryClient.setQueryData(["me"], res);
            setImage(res.data.image ?? "");
            setUser({ image: res.data.image });
        },
    });

    const password = useMutation({
        mutationFn: () =>
            updatePassword({
                old_password: oldPassword,
                new_password: newPassword,
            }),
        onSuccess: () => {
            setOldPassword("");
            setNewPassword("");
        },
    });

    return (
        <>
            {/* Profile */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        profile.mutate();
                    }}
                    className="flex flex-col gap-4"
                >
                    <div className="flex items-center gap-4">
                        <UserAvatar image={image} name={username} size="lg" />
                        <div className="flex flex-wrap gap-2">
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) avatar.mutate(f);
                                    e.target.value = "";
                                }}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={avatar.isPending}
                                onClick={() => fileRef.current?.click()}
                            >
                                {avatar.isPending
                                    ? "Uploading..."
                                    : "Upload picture"}
                            </Button>
                            <EmojiPickerPopover
                                onSelect={setImage}
                                trigger={
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Smile className="size-4" />
                                        Emoji
                                    </Button>
                                }
                            />
                            {image && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setImage("")}
                                >
                                    Remove
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="set-name">Name</Label>
                        <Input
                            id="set-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="set-username">Username</Label>
                        <Input
                            id="set-username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    {profile.isError && (
                        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {resolveServerMessage(profile.error)}
                        </p>
                    )}

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            size="sm"
                            disabled={
                                profile.isPending ||
                                !name.trim() ||
                                !username.trim()
                            }
                        >
                            Save profile
                        </Button>
                    </div>
                </form>

                <Separator />

                {/* Password */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        password.mutate();
                    }}
                    className="flex flex-col gap-4"
                >
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="set-old-pw">Current password</Label>
                        <Input
                            id="set-old-pw"
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="set-new-pw">New password</Label>
                        <Input
                            id="set-new-pw"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>

                    {password.isError && (
                        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {resolveServerMessage(password.error)}
                        </p>
                    )}
                    {password.isSuccess && (
                        <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
                            Password updated.
                        </p>
                    )}

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            disabled={
                                password.isPending ||
                                !oldPassword ||
                                !newPassword
                            }
                        >
                            Change password
                        </Button>
                    </div>
                </form>
        </>
    );
}
