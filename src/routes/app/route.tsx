import { getConversations } from "@/api/conversations";
import { PinButton, usePinnedSet } from "@/components/pin-button";
import { SidebarLogo, UserMenu } from "@/components/sidebar-shell";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { hasSession, useAuthStore } from "@/stores/auth";
import { useQuery } from "@tanstack/react-query";
import {
    createFileRoute,
    Link,
    Outlet,
    redirect,
    useParams,
    useSearch,
} from "@tanstack/react-router";
import { ChevronDown, LayoutGridIcon } from "lucide-react";
import { useState } from "react";
import { ChatableAvatar, useChatables, type Chatable } from "./-chatables";

export const Route = createFileRoute("/app")({
    beforeLoad: () => {
        if (!hasSession()) {
            throw redirect({ to: "/login" });
        }
    },
    component: RouteComponent,
});

// How many unpinned agents are visible before "Show all".
const COLLAPSED_AGENTS = 3;

const rowClass =
    "relative flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors overflow-clip";

const activeClass = "bg-sidebar-accent !text-sidebar-foreground font-medium";

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="px-2 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wide text-sidebar-foreground/40">
            {children}
        </p>
    );
}

// One agent/orchestrator row: click to start a new chat, hover to pin.
function AgentRow({ item, active }: { item: Chatable; active: boolean }) {
    return (
        <div className="group relative">
            <Link
                to="/app/chat"
                search={{ agent: item.id }}
                className={cn(rowClass, "pr-8", active && activeClass)}
                title={item.name}
            >
                <ChatableAvatar item={item} className="size-5" />
                <span className="truncate">{item.name}</span>
            </Link>
            <PinButton
                entityType={item.isOrchestrator ? "orchestrator" : "agent"}
                entityId={item.id}
                className="absolute right-1 top-1/2 -translate-y-1/2 size-6 opacity-0 transition-opacity group-hover:opacity-100 aria-pressed:opacity-100"
            />
        </div>
    );
}

function RouteComponent() {
    const role = useAuthStore((s) => s.user?.role);
    // Only non-viewers can hop back to the console.
    const canSwitch = role !== undefined && role !== "VIEWER";

    // Which chat is open: /app/chat/$id (history) or /app/chat?agent=... (new).
    const params = useParams({ strict: false }) as { id?: string };
    const search = useSearch({ strict: false }) as { agent?: string };
    const [showAllAgents, setShowAllAgents] = useState(false);

    const { all: chatables } = useChatables();
    const { isPinned } = usePinnedSet();

    const { data: conversationsData } = useQuery({
        queryKey: ["conversations", "mine"],
        queryFn: () => getConversations({ limit: 100, mine: true }),
    });
    const conversations = conversationsData?.data ?? [];

    // "Most used" is derived from the history we already fetched — no extra
    // endpoint. ponytail: only the last 100 conversations count toward the
    // ranking; move it to a SQL group-by if that window ever feels wrong.
    const useCount = new Map<string, number>();
    for (const c of conversations) {
        useCount.set(c.agent_id, (useCount.get(c.agent_id) ?? 0) + 1);
    }

    const pinnedAgents = chatables.filter((a) =>
        isPinned(a.isOrchestrator ? "orchestrator" : "agent", a.id),
    );
    const otherAgents = chatables
        .filter((a) => !pinnedAgents.includes(a))
        .sort(
            (a, b) =>
                (useCount.get(b.id) ?? 0) - (useCount.get(a.id) ?? 0) ||
                a.name.localeCompare(b.name),
        );
    const visibleOthers = showAllAgents
        ? otherAgents
        : otherAgents.slice(0, COLLAPSED_AGENTS);

    const isActiveAgent = (id: string) => !params.id && search.agent === id;

    return (
        <div className="h-dvh w-full grid grid-cols-[240px_1fr]">
            <aside className="flex flex-col overflow-hidden border-r bg-sidebar">
                <div className="flex shrink-0 justify-center items-center p-3">
                    <SidebarLogo />
                </div>

                <div className="shrink-0 px-2">
                    <Link
                        to="/app"
                        activeOptions={{ exact: true }}
                        className={rowClass}
                        activeProps={{ className: activeClass }}
                    >
                        <LayoutGridIcon className="size-4 shrink-0" />
                        Home
                    </Link>
                </div>

                {/* Agents — capped at half the sidebar, scrolls on its own. */}
                <div className="flex max-h-1/2 shrink-0 flex-col overflow-hidden px-2">
                    <SectionLabel>Agents</SectionLabel>
                    <div className="flex flex-col gap-0.5 overflow-y-auto">
                        {chatables.length === 0 ? (
                            <p className="px-2 py-1 text-xs text-sidebar-foreground/40">
                                No active agents.
                            </p>
                        ) : (
                            <>
                                {pinnedAgents.map((item) => (
                                    <AgentRow
                                        key={item.id}
                                        item={item}
                                        active={isActiveAgent(item.id)}
                                    />
                                ))}
                                {visibleOthers.map((item) => (
                                    <AgentRow
                                        key={item.id}
                                        item={item}
                                        active={isActiveAgent(item.id)}
                                    />
                                ))}
                            </>
                        )}
                    </div>
                    {otherAgents.length > COLLAPSED_AGENTS && (
                        <button
                            type="button"
                            onClick={() => setShowAllAgents((v) => !v)}
                            className="flex shrink-0 items-center gap-1 px-2 py-1 text-[11px] text-sidebar-foreground/50 hover:text-sidebar-foreground"
                        >
                            <ChevronDown
                                className={cn(
                                    "size-3 transition-transform",
                                    showAllAgents && "rotate-180",
                                )}
                            />
                            {showAllAgents
                                ? "Show less"
                                : `Show all (${otherAgents.length})`}
                        </button>
                    )}
                </div>

                {/* History — takes whatever is left, scrolls independently. */}
                <div className="flex min-h-0 flex-1 flex-col px-2">
                    <SectionLabel>History</SectionLabel>
                    <div className="flex flex-col gap-0.5 overflow-y-auto pb-2">
                        {conversations.length === 0 ? (
                            <p className="px-2 py-1 text-xs text-sidebar-foreground/40">
                                No conversations yet.
                            </p>
                        ) : (
                            conversations.map((c) => (
                                <Link
                                    key={c.id}
                                    to="/app/chat/$id"
                                    params={{ id: c.id }}
                                    className={rowClass}
                                    activeProps={{ className: activeClass }}
                                    title={c.last_message ?? c.agent_name}
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate">
                                            {c.agent_name}
                                        </span>
                                        <span className="block truncate text-[11px] text-sidebar-foreground/40">
                                            {c.last_message ?? "No messages"}
                                        </span>
                                    </span>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                <Separator />
                <div className="shrink-0 p-2">
                    <UserMenu
                        currentLabel="User view"
                        switchTo={
                            canSwitch
                                ? {
                                      label: "Switch to Admin",
                                      to: "/admin/dashboard",
                                  }
                                : undefined
                        }
                    />
                </div>
            </aside>

            <Outlet />
        </div>
    );
}
