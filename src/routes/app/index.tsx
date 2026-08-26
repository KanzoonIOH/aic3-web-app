import { useAuthStore } from "@/stores/auth";
import { createFileRoute, Link } from "@tanstack/react-router";
import { navItems } from "./-nav";

export const Route = createFileRoute("/app/")({
    component: RouteComponent,
});

function RouteComponent() {
    const username = useAuthStore((s) => s.user?.username);

    return (
        <div className="flex flex-col gap-6 p-8 overflow-y-auto">
            <div className="space-y-1">
                <h1 className="font-heading text-2xl font-semibold">
                    Welcome back{username ? `, ${username}` : ""}
                </h1>
                <p className="text-sm text-muted-foreground">
                    Pick up where you left off.
                </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 max-w-2xl">
                {navItems
                    .filter((i) => i.to !== "/app")
                    .map(({ to, label, icon: Icon }) => (
                        <Link
                            key={to}
                            to={to}
                            className="group flex items-center gap-3 rounded-lg border p-4 hover:bg-accent transition-colors"
                        >
                            <span className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:text-foreground transition-colors">
                                <Icon className="size-4" />
                            </span>
                            <span className="text-sm font-medium">{label}</span>
                        </Link>
                    ))}
            </div>
        </div>
    );
}
