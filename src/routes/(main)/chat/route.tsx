import { getConversations } from "@/api/conversations";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
    createFileRoute,
    Link,
    Outlet,
    useParams,
} from "@tanstack/react-router";
import { MessagesSquare, Plus } from "lucide-react";

export const Route = createFileRoute("/(main)/chat")({
    component: ChatLayout,
});

function relativeTime(iso: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
}

function ChatLayout() {
    // Current conversation id, if we're on /chat/$id (undefined on /chat).
    const params = useParams({ strict: false }) as { id?: string };
    const activeId = params.id;

    const { data, isPending } = useQuery({
        queryKey: ["conversations"],
        queryFn: () => getConversations({ limit: 100 }),
    });

    const conversations = data?.data ?? [];

    return (
        <div className="flex h-full overflow-hidden">
            {/* Conversation list */}
            <aside className="flex w-72 shrink-0 flex-col border-r bg-background">
                <div className="shrink-0 border-b p-3">
                    <Link
                        to="/chat"
                        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        <Plus className="size-4" />
                        New chat
                    </Link>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {isPending ? (
                        <p className="p-2 text-sm text-muted-foreground">
                            Loading...
                        </p>
                    ) : conversations.length === 0 ? (
                        <p className="p-2 text-sm text-muted-foreground">
                            No conversations yet.
                        </p>
                    ) : (
                        <ul className="space-y-1">
                            {conversations.map((c) => (
                                <li key={c.id}>
                                    <Link
                                        to="/chat/$id"
                                        params={{ id: c.id }}
                                        className={cn(
                                            "block rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted",
                                            activeId === c.id && "bg-muted",
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="truncate font-medium">
                                                {c.agent_name}
                                            </span>
                                            <span className="shrink-0 text-xs text-muted-foreground">
                                                {relativeTime(
                                                    c.last_message_at ??
                                                        c.started_at,
                                                )}
                                            </span>
                                        </div>
                                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                            {c.last_message ?? "No messages"}
                                        </p>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="shrink-0 border-t p-3 text-xs text-muted-foreground">
                    <MessagesSquare className="mr-1 inline size-3.5" />
                    Chat sessions
                </div>
            </aside>

            {/* Active conversation / new chat */}
            <div className="min-w-0 flex-1 overflow-hidden">
                <Outlet />
            </div>
        </div>
    );
}
