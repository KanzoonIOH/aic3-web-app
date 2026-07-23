import { hasSession } from "@/stores/auth";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
    beforeLoad: () => {
        if (hasSession()) {
            throw redirect({ to: "/dashboard" });
        }
        throw redirect({ to: "/login" });
    },
});
