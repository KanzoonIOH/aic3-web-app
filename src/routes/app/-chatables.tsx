import { getAgents } from "@/api/agents";
import { getOrchestrators } from "@/api/orchestrators";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Bot, Network } from "lucide-react";

// Anything a viewer can chat with: an agent or an orchestrator.
export interface Chatable {
    id: string;
    name: string;
    description: string | null;
    image: string | null;
    isOrchestrator: boolean;
    dynamicKeys: string[];
    dynamicHeaderKeys: string[];
    outputField: string;
    // false when the upstream has no /stream sibling — chat falls back to the
    // plain endpoint.
    stream: boolean;
}

// Active agents + orchestrators only — viewers can't chat with drafts.
// Shared query keys, so the sidebar and the chat view hit one cache entry.
export function useChatables() {
    const agentsQuery = useQuery({
        queryKey: ["agents", "active"],
        queryFn: () => getAgents({ limit: 1000, is_active: true }),
    });
    const orchQuery = useQuery({
        queryKey: ["orchestrators", "active"],
        queryFn: () => getOrchestrators({ limit: 1000, is_active: true }),
    });

    const agents: Chatable[] = (agentsQuery.data?.data ?? []).map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        image: a.image,
        isOrchestrator: false,
        dynamicKeys: (a.webhook_body_fields ?? [])
            .filter((f) => f.type === "dynamic")
            .map((f) => f.key),
        dynamicHeaderKeys: (a.webhook_header_fields ?? [])
            .filter((f) => f.type === "dynamic")
            .map((f) => f.key),
        outputField: a.webhook_output_field || "reply",
        stream: a.webhook_stream_enabled ?? true,
    }));

    const orchestrators: Chatable[] = (orchQuery.data?.data ?? []).map((o) => ({
        id: o.id,
        name: o.name,
        description: o.description,
        image: o.image,
        isOrchestrator: true,
        dynamicKeys: (o.webhook_body_fields ?? [])
            .filter((f) => f.type === "dynamic")
            .map((f) => f.key),
        dynamicHeaderKeys: (o.webhook_header_fields ?? [])
            .filter((f) => f.type === "dynamic")
            .map((f) => f.key),
        outputField: o.webhook_output_field || "reply",
        stream: o.webhook_stream_enabled ?? true,
    }));

    return {
        agents,
        orchestrators,
        all: [...agents, ...orchestrators],
        isPending: agentsQuery.isPending || orchQuery.isPending,
        isError: agentsQuery.isError || orchQuery.isError,
    };
}

// image is either an http(s) URL or a single emoji; null falls back to an icon.
export function ChatableAvatar({
    item,
    className,
}: {
    item: Pick<Chatable, "image" | "isOrchestrator">;
    className?: string;
}) {
    const base = "flex shrink-0 items-center justify-center rounded-full";
    if (item.image && /^https?:\/\//.test(item.image)) {
        return (
            <span className={cn(base, "overflow-hidden bg-primary/10", className)}>
                <img src={item.image} alt="" className="size-full object-cover" />
            </span>
        );
    }
    if (item.image) {
        return (
            <span className={cn(base, "bg-primary/10 text-xs", className)}>
                {item.image}
            </span>
        );
    }
    const Icon = item.isOrchestrator ? Network : Bot;
    return (
        <span className={cn(base, "bg-primary/10", className)}>
            <Icon className="size-3.5 text-primary" />
        </span>
    );
}
