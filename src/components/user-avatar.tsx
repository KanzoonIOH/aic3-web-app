import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// image is either a URL/blob (picture), an emoji string, or null/"" (initials).
const isUrl = (v: string) => /^(https?:|blob:|data:)/.test(v);

function initialsOf(name: string) {
    return (
        name
            .split(/[\s_-]+/)
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase() ?? "")
            .join("") || "?"
    );
}

export function UserAvatar({
    image,
    name,
    size,
    className,
}: {
    image?: string | null;
    name: string;
    size?: "default" | "sm" | "lg";
    className?: string;
}) {
    const emoji = image && !isUrl(image) ? image : null;
    return (
        <Avatar size={size} className={className}>
            {image && isUrl(image) && (
                <AvatarImage src={image} alt={name} />
            )}
            <AvatarFallback className={cn(emoji && "text-base")}>
                {emoji ?? initialsOf(name)}
            </AvatarFallback>
        </Avatar>
    );
}
