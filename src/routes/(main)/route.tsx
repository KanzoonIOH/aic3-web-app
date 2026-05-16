import { getToken, useAuthStore } from "@/stores/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
    createFileRoute,
    Link,
    Outlet,
    redirect,
    useRouter,
} from "@tanstack/react-router";
import {
    BarChart3,
    Bot,
    BookOpen,
    HelpCircle,
    LayoutDashboard,
    LogOut,
    Plug,
    Settings,
    Users,
    ChevronsUpDownIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/agents", label: "Agents", icon: Bot },
    { to: "/knowledges", label: "Knowledges", icon: BookOpen },
    { to: "/mcps", label: "MCPs", icon: Plug },
    { to: "/members", label: "Members", icon: Users },
] as const;

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
                    {/*<Avatar size="sm">
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>*/}
                    <div className="flex flex-col min-w-0">
                        {/*<span className="truncate text-sm font-medium">
                            {user?.username}
                        </span>*/}
                        <span className="truncate text-sm text-muted-foreground">
                            {user?.email}
                        </span>
                    </div>
                </div>

                <Separator />

                <div className="flex flex-col gap-0.5 p-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 font-normal"
                    >
                        <Settings className="size-4" />
                        Account settings
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 font-normal"
                    >
                        <HelpCircle className="size-4" />
                        Help
                    </Button>
                </div>

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

function RouteComponent() {
    return (
        <div className="h-dvh w-full grid grid-cols-[200px_1fr]">
            <aside className="flex flex-col border-r bg-sidebar">
                <div className="flex-cc p-3">
                    <span className="font-heading font-semibold">
                        AIAConsole
                    </span>
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
