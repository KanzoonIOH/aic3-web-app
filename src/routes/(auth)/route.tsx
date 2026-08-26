import { Card } from "@/components/ui/card";
import { hasSession, homeForCurrentUser } from "@/stores/auth";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)")({
    beforeLoad: () => {
        if (hasSession()) {
            throw redirect({ to: homeForCurrentUser() });
        }
    },
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div className="flex min-h-dvh w-full items-center justify-center bg-muted/30 p-6">
            <Card className="w-full max-w-sm p-8">
                <div className="flex flex-col gap-6">
                    <Outlet />
                </div>
            </Card>
        </div>
    );
}
