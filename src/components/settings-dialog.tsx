import {
    getMe,
    updateDetails,
    updatePassword,
    uploadAvatar,
    type Me,
} from "@/api/me";
import { AvatarPicker } from "@/components/avatar-picker";
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
import { useState } from "react";

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

    const [name, setName] = useState(me.name);
    const [username, setUsername] = useState(me.username);
    const [image, setImage] = useState<string>(me.image ?? "");
    // Cropped picture pending upload; uploaded on submit, not on crop.
    const [imageFile, setImageFile] = useState<File | null>(null);

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const profile = useMutation({
        // Upload the cropped avatar first (if any), then persist details.
        mutationFn: async () => {
            const imageUrl = imageFile
                ? (await uploadAvatar(imageFile)).data.image
                : image;
            return updateDetails({
                name,
                username,
                image: imageUrl || null,
            });
        },
        onSuccess: (res) => {
            queryClient.setQueryData(["me"], res);
            setUser({ username: res.data.username, image: res.data.image });
            onClose();
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
                    <AvatarPicker
                        value={image}
                        onChange={(v) => {
                            setImage(v);
                            setImageFile(null);
                        }}
                        onFile={setImageFile}
                        name={username}
                    />

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
