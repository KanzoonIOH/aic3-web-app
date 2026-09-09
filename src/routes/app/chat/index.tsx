import type { ConversationDetail } from "@/api/conversations";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bot } from "lucide-react";
import { ChatSanbox } from "../../admin/agents/-ChatSandbox";
import { useChatables } from "../-chatables";

export const Route = createFileRoute("/app/chat/")({
    validateSearch: (search: Record<string, unknown>) => ({
        agent: typeof search.agent === "string" ? search.agent : undefined,
    }),
    component: RouteComponent,
});

function RouteComponent() {
    const { agent } = Route.useSearch();
    const { all, isPending, isError } = useChatables();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // ?agent=... comes from the sidebar; fall back to the first active one.
    const selected = all.find((a) => a.id === agent) ?? all[0] ?? null;

    if (isPending) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                    Loading agents...
                </p>
            </div>
        );
    }

    if (isError || !selected) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-2">
                <Bot className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                    {isError ? "Failed to load agents" : "No agents available"}
                </p>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <ChatSanbox
                key={selected.id}
                agentId={selected.id}
                agentName={selected.name}
                dynamicKeys={selected.dynamicKeys}
                dynamicHeaderKeys={selected.dynamicHeaderKeys}
                outputField={selected.outputField}
                stream={selected.stream}
                welcomeTitle={selected.name}
                welcomeImage={selected.image}
                onSessionStart={(sessionId, msgs) => {
                    queryClient.invalidateQueries({
                        queryKey: ["conversations"],
                    });
                    // Seed the detail cache so /app/chat/$id renders the
                    // transcript instantly; it revalidates in the background.
                    const now = new Date().toISOString();
                    const seeded: ConversationDetail = {
                        conversation: {
                            id: sessionId,
                            agent_id: selected.id,
                            agent_name: selected.name,
                            started_at: now,
                            ended_at: null,
                            is_active: true,
                        },
                        messages: msgs.map((m, i) => ({
                            id: `seed-${i}`,
                            conversation_id: sessionId,
                            role: m.role,
                            content: m.text,
                            attachments: null,
                            data: null,
                            created_at: now,
                        })),
                    };
                    queryClient.setQueryData(
                        ["conversation", sessionId],
                        seeded,
                    );
                    navigate({
                        to: "/app/chat/$id",
                        params: { id: sessionId },
                    });
                }}
            />
        </div>
    );
}
