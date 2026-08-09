import { getPins, type PinEntityType } from "@/api/pins";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
    Bot,
    LayoutDashboard,
    MessagesSquare,
    Network,
    Pin,
} from "lucide-react";

// Per-type icon for a pinned item, so a mixed list still reads at a glance.
const ENTITY_ICON: Record<PinEntityType, React.ElementType> = {
    dashboard: LayoutDashboard,
    agent: Bot,
    orchestrator: Network,
    chat: MessagesSquare,
};

// PinnedSection renders the user's pinned entities as a sidebar group at the
// very top. It's hidden entirely when nothing is pinned, so it never adds noise
// for users who don't use pins. Routes come pre-resolved from the backend.
export function PinnedSection() {
    const { data } = useQuery({
        queryKey: ["pins"],
        queryFn: getPins,
    });

    const pins = data?.data ?? [];
    if (pins.length === 0) return null;

    return (
        <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1 px-2.5 pb-1 text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/40">
                <Pin className="size-2.5" />
                Pinned
            </span>
            {pins.map((pin) => {
                const Icon = ENTITY_ICON[pin.entity_type] ?? Pin;
                return (
                    <Link
                        key={pin.id}
                        to={pin.route as string}
                        className={cn(
                            "relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all overflow-clip",
                            "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-0 before:w-0.5 before:rounded-r-full before:bg-primary before:transition-all",
                        )}
                        activeProps={{
                            className:
                                "bg-sidebar-accent !text-sidebar-foreground font-medium before:h-4/6",
                        }}
                        title={pin.label}
                    >
                        <Icon className="size-4 shrink-0" />
                        <span className="truncate">{pin.label}</span>
                    </Link>
                );
            })}
        </div>
    );
}
