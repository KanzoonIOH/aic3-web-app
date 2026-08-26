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
            { to: "/admin/dashboard", label: "Analytics", icon: LayoutDashboardIcon },
            { to: "/admin/dashboards", label: "Dashboards", icon: LayoutGridIcon },
            { to: "/admin/chat", label: "Chat", icon: MessagesSquare },
        ],
    },
    {
        label: "Resources",
        items: [
            {
                label: "Agents",
                icon: Bot,
                children: [
                    { to: "/admin/agents/orchestrator", label: "Agent Orchestrator" },
                    { to: "/admin/agents/garden", label: "Agent Garden" },
                ],
            },
            { to: "/admin/knowledges", label: "Knowledges", icon: BookOpen },
            { to: "/admin/mcps", label: "MCPs", icon: Plug },
            { to: "/admin/tags", label: "Tags", icon: Tag },
        ],
    },
    {
        label: "Operations",
        items: [
            { to: "/admin/logs", label: "Message Log", icon: ScrollText },
            { to: "/admin/audit-logs", label: "Audit Log", icon: History },
        ],
    },
    {
        label: "Administration",
        items: [
            { to: "/admin/members", label: "Members", icon: Users },
            { to: "/admin/api-keys", label: "API Keys", icon: KeyRound },
            { to: "/admin/global-config", label: "Global Config", icon: Settings },
        ],
    },
] as const;
