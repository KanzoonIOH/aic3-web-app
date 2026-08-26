import {
    ShortcutsDialog,
    useKeyboardShortcuts,
} from "@/components/keyboard-shortcuts";
import { CommandPalette } from "@/components/command-palette";
import { SidebarLogo, UserMenu } from "@/components/sidebar-shell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { logout } from "@/api/auth";
import { hasSession, homeFor, useAuthStore } from "@/stores/auth";
import {
    createFileRoute,
    Link,
    Outlet,
    redirect,
    useRouter,
} from "@tanstack/react-router";
import { ChevronDown, Clock, LogOut } from "lucide-react";
import { useCallback, useState } from "react";
import { navGroups } from "./-nav";
import { PinnedSection } from "./-PinnedSection";

export const Route = createFileRoute("/admin")({
    beforeLoad: () => {
        if (!hasSession()) {
            throw redirect({ to: "/login" });
        }
        // Viewers have no console access; send them to their own app shell.
        const role = useAuthStore.getState().user?.role;
        if (role === "VIEWER") {
            throw redirect({ to: homeFor(role) });
        }
    },
    component: RouteComponent,
});

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
    const [paletteOpen, setPaletteOpen] = useState(false);
    const showShortcuts = useCallback(() => setShortcutsOpen(true), []);
    const openPalette = useCallback(() => setPaletteOpen(true), []);
    useKeyboardShortcuts(showShortcuts, openPalette);
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
                    <PinnedSection />
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
                    <UserMenu
                        onShowShortcuts={showShortcuts}
                        currentLabel="Admin view"
                        switchTo={{ label: "Switch to User", to: "/app" }}
                    />
                </div>
            </aside>

            <Outlet />

            <ShortcutsDialog
                open={shortcutsOpen}
                onOpenChange={setShortcutsOpen}
            />
            <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
        </div>
    );
}
