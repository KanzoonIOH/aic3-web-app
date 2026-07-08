import { useEffect, useState } from "react";
import { ArrowDownUp, Filter, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

export type Option = { label: string; value: string };

// A single-select dropdown backed by a fixed option list. `value=""` = "all"/unset.
export interface ListSelect {
    label: string;
    value: string;
    options: Option[];
    onChange: (value: string) => void;
    allLabel?: string; // label for the "no filter" choice; omit to make it required
}

export interface ListToolbarProps {
    search: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;
    sort?: ListSelect; // rendered with a sort icon
    filters?: ListSelect[]; // rendered with a filter icon
    action?: React.ReactNode; // e.g. a create button, right-aligned
}

// Debounced search input + sort/filter dropdown menus. Shared by every list
// page so each page only owns its state + query, not the controls.
export function ListToolbar({
    search,
    onSearchChange,
    searchPlaceholder = "Search...",
    sort,
    filters = [],
    action,
}: ListToolbarProps) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <DebouncedSearch
                value={search}
                onChange={onSearchChange}
                placeholder={searchPlaceholder}
            />
            {filters.map((f) => (
                <SelectMenu key={f.label} icon={<Filter className="size-3.5" />} select={f} />
            ))}
            {sort ? <SelectMenu icon={<ArrowDownUp className="size-3.5" />} select={sort} /> : null}
            {action ? <div className="ml-auto">{action}</div> : null}
        </div>
    );
}

function DebouncedSearch({
    value,
    onChange,
    placeholder,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
}) {
    // Local state mirrors keystrokes; parent (and the query) only update after
    // the user pauses, so we don't refetch on every character.
    // ponytail: no external-sync effect — parents only reset by unmounting
    // (dialog close), which remounts this with a fresh initial value.
    const [local, setLocal] = useState(value);

    useEffect(() => {
        if (local === value) return;
        const t = setTimeout(() => onChange(local), 300);
        return () => clearTimeout(t);
    }, [local, value, onChange]);

    return (
        <div className="relative w-full max-w-64">
            <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                placeholder={placeholder}
                className="pr-8 pl-8"
            />
            {local ? (
                <button
                    type="button"
                    onClick={() => setLocal("")}
                    className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                >
                    <X className="size-3.5" />
                </button>
            ) : null}
        </div>
    );
}

function SelectMenu({ icon, select }: { icon: React.ReactNode; select: ListSelect }) {
    const active = select.options.find((o) => o.value === select.value);
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                    {icon}
                    {active ? active.label : select.label}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>{select.label}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={select.value} onValueChange={select.onChange}>
                    {select.allLabel !== undefined ? (
                        <DropdownMenuRadioItem value="">{select.allLabel}</DropdownMenuRadioItem>
                    ) : null}
                    {select.options.map((o) => (
                        <DropdownMenuRadioItem key={o.value} value={o.value}>
                            {o.label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
