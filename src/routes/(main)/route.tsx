import logoDark from "@/assets/logo_ioh_dark.svg";
import logoLight from "@/assets/logo_ioh_light.svg";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getToken, useAuthStore } from "@/stores/auth";
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
    ChevronsUpDownIcon,
    KeyRound,
    LayoutDashboardIcon,
    LogOut,
    MessagesSquare,
    Monitor,
    Moon,
    Plug,
    ScrollText,
    Sun,
    Users,
} from "lucide-react";

export const Route = createFileRoute("/(main)")({
    beforeLoad: () => {
        const token = getToken();
        if (!token) {
            throw redirect({ to: "/login" });
        }
    },
    component: RouteComponent,
});

const navItems = [
    { to: "/dashboard2", label: "Dashboard", icon: LayoutDashboardIcon },
    // { to: "/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/agents", label: "Agents", icon: Bot },
    { to: "/chat", label: "Chat", icon: MessagesSquare },
    { to: "/knowledges", label: "Knowledges", icon: BookOpen },
    { to: "/mcps", label: "MCPs", icon: Plug },
    { to: "/logs", label: "Logs", icon: ScrollText },
    { to: "/members", label: "Members", icon: Users },
    { to: "/api-keys", label: "API Keys", icon: KeyRound },
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

function getInitials(username: string) {
    return username
        .split(/[\s_-]+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");
}

function UserSection() {
    const user = useAuthStore((s) => s.user);
    const clearAuth = useAuthStore((s) => s.clearAuth);
    const router = useRouter();

    function handleLogout() {
        clearAuth();
        router.navigate({ to: "/login" });
    }

    const initials = user ? getInitials(user.username) : "?";

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-accent transition-colors">
                    <Avatar>
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
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

function RouteComponent() {
    return (
        <div className="h-dvh w-full grid grid-cols-[200px_1fr]">
            <aside className="flex flex-col border-r bg-sidebar">
                <div className="flex justify-center items-center p-3">
                    <SidebarLogo />
                </div>
                <Separator />
                <nav className="flex flex-col flex-1 gap-0.5 p-2 overflow-y-auto">
                    {navItems.map(({ to, label, icon: Icon }) => (
                        <Link
                            key={to}
                            to={to}
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
                            {label}
                        </Link>
                    ))}
                </nav>
                <Separator />
                <div className="p-2">
                    <UserSection />
                </div>
            </aside>

            <Outlet />
        </div>
    );
}
