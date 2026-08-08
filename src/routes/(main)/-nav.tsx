import {
    BookOpen,
    Bot,
    History,
    KeyRound,
    LayoutDashboardIcon,
    LayoutGridIcon,
    MessagesSquare,
    Plug,
    ScrollText,
    Settings,
    Tag,
    Users,
} from "lucide-react";

// Single source of truth for the sidebar nav and the command palette. Lives in
// its own module so the palette can import it without a route.tsx import cycle.
export const navGroups = [
    {
        label: "Workspace",
        items: [
            { to: "/dashboard", label: "Analytics", icon: LayoutDashboardIcon },
            { to: "/dashboards", label: "Dashboards", icon: LayoutGridIcon },
            { to: "/chat", label: "Chat", icon: MessagesSquare },
        ],
    },
    {
        label: "Resources",
        items: [
            {
                label: "Agents",
                icon: Bot,
                children: [
                    { to: "/agents/orchestrator", label: "Agent Orchestrator" },
                    { to: "/agents/garden", label: "Agent Garden" },
                ],
            },
            { to: "/knowledges", label: "Knowledges", icon: BookOpen },
            { to: "/mcps", label: "MCPs", icon: Plug },
            { to: "/tags", label: "Tags", icon: Tag },
        ],
    },
    {
        label: "Operations",
        items: [
            { to: "/logs", label: "Message Log", icon: ScrollText },
            { to: "/audit-logs", label: "Audit Log", icon: History },
        ],
    },
    {
        label: "Administration",
        items: [
            { to: "/members", label: "Members", icon: Users },
            { to: "/api-keys", label: "API Keys", icon: KeyRound },
            { to: "/global-config", label: "Global Config", icon: Settings },
        ],
    },
] as const;
