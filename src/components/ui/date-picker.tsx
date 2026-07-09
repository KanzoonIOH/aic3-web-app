import { CalendarIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
    value?: Date;
    onChange: (date: Date | undefined) => void;
    placeholder?: string;
    /** Disable dates before this day (matches native input `min`). */
    fromDate?: Date;
    id?: string;
    className?: string;
    "aria-invalid"?: boolean;
}

// Popover + Calendar date field. Closes on select.
export function DatePicker({
    value,
    onChange,
    placeholder = "Pick a date",
    fromDate,
    id,
    className,
    "aria-invalid": ariaInvalid,
}: DatePickerProps) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    type="button"
                    variant="outline"
                    aria-invalid={ariaInvalid}
                    className={cn(
                        "w-full justify-start font-normal",
                        !value && "text-muted-foreground",
                        className,
                    )}
                >
                    <CalendarIcon className="size-4" />
                    {value
                        ? value.toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                          })
                        : placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={(date) => {
                        onChange(date);
                        setOpen(false);
                    }}
                    disabled={fromDate ? { before: fromDate } : undefined}
                    autoFocus
                />
            </PopoverContent>
        </Popover>
    );
}
