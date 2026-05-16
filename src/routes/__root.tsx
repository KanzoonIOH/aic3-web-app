import { ThemeProvider } from "@/components/theme-provider";
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
    component: () => (
        <ThemeProvider>
            <Outlet />
        </ThemeProvider>
    ),
});
