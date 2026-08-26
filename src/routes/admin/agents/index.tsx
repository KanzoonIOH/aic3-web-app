import { createFileRoute, redirect } from "@tanstack/react-router";

// Bare /agents has no page of its own — Agent Garden is the default landing.
export const Route = createFileRoute("/admin/agents/")({
    beforeLoad: () => {
        throw redirect({ to: "/admin/agents/garden" });
    },
});
