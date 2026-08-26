import { hasSession, homeForCurrentUser } from "@/stores/auth";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
    beforeLoad: () => {
        if (hasSession()) {
            throw redirect({ to: homeForCurrentUser() });
        }
        throw redirect({ to: "/login" });
    },
});
