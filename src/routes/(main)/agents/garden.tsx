import { createFileRoute } from "@tanstack/react-router";
import { RouteComponent } from "./index";

export const Route = createFileRoute("/(main)/agents/garden")({
    component: RouteComponent,
});
