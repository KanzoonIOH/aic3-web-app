import { HardHat } from "lucide-react";

export function UnderConstruction() {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <HardHat className="size-12" />
            <p className="text-sm font-medium">Under Construction</p>
        </div>
    );
}
