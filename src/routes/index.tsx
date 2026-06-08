import { getToken } from "@/stores/auth";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
    beforeLoad: () => {
        const token = getToken();
        if (token) {
            throw redirect({ to: "/dashboard2" });
        }
        throw redirect({ to: "/login" });
    },
});
