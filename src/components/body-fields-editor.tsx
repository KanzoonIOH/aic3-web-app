import type { BodyField } from "@/api/agents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

export function bodyFieldsToRows(fields: BodyField[] | null | undefined): BodyField[] {
    if (!fields) return [];
    return fields.map((f) => ({ ...f }));
}

// Drop rows with a blank key; default type to static.
export function cleanBodyFields(rows: BodyField[]): BodyField[] {
    const out: BodyField[] = [];
    for (const r of rows) {
        const key = r.key.trim();
        if (!key) continue;
        out.push({
            key,
            type: r.type === "dynamic" ? "dynamic" : "static",
            value: r.type === "dynamic" ? "" : r.value,
        });
    }
    return out;
}

// Editor for extra webhook body fields. "static" sends a fixed value; "dynamic"
// is supplied per request by the caller (chat sandbox shows an input for it).
export function BodyFieldsEditor({
    rows,
    onChange,
    label = "Webhook body fields",
    description = "Extra keys sent in the request body. Static uses a fixed value; dynamic must be provided per request (e.g. user_id).",
    keyPlaceholder = "Field name (e.g. user_id)",
    addLabel = "Add field",
}: {
    rows: BodyField[];
    onChange: (rows: BodyField[]) => void;
    label?: string;
    description?: string;
    keyPlaceholder?: string;
    addLabel?: string;
}) {
    function update(i: number, patch: Partial<BodyField>) {
        onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
    }
    function remove(i: number) {
        onChange(rows.filter((_, idx) => idx !== i));
    }
    function add() {
        onChange([...rows, { key: "", type: "static", value: "" }]);
    }

    return (
        <div className="flex flex-col gap-2">
            <Label>{label}</Label>
            <p className="-mt-1 text-xs text-muted-foreground">{description}</p>
            {rows.length > 0 && (
                <div className="flex flex-col gap-2">
                    {rows.map((row, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <Input
                                value={row.key}
                                onChange={(e) => update(i, { key: e.target.value })}
                                placeholder={keyPlaceholder}
                                className="flex-1"
                            />
                            <div className="flex shrink-0 overflow-hidden rounded-md border">
                                {(["static", "dynamic"] as const).map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => update(i, { type: t })}
                                        className={cn(
                                            "px-2.5 py-1.5 text-xs capitalize transition-colors",
                                            row.type === t
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-transparent text-muted-foreground hover:bg-muted",
                                        )}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                            <Input
                                value={row.type === "dynamic" ? "" : row.value}
                                onChange={(e) => update(i, { value: e.target.value })}
                                placeholder={
                                    row.type === "dynamic"
                                        ? "Set at request time"
                                        : "Value"
                                }
                                disabled={row.type === "dynamic"}
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => remove(i)}
                                aria-label="Remove field"
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={add}
            >
                <Plus className="size-3.5" /> {addLabel}
            </Button>
        </div>
    );
}
