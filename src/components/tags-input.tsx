import { getTags } from "@/api/tags";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverAnchor,
    PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { tagChipStyle } from "@/lib/tag-color";
import { useQuery } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { useRef, useState } from "react";

// Searchable tag combobox. Value is a list of tag names (new names are created
// on save). Chips live inside the input; typing filters existing tags in a
// dropdown; ArrowUp/Down highlights, Enter adds the highlighted option (or
// creates a new tag from the typed text).
export function TagsInput({
    value,
    onChange,
    label = "Tags",
}: {
    value: string[];
    onChange: (tags: string[]) => void;
    label?: string;
}) {
    const [draft, setDraft] = useState("");
    const [open, setOpen] = useState(false);
    const [highlight, setHighlight] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { data } = useQuery({ queryKey: ["tags"], queryFn: getTags });
    const existing = data?.data ?? [];

    function colorFor(name: string): string | undefined {
        return existing.find((t) => t.name.toLowerCase() === name.toLowerCase())
            ?.color;
    }
    function add(raw: string) {
        const tag = raw.trim();
        if (!tag) return;
        if (!value.some((t) => t.toLowerCase() === tag.toLowerCase())) {
            onChange([...value, tag]);
        }
        setDraft("");
        setHighlight(0);
    }
    function remove(tag: string) {
        onChange(value.filter((t) => t !== tag));
    }

    // Existing tags matching the draft and not already selected.
    const q = draft.trim().toLowerCase();
    const matches = existing.filter(
        (t) =>
            !value.some((v) => v.toLowerCase() === t.name.toLowerCase()) &&
            (q === "" || t.name.toLowerCase().includes(q)),
    );
    // Offer "Create" when the typed name doesn't exactly match an existing tag
    // and isn't already selected.
    const exactExists =
        q !== "" &&
        existing.some((t) => t.name.toLowerCase() === q);
    const alreadySelected = value.some((v) => v.toLowerCase() === q);
    const canCreate = q !== "" && !exactExists && !alreadySelected;

    // Flat option list: matches first, then the optional create row.
    const options: (
        | { type: "existing"; name: string; color: string }
        | { type: "create"; name: string }
    )[] = [
        ...matches.map((t) => ({
            type: "existing" as const,
            name: t.name,
            color: t.color,
        })),
        ...(canCreate ? [{ type: "create" as const, name: draft.trim() }] : []),
    ];

    // Clamp highlight into range at render time (options shrink as you type),
    // so we never index past the list without a syncing effect.
    const activeIndex = Math.min(highlight, Math.max(0, options.length - 1));

    function choose(i: number) {
        const opt = options[i];
        if (opt) add(opt.name);
    }

    return (
        <div className="flex flex-col gap-2">
            <Label>{label}</Label>
            <Popover open={open && options.length > 0} onOpenChange={setOpen}>
                <PopoverAnchor asChild>
                    <div ref={containerRef}>
                        <div
                            className={cn(
                                "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5 text-sm shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
                            )}
                            onClick={() => inputRef.current?.focus()}
                        >
                            {value.map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                                    style={tagChipStyle(colorFor(tag))}
                                >
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            remove(tag);
                                        }}
                                        aria-label={`Remove ${tag}`}
                                        className="opacity-70 hover:opacity-100"
                                    >
                                        <X className="size-3" />
                                    </button>
                                </span>
                            ))}
                            <input
                                ref={inputRef}
                                value={draft}
                                onChange={(e) => {
                                    setDraft(e.target.value);
                                    setOpen(true);
                                    setHighlight(0);
                                }}
                                onFocus={() => setOpen(true)}
                                onKeyDown={(e) => {
                                    if (e.key === "ArrowDown") {
                                        e.preventDefault();
                                        setOpen(true);
                                        setHighlight((h) =>
                                            options.length
                                                ? (h + 1) % options.length
                                                : 0,
                                        );
                                    } else if (e.key === "ArrowUp") {
                                        e.preventDefault();
                                        setHighlight((h) =>
                                            options.length
                                                ? (h - 1 + options.length) %
                                                  options.length
                                                : 0,
                                        );
                                    } else if (e.key === "Enter") {
                                        e.preventDefault();
                                        if (options.length) choose(activeIndex);
                                        else add(draft);
                                    } else if (
                                        e.key === "Backspace" &&
                                        draft === "" &&
                                        value.length > 0
                                    ) {
                                        remove(value[value.length - 1]);
                                    } else if (e.key === "Escape") {
                                        setOpen(false);
                                    }
                                }}
                                placeholder={
                                    value.length === 0
                                        ? "Search or create a tag..."
                                        : ""
                                }
                                className="min-w-24 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>
                </PopoverAnchor>
                <PopoverContent
                    portal={false}
                    align="start"
                    sideOffset={4}
                    className="w-(--radix-popover-anchor-width) max-h-56 overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    onInteractOutside={(e) => {
                        if (
                            containerRef.current?.contains(
                                e.target as Node,
                            )
                        ) {
                            e.preventDefault();
                        }
                    }}
                >
                    <ul>
                        {options.map((opt, i) => (
                            <li key={`${opt.type}-${opt.name}`}>
                                <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        choose(i);
                                    }}
                                    onMouseEnter={() => setHighlight(i)}
                                    className={cn(
                                        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm",
                                        i === activeIndex
                                            ? "bg-accent text-accent-foreground"
                                            : "hover:bg-accent/50",
                                    )}
                                >
                                    {opt.type === "existing" ? (
                                        <>
                                            <span
                                                className="size-3 shrink-0 rounded-full border"
                                                style={{
                                                    backgroundColor: opt.color,
                                                }}
                                            />
                                            <span className="truncate">
                                                {opt.name}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="size-3.5 shrink-0 text-muted-foreground" />
                                            <span className="truncate">
                                                Create "{opt.name}"
                                            </span>
                                        </>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </PopoverContent>
            </Popover>
        </div>
    );
}
