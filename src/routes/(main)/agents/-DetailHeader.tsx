import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import type { ReactNode } from "react";

// Shared detail-page header: avatar + name + active badge + edit trigger.
// Used by both the Agent Garden and Agent Orchestrator detail pages.
export function DetailHeader({
    name,
    description,
    image,
    isActive,
    editTrigger,
    pin,
}: {
    name: string;
    description?: string | null;
    image?: string | null;
    isActive: boolean;
    editTrigger?: ReactNode;
    pin?: ReactNode;
}) {
    return (
        <div className="flex items-start gap-4 px-6 py-4 bg-background border-b shrink-0">
            <UserAvatar image={image} name={name} size="lg" />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <h1 className="font-heading text-2xl font-semibold">{name}</h1>
                    <Badge variant={isActive ? "outline" : "secondary"}>
                        {isActive && (
                            <span className="relative flex size-2">
                                <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-75" />
                                <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                            </span>
                        )}
                        {isActive ? "Active" : "Inactive"}
                    </Badge>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    {description}
                </p>
            </div>
            {pin}
            {editTrigger}
        </div>
    );
}
