import logoDark from "@/assets/logo_ioh_dark.svg";
import logoLight from "@/assets/logo_ioh_light.svg";
import {
    ShortcutsDialog,
    useKeyboardShortcuts,
} from "@/components/keyboard-shortcuts";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { logout } from "@/api/auth";
import { hasSession, useAuthStore } from "@/stores/auth";
import { useThemeStore, type Theme } from "@/stores/theme";
import {
    createFileRoute,
    Link,
    Outlet,
    redirect,
    useRouter,
} from "@tanstack/react-router";
import {
    BookOpen,
    Bot,
    ChevronDown,
    ChevronsUpDownIcon,
    Clock,
    History,
    Keyboard,
    KeyRound,
    LayoutDashboardIcon,
    LogOut,
    MessagesSquare,
    Monitor,
    Moon,
    Plug,
    ScrollText,
    Settings,
    Sun,
    Tag,
    Users,
} from "lucide-react";
import { useCallback, useState } from "react";
import { SettingsDialog } from "./-SettingsDialog";

export const Route = createFileRoute("/(main)")({
    beforeLoad: () => {
        if (!hasSession()) {
            throw redirect({ to: "/login" });
        }
    },
    component: RouteComponent,
});

const navGroups = [
    {
        label: "Workspace",
        items: [
            { to: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
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

const themeOptions: { value: Theme; label: string; icon: React.ElementType }[] =
    [
        { value: "light", label: "Light", icon: Sun },
        { value: "dark", label: "Dark", icon: Moon },
        { value: "system", label: "System", icon: Monitor },
    ];

function ThemeToggle() {
    const theme = useThemeStore((s) => s.theme);
    const setTheme = useThemeStore((s) => s.setTheme);

    return (
        <div className="flex gap-1 p-1">
            {themeOptions.map(({ value, label, icon: Icon }) => (
                <button
                    key={value}
                    onClick={() => setTheme(value)}
                    title={label}
                    className={cn(
                        "flex flex-1 flex-col items-center gap-1 rounded-md px-2 py-1.5 text-xs transition-colors",
                        theme === value
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent text-muted-foreground hover:text-accent-foreground",
                    )}
                >
                    <Icon className="size-3.5" />
                    {label}
                </button>
            ))}
        </div>
    );
}

function UserSection({
    onShowShortcuts,
}: {
    onShowShortcuts: () => void;
}) {
    const user = useAuthStore((s) => s.user);
    const clearAuth = useAuthStore((s) => s.clearAuth);
    const router = useRouter();
    const [settingsOpen, setSettingsOpen] = useState(false);

    async function handleLogout() {
        await logout();
        clearAuth();
        router.navigate({ to: "/login" });
    }

    return (
        <>
            <Popover>
                <PopoverTrigger asChild>
                    <button className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-accent transition-colors">
                        <UserAvatar
                            image={user?.image}
                            name={user?.username ?? "?"}
                        />
                        <span className="truncate font-medium text-foreground">
                            {user?.username ?? "Account"}
                        </span>
                        <ChevronsUpDownIcon className="size-4 ml-auto text-foreground/50" />
                    </button>
                </PopoverTrigger>
                <PopoverContent
                    side="right"
                    align="end"
                    sideOffset={18}
                    className="w-56 p-0"
                >
                    <div className="flex items-center gap-3 px-3.5 py-1.5">
                        <div className="flex flex-col min-w-0">
                            <span className="truncate text-sm text-muted-foreground">
                                {user?.email}
                            </span>
                        </div>
                    </div>

                    <Separator />

                    <div className="p-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2 font-normal"
                            onClick={() => setSettingsOpen(true)}
                        >
                            <Settings className="size-4" />
                            Settings
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2 font-normal"
                            onClick={onShowShortcuts}
                        >
                            <Keyboard className="size-4" />
                            Keyboard shortcuts
                            <kbd className="ml-auto rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
                                ?
                            </kbd>
                        </Button>
                    </div>

                    <Separator />

                    <ThemeToggle />

                    <Separator />

                    <div className="p-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2 font-normal text-destructive hover:bg-destructive/5 hover:text-destructive"
                            onClick={handleLogout}
                        >
                            <LogOut className="size-4" />
                            Log out
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
            <SettingsDialog
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
            />
        </>
    );
}

function SidebarLogo() {
    const theme = useThemeStore((s) => s.theme);
    const isDark =
        theme === "dark" ||
        (theme === "system" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches);
    return (
        <img
            src={isDark ? logoDark : logoLight}
            alt="Logo"
            className="h-12 w-auto"
        />
    );
}

// Signed-up-but-unapproved users see this instead of the app. Access is
// granted once an admin promotes them out of the PENDING role.
function PendingGate() {
    const user = useAuthStore((s) => s.user);
    const clearAuth = useAuthStore((s) => s.clearAuth);
    const router = useRouter();

    async function handleLogout() {
        await logout();
        clearAuth();
        router.navigate({ to: "/login" });
    }

    return (
        <div className="flex h-dvh w-full items-center justify-center p-6">
            <div className="flex max-w-sm flex-col items-center gap-4 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                    <Clock className="size-7" />
                </div>
                <div className="space-y-1.5">
                    <h1 className="font-heading text-xl font-semibold">
                        Awaiting approval
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Your account
                        {user?.email ? ` (${user.email})` : ""} is pending
                        review. An administrator needs to grant you access
                        before you can use the console.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="size-4" />
                    Log out
                </Button>
            </div>
        </div>
    );
}

function RouteComponent() {
    const role = useAuthStore((s) => s.user?.role);
    const [agentsOpen, setAgentsOpen] = useState(true);
    const [shortcutsOpen, setShortcutsOpen] = useState(false);
    const showShortcuts = useCallback(() => setShortcutsOpen(true), []);
    useKeyboardShortcuts(showShortcuts);
    if (role === "PENDING") {
        return <PendingGate />;
    }

    return (
        <div className="h-dvh w-full grid grid-cols-[200px_1fr]">
            <aside className="flex flex-col border-r bg-sidebar">
                <div className="flex justify-center items-center p-3">
                    <SidebarLogo />
                </div>
                {/*<Separator />*/}
                <nav className="flex flex-col flex-1 gap-4 p-2 overflow-y-auto">
                    {navGroups.map((group) => (
                        <div
                            key={group.label}
                            className="flex flex-col gap-0.5"
                        >
                            <span className="px-2.5 pb-1 text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/40">
                                {group.label}
                            </span>
                            {group.items.map((item) => {
                                if ("children" in item) {
                                    const Icon = item.icon;
                                    return (
                                        <div key={item.label}>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setAgentsOpen((v) => !v)
                                                }
                                                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all"
                                            >
                                                <Icon className="size-4 shrink-0" />
                                                {item.label}
                                                <ChevronDown
                                                    className={cn(
                                                        "ml-auto size-4 transition-transform",
                                                        agentsOpen &&
                                                            "rotate-180",
                                                    )}
                                                />
                                            </button>
                                            {agentsOpen && (
                                                <div className="flex flex-col gap-0.5">
                                                    {item.children.map(
                                                        (child) => (
                                                            <Link
                                                                key={child.to}
                                                                to={child.to}
                                                                className={cn(
                                                                    "relative flex items-center rounded-md px-2.5 py-1.5 pl-7 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all overflow-clip",
                                                                    "before:absolute before:left-2.5 before:top-1/2 before:-translate-y-1/2 before:h-0 before:w-0.5 before:rounded-r-full before:bg-primary before:transition-all",
                                                                )}
                                                                activeProps={{
                                                                    className:
                                                                        "bg-sidebar-accent !text-sidebar-foreground font-medium before:h-4/6",
                                                                }}
                                                            >
                                                                {child.label}
                                                            </Link>
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.to}
                                        to={item.to}
                                        className={cn(
                                            "relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all overflow-clip",
                                            "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-0 before:w-0.5 before:rounded-r-full before:bg-primary before:transition-all",
                                        )}
                                        activeProps={{
                                            className:
                                                "bg-sidebar-accent !text-sidebar-foreground font-medium before:h-4/6",
                                        }}
                                    >
                                        <Icon className="size-4 shrink-0" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>
                <Separator />
                <div className="p-2">
                    <UserSection onShowShortcuts={showShortcuts} />
                </div>
            </aside>

            <Outlet />

            <ShortcutsDialog
                open={shortcutsOpen}
                onOpenChange={setShortcutsOpen}
            />
        </div>
    );
}
