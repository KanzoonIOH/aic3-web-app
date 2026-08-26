import { BookOpen, LayoutGridIcon, MessagesSquare } from "lucide-react";

// Viewer-side nav. Read-only surfaces only — no resource management, no admin.
export const navItems = [
    { to: "/app", label: "Home", icon: LayoutGridIcon },
    { to: "/app/chat", label: "Chat", icon: MessagesSquare },
    { to: "/app/knowledges", label: "Knowledges", icon: BookOpen },
] as const;
