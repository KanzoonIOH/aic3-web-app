import { SidebarLogo, UserMenu } from "@/components/sidebar-shell";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { hasSession, useAuthStore } from "@/stores/auth";
import {
    createFileRoute,
    Link,
    Outlet,
    redirect,
} from "@tanstack/react-router";
import { navItems } from "./-nav";

export const Route = createFileRoute("/app")({
    beforeLoad: () => {
        if (!hasSession()) {
            throw redirect({ to: "/login" });
        }
    },
    component: RouteComponent,
});

function RouteComponent() {
    const role = useAuthStore((s) => s.user?.role);
    // Only non-viewers can hop back to the console.
    const canSwitch = role !== undefined && role !== "VIEWER";

    return (
        <div className="h-dvh w-full grid grid-cols-[200px_1fr]">
            <aside className="flex flex-col border-r bg-sidebar">
                <div className="flex justify-center items-center p-3">
                    <SidebarLogo />
                </div>
                <nav className="flex flex-col flex-1 gap-0.5 p-2 overflow-y-auto">
                    {navItems.map(({ to, label, icon: Icon }) => (
                        <Link
                            key={to}
                            to={to}
                            activeOptions={{ exact: to === "/app" }}
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
