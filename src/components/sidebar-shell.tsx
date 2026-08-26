import logoDark from "@/assets/logo_ioh_dark.svg";
import logoLight from "@/assets/logo_ioh_light.svg";
import { SettingsDialog } from "@/components/settings-dialog";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { logout } from "@/api/auth";
import { useAuthStore } from "@/stores/auth";
import { useThemeStore, type Theme } from "@/stores/theme";
import { Link, useRouter, type LinkProps } from "@tanstack/react-router";
import {
    ChevronRight,
    ChevronsUpDownIcon,
    Keyboard,
    LogOut,
    Monitor,
    Moon,
    Repeat2,
    Settings,
    Sun,
} from "lucide-react";
import { useState } from "react";

export function SidebarLogo() {
    const theme = useThemeStore((s) => s.theme);
    const isDark =
        theme === "dark" ||
        (theme === "system" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches);
    return (
        <img
            src={isDark ? logoDark : logoLight}
            alt="Logo"
            className="h-12 w-auto"
        />
    );
}

const themeOptions: { value: Theme; label: string; icon: React.ElementType }[] =
    [
        { value: "light", label: "Light", icon: Sun },
        { value: "dark", label: "Dark", icon: Moon },
        { value: "system", label: "System", icon: Monitor },
    ];

function ThemeToggle() {
    const theme = useThemeStore((s) => s.theme);
    const setTheme = useThemeStore((s) => s.setTheme);

    return (
        <div className="flex gap-1 p-1">
            {themeOptions.map(({ value, label, icon: Icon }) => (
                <button
                    key={value}
                    onClick={() => setTheme(value)}
                    title={label}
                    className={cn(
                        "flex flex-1 flex-col items-center gap-1 rounded-md px-2 py-1.5 text-xs transition-colors",
                        theme === value
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent text-muted-foreground hover:text-accent-foreground",
                    )}
                >
                    <Icon className="size-3.5" />
                    {label}
                </button>
            ))}
        </div>
    );
}

// Bottom-of-sidebar account card. Shared by the admin console and the viewer
// app; `switchTo` is the other workspace (omit to hide the switcher).
export function UserMenu({
    onShowShortcuts,
    currentLabel,
    switchTo,
}: {
    onShowShortcuts?: () => void;
    currentLabel: string;
    switchTo?: { label: string; to: LinkProps["to"] };
}) {
    const user = useAuthStore((s) => s.user);
    const clearAuth = useAuthStore((s) => s.clearAuth);
    const router = useRouter();
    const [settingsOpen, setSettingsOpen] = useState(false);

    async function handleLogout() {
        await logout();
        clearAuth();
        router.navigate({ to: "/login" });
    }

    return (
        <>
            <Popover>
                <PopoverTrigger asChild>
                    <button className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-accent transition-colors">
                        <UserAvatar
                            image={user?.image}
                            name={user?.username ?? "?"}
                        />
                        <span className="truncate font-medium text-foreground">
                            {user?.username ?? "Account"}
                        </span>
                        <ChevronsUpDownIcon className="size-4 ml-auto text-foreground/50" />
                    </button>
                </PopoverTrigger>
                <PopoverContent
                    side="right"
                    align="end"
                    sideOffset={18}
                    className="w-56 p-0"
                >
                    <div className="flex items-center gap-3 px-3.5 py-1.5">
                        <span className="truncate text-sm text-muted-foreground">
                            {user?.email}
                        </span>
                    </div>

                    <Separator />

                    <div className="p-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2 font-normal"
                            onClick={() => setSettingsOpen(true)}
                        >
                            <Settings className="size-4" />
                            Settings
                        </Button>
                        {onShowShortcuts && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start gap-2 font-normal"
                                onClick={onShowShortcuts}
                            >
                                <Keyboard className="size-4" />
                                Keyboard shortcuts
                                <kbd className="ml-auto rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
                                    ?
                                </kbd>
                            </Button>
                        )}
                    </div>

                    {switchTo && (
                        <>
                            <Separator />
                            <div className="p-1">
                                <Link
                                    to={switchTo.to}
                                    className="group flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left hover:bg-accent transition-colors"
                                >
                                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground group-hover:text-foreground transition-colors">
                                        <Repeat2 className="size-4" />
                                    </span>
                                    <span className="flex min-w-0 flex-col">
                                        <span className="truncate text-sm font-medium">
                                            {switchTo.label}
                                        </span>
                                        <span className="truncate text-[11px] text-muted-foreground">
                                            Currently in {currentLabel}
                                        </span>
                                    </span>
                                    <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                                </Link>
                            </div>
                        </>
                    )}

                    <Separator />

                    <ThemeToggle />

                    <Separator />

                    <div className="p-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2 font-normal text-destructive hover:bg-destructive/5 hover:text-destructive"
                            onClick={handleLogout}
                        >
                            <LogOut className="size-4" />
                            Log out
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
            <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </>
    );
}
