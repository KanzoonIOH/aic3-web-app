import { UnderConstruction } from "@/components/under-construction";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(main)/members")({
    component: RouteComponent,
});

function RouteComponent() {
    return <UnderConstruction />;
}
