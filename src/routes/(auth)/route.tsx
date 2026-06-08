import { getToken } from "@/stores/auth";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)")({
    beforeLoad: () => {
        const token = getToken();
        if (token) {
            throw redirect({ to: "/dashboard2" });
        }
    },
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div className="grid grid-cols-2 h-dvh w-screen">
            <div className="bg-primary" />
            <div className="flex flex-1 items-center justify-center">
                <div className="w-full max-w-xs">
                    <div className="flex flex-col gap-6">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
}
