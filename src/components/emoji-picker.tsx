import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { EmojiPicker as Frimousse } from "frimousse";
import { Search } from "lucide-react";
import { useState, type ReactNode } from "react";

// Click-to-open emoji picker (frimousse in a shadcn Popover), restyled to match
// the app's tokens. Selecting yields exactly one emoji character — no free text.
export function EmojiPickerPopover({
    trigger,
    onSelect,
}: {
    trigger: ReactNode;
    onSelect: (emoji: string) => void;
}) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
            <PopoverContent className="w-fit p-0" align="start" portal={false}>
                <Frimousse.Root
                    onEmojiSelect={({ emoji }) => {
                        onSelect(emoji);
                        setOpen(false);
                    }}
                    // Self-hosted emoji data (public/emojibase) so the picker
                    // works without reaching cdn.jsdelivr.net at runtime.
                    emojibaseUrl="/emojibase"
                    className="isolate flex h-[22rem] w-72 flex-col bg-popover"
                >
                    <div className="relative border-b p-2">
                        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Frimousse.Search
                            placeholder="Search emoji…"
                            className="h-9 w-full appearance-none rounded-md border border-input bg-transparent pr-2.5 pl-8 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        />
                    </div>

                    <Frimousse.Viewport className="relative flex-1 outline-none">
                        <Frimousse.Loading className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                            Loading…
                        </Frimousse.Loading>
                        <Frimousse.Empty className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                            No emoji found.
                        </Frimousse.Empty>
                        <Frimousse.List
                            className="select-none pb-1.5"
                            components={{
                                CategoryHeader: ({ category, ...props }) => (
                                    <div
                                        className="bg-popover/95 px-3 pt-3 pb-1 text-xs font-medium text-muted-foreground backdrop-blur-sm"
                                        {...props}
                                    >
                                        {category.label}
                                    </div>
                                ),
                                Row: ({ children, ...props }) => (
                                    <div
                                        className="scroll-my-1.5 px-1.5"
                                        {...props}
                                    >
                                        {children}
                                    </div>
                                ),
                                Emoji: ({ emoji, ...props }) => (
                                    <button
                                        type="button"
                                        className="flex size-8 items-center justify-center rounded-md text-[1.15rem] transition-colors data-[active]:bg-accent"
                                        {...props}
                                    >
                                        {emoji.emoji}
                                    </button>
                                ),
                            }}
                        />
                    </Frimousse.Viewport>

                    <div className="flex h-10 items-center gap-2 border-t px-2 text-sm">
                        <Frimousse.ActiveEmoji>
                            {({ emoji }) =>
                                emoji ? (
                                    <>
                                        <span className="flex size-7 items-center justify-center text-lg">
                                            {emoji.emoji}
                                        </span>
                                        <span className="truncate text-muted-foreground">
                                            {emoji.label}
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-muted-foreground">
                                        Pick an emoji…
                                    </span>
                                )
                            }
                        </Frimousse.ActiveEmoji>
                        <Frimousse.SkinToneSelector className="ml-auto flex size-7 items-center justify-center rounded-md text-lg hover:bg-accent" />
                    </div>
                </Frimousse.Root>
            </PopoverContent>
        </Popover>
    );
}
