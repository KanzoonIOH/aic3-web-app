import { getConversation, toAttachments } from "@/api/conversations";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Bot } from "lucide-react";
import { ChatSanbox } from "../../admin/agents/-ChatSandbox";
import { useChatables } from "../-chatables";

export const Route = createFileRoute("/app/chat/$id")({
    component: RouteComponent,
});

function RouteComponent() {
    const { id } = Route.useParams();
    const queryClient = useQueryClient();

    const {
        data: conv,
        isPending,
        isError,
    } = useQuery({
        queryKey: ["conversation", id],
        queryFn: () => getConversation(id),
        staleTime: 0,
        refetchOnMount: "always",
    });

    // The chatable list already carries the config needed to keep chatting,
    // and covers orchestrators too (GET /agents/{id} would 404 for those).
    const { all } = useChatables();
    const chatable = all.find((c) => c.id === conv?.conversation.agent_id);

    if (isPending) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                    Loading conversation...
                </p>
            </div>
        );
    }

    if (isError || !conv) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-2">
                <Bot className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                    Failed to load conversation
                </p>
            </div>
        );
    }

    // Only text turns are re-rendered; attachment/report-only turns carry no
    // chat bubble text.
    const initialMessages = conv.messages
        .filter((m) => m.role !== "system" && (m.content || m.attachments))
        .map((m) => ({
            role: m.role as "user" | "assistant",
            text: (m.content ?? "") as string,
            attachments: toAttachments(m.attachments),
        }));

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="shrink-0 border-b bg-background px-6 py-4">
                <div className="flex items-baseline gap-2">
                    <h1 className="font-heading text-2xl font-semibold">
                        {conv.conversation.agent_name}
                    </h1>
                    <span className="text-sm text-muted-foreground">
                        Continuing conversation
                    </span>
                </div>
            </div>
            <div className="flex-1 overflow-hidden">
                <ChatSanbox
                    key={id}
                    agentId={conv.conversation.agent_id}
                    agentName={conv.conversation.agent_name}
                    dynamicKeys={chatable?.dynamicKeys ?? []}
                    dynamicHeaderKeys={chatable?.dynamicHeaderKeys ?? []}
                    outputField={chatable?.outputField ?? "reply"}
                    stream={chatable?.stream ?? true}
                    initialSessionId={id}
                    initialMessages={initialMessages}
                    onTurnComplete={() =>
                        queryClient.invalidateQueries({
                            queryKey: ["conversations"],
                        })
                    }
                />
            </div>
        </div>
    );
}
