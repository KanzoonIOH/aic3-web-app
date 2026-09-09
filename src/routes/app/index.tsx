import { useAuthStore } from "@/stores/auth";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/")({
    component: RouteComponent,
});

function RouteComponent() {
    const username = useAuthStore((s) => s.user?.username);

    return (
        <div className="flex flex-col gap-6 p-8 overflow-y-auto">
            <div className="space-y-1">
                <h1 className="font-heading text-2xl font-semibold">
                    Welcome back{username ? `, ${username}` : ""}
                </h1>
                <p className="text-sm text-muted-foreground">
                    Pick an agent in the sidebar to start chatting, or continue
                    a past conversation.
                </p>
            </div>
        </div>
    );
}
