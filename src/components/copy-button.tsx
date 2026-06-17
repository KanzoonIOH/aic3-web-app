import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

// ponytail: consolidated from 4 copy-paste implementations across the codebase
export function CopyButton({ value, className }: { value: string; className?: string }) {
    const [copied, setCopied] = useState(false);

    function handleCopy() {
        navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    }

    return (
        <Button
            variant="ghost"
            size="icon-xs"
            className={className ?? "shrink-0 text-muted-foreground hover:text-foreground"}
            onClick={handleCopy}
            aria-label="Copy"
        >
            {copied ? (
                <Check className="size-3 text-green-500" />
            ) : (
                <Copy className="size-3" />
            )}
        </Button>
    );
}

export function CopyableUri({ uri }: { uri: string }) {
    const MAX = 32;
    const clipped = uri.length > MAX ? uri.slice(0, MAX) + "…" : uri;

    return (
        <div className="flex items-center gap-1.5 min-w-0">
            <span
                className="truncate font-mono text-xs text-muted-foreground"
                title={uri}
            >
                {clipped}
            </span>
            <CopyButton value={uri} />
        </div>
    );
}
