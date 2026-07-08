import { createFileRoute } from "@tanstack/react-router";
import { RouteComponent } from "./index";

export const Route = createFileRoute("/(main)/agents/orchestrator")({
    component: RouteComponent,
});
