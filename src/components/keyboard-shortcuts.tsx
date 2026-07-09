import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

// Single source of truth for both the global handler and the help dialog.
// Navigation shortcuts are GitHub-style sequences: press `g` then the key.
// `keys` is what we display; `seq` (if present) is the second key of a `g …`.
export interface Shortcut {
    keys: string[]; // rendered as <kbd> chips, in order
    label: string;
    seq?: string; // second key after `g` for navigation
    to?: string; // route to navigate to
    action?: "help"; // non-navigation actions handled inline
}

export interface ShortcutGroup {
    title: string;
    shortcuts: Shortcut[];
}

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
    {
        title: "Navigation",
        shortcuts: [
            { keys: ["g", "d"], seq: "d", to: "/dashboard", label: "Go to Dashboard" },
            { keys: ["g", "c"], seq: "c", to: "/chat", label: "Go to Chat" },
            { keys: ["g", "k"], seq: "k", to: "/knowledges", label: "Go to Knowledges" },
            { keys: ["g", "m"], seq: "m", to: "/mcps", label: "Go to MCPs" },
            { keys: ["g", "t"], seq: "t", to: "/tags", label: "Go to Tags" },
            { keys: ["g", "l"], seq: "l", to: "/logs", label: "Go to Message Log" },
            { keys: ["g", "a"], seq: "a", to: "/audit-logs", label: "Go to Audit Log" },
            { keys: ["g", "u"], seq: "u", to: "/members", label: "Go to Members" },
            { keys: ["g", "e"], seq: "e", to: "/api-keys", label: "Go to API Keys" },
            { keys: ["g", "s"], seq: "s", to: "/global-config", label: "Go to Global Config" },
        ],
    },
    {
        title: "General",
        shortcuts: [{ keys: ["?"], action: "help", label: "Show this help" }],
    },
];

const NAV_SHORTCUTS = SHORTCUT_GROUPS.flatMap((g) => g.shortcuts).filter(
    (s): s is Shortcut & { seq: string; to: string } =>
        Boolean(s.seq && s.to),
);

// Don't hijack keys while the user is typing.
function isTypingTarget(el: EventTarget | null): boolean {
    if (!(el instanceof HTMLElement)) return false;
    const tag = el.tagName;
    return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        el.isContentEditable
    );
}

// Global key handler: `?` opens help, `g` then a nav key routes. The `g`
// prefix is armed for 1.2s, matching common editor/GitHub muscle memory.
export function useKeyboardShortcuts(onShowHelp: () => void) {
    const router = useRouter();

    useEffect(() => {
        let awaitingSeq = false;
        let timer: ReturnType<typeof setTimeout> | undefined;

        function disarm() {
            awaitingSeq = false;
            if (timer) clearTimeout(timer);
        }

        function onKeyDown(e: KeyboardEvent) {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            if (isTypingTarget(e.target)) return;

            if (awaitingSeq) {
                const match = NAV_SHORTCUTS.find((s) => s.seq === e.key);
                disarm();
                if (match) {
                    e.preventDefault();
                    router.navigate({ to: match.to });
                }
                return;
            }

            if (e.key === "?") {
                e.preventDefault();
                onShowHelp();
                return;
            }

            if (e.key === "g") {
                awaitingSeq = true;
                timer = setTimeout(disarm, 1200);
            }
        }

        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            disarm();
        };
    }, [router, onShowHelp]);
}

function Kbd({ children }: { children: React.ReactNode }) {
    return (
        <kbd className="inline-flex min-w-6 items-center justify-center rounded-md border border-b-2 bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
            {children}
        </kbd>
    );
}

export function ShortcutsDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Keyboard shortcuts</DialogTitle>
                    <DialogDescription>
                        Press{" "}
                        <span className="font-mono font-medium">g</span> then a
                        key to jump between pages. Press{" "}
                        <span className="font-mono font-medium">?</span> anytime
                        to open this list.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-5">
                    {SHORTCUT_GROUPS.map((group) => (
                        <div key={group.title} className="flex flex-col gap-1">
                            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                                {group.title}
                            </p>
                            <div className="flex flex-col divide-y rounded-lg border">
                                {group.shortcuts.map((s) => (
                                    <div
                                        key={s.label}
                                        className="flex items-center justify-between gap-4 px-3 py-2"
                                    >
                                        <span className="text-sm">
                                            {s.label}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            {s.keys.map((k, i) => (
                                                <Kbd key={i}>{k}</Kbd>
                                            ))}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
