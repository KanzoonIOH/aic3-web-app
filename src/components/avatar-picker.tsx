import { uploadImage } from "@/api/agents";
import { EmojiPickerPopover } from "@/components/emoji-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/user-avatar";
import { useMutation } from "@tanstack/react-query";
import { Smile } from "lucide-react";
import { useRef } from "react";

// Picks an avatar for an agent: upload a picture (-> URL) or type an emoji.
// value is a URL, an emoji, or "" (none). Emojis never hit the server here.
export function AvatarPicker({
    value,
    onChange,
    name,
}: {
    value: string;
    onChange: (v: string) => void;
    name: string;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    const upload = useMutation({
        mutationFn: uploadImage,
        onSuccess: (url) => onChange(url),
    });

    return (
        <div className="flex flex-col gap-1.5">
            <Label>Avatar</Label>
            <div className="flex items-center gap-3">
                <UserAvatar image={value} name={name || "?"} size="lg" />
                <div className="flex flex-wrap gap-2">
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) upload.mutate(f);
                            e.target.value = "";
                        }}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={upload.isPending}
                        onClick={() => fileRef.current?.click()}
                    >
                        {upload.isPending ? "Uploading..." : "Upload"}
                    </Button>
                    <EmojiPickerPopover
                        onSelect={onChange}
                        trigger={
                            <Button type="button" variant="outline" size="sm">
                                <Smile className="size-4" />
                                Emoji
                            </Button>
                        }
                    />
                    {value && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onChange("")}
                        >
                            Remove
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
