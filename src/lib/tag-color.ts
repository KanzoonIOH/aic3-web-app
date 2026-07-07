import type { CSSProperties } from "react";

// Preset tag palette (matches the backend defaults). Enforced in the tag
// editor; custom picking stays available but presets are the primary choice.
export const TAG_COLORS = [
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#eab308",
    "#22c55e",
    "#14b8a6",
    "#06b6d4",
    "#3b82f6",
    "#6366f1",
    "#a855f7",
    "#ec4899",
    "#64748b",
] as const;

// A colored chip: faint tinted background, solid border + text in the tag color.
// Falls back to the muted theme tokens when a tag has no color yet.
export function tagChipStyle(color?: string): CSSProperties {
    // ponytail: assumes 6-digit #rrggbb (all our colors are). Switch to a
    // parse if arbitrary CSS colors ever become allowed.
    if (!color) return {};
    return {
        backgroundColor: `${color}1a`, // ~10% alpha
        borderColor: `${color}66`, // ~40% alpha
        color,
    };
}
