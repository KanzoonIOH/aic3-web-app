import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

// shadcn-style calendar built on react-day-picker v10.
function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-3", className)}
            classNames={{
                months: "relative flex flex-col sm:flex-row gap-2",
                month: "flex flex-col gap-4",
                month_caption: "flex h-7 items-center justify-center",
                caption_label: "text-sm font-medium",
                // Nav spans the header row; buttons sit at each end. Absolute so
                // they don't push the centered caption off-center.
                nav: "absolute inset-x-0 top-0 flex h-7 items-center justify-between px-1",
                button_previous: cn(
                    buttonVariants({ variant: "outline", size: "icon-sm" }),
                    "[&>svg]:pointer-events-none",
                ),
                button_next: cn(
                    buttonVariants({ variant: "outline", size: "icon-sm" }),
                    "[&>svg]:pointer-events-none",
                ),
                month_grid: "w-full border-collapse space-y-1",
                weekdays: "flex",
                weekday:
                    "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
                week: "flex w-full mt-2",
                day: "size-8 p-0 text-center text-sm",
                day_button: cn(
                    buttonVariants({ variant: "ghost", size: "icon-sm" }),
                    "size-8 p-0 font-normal aria-selected:opacity-100",
                ),
                selected:
                    "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary",
                today: "[&>button]:bg-accent [&>button]:text-accent-foreground",
                outside: "text-muted-foreground/50",
                disabled: "text-muted-foreground/40 opacity-50",
                hidden: "invisible",
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation }) =>
                    orientation === "left" ? (
                        <ChevronLeft className="pointer-events-none size-4" />
                    ) : (
                        <ChevronRight className="pointer-events-none size-4" />
                    ),
            }}
            {...props}
        />
    );
}

export { Calendar };
