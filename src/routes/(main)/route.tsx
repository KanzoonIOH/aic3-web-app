import { getToken } from "@/stores/auth";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(main)")({
    beforeLoad: () => {
        const token = getToken();
        if (!token) {
            throw redirect({ to: "/login" });
        }
    },
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div>
            <Outlet />
        </div>
    );
}
