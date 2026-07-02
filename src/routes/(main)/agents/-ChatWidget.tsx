import { chatWithAgent } from "@/api/agents";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation } from "@tanstack/react-query";
import { MessageSquare, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MarkdownMessage } from "./-MarkdownMessage";

interface Message {
    role: "user" | "assistant";
    text: string;
}

// Floating bottom-right chat bubble for the agent detail page.
// Reuses chatWithAgent (logged-in JWT), same contract as the Chat Sandbox.
export function ChatWidget({
    agentId,
    agentName,
    outputField = "reply",
}: {
    agentId: string;
    agentName: string;
    outputField?: string;
}) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);
    const sessionId = useRef(`widget-${Date.now()}`).current;

    const mutation = useMutation({
        mutationFn: (text: string) =>
            chatWithAgent(
                agentId,
                text,
                sessionId,
                undefined,
                undefined,
                undefined,
                outputField,
            ),
        onSuccess: (response) =>
            setMessages((prev) => [
                ...prev,
                { role: "assistant", text: response.reply },
            ]),
        onError: () =>
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    text: "Something went wrong. Please try again.",
                },
            ]),
    });

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, mutation.isPending]);

    function send() {
        const text = input.trim();
        if (!text || mutation.isPending) return;
        setInput("");
        setMessages((prev) => [...prev, { role: "user", text }]);
        mutation.mutate(text);
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    size="icon-lg"
                    className="fixed bottom-6 right-6 z-50 size-14 rounded-full shadow-lg"
                    aria-label="Open chat"
                >
                    {open ? (
                        <X className="size-6" />
                    ) : (
                        <MessageSquare className="size-6" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                side="top"
                sideOffset={12}
                className="flex h-[460px] max-h-[calc(100vh-7rem)] w-[360px] max-w-[calc(100vw-3rem)] flex-col gap-0 p-0"
            >
                <div className="border-b px-4 py-3">
                    <p className="text-sm font-semibold leading-tight">
                        {agentName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Chat with this agent
                    </p>
                </div>

                <ScrollArea className="min-h-0 flex-1 px-3 py-3">
                    <div className="flex flex-col gap-2.5">
                        {messages.length === 0 && (
                            <p className="mt-8 text-center text-sm text-muted-foreground">
                                Send a message to start.
                            </p>
                        )}
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={
                                    m.role === "user"
                                        ? "max-w-[85%] self-end rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                                        : "max-w-[85%] self-start rounded-lg bg-muted px-3 py-2 text-sm"
                                }
                            >
                                {m.role === "assistant" ? (
                                    <MarkdownMessage text={m.text} />
                                ) : (
                                    m.text
                                )}
                            </div>
                        ))}
                        {mutation.isPending && (
                            <div className="max-w-[85%] self-start rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                                ...
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>
                </ScrollArea>

                <form
                    className="flex items-end gap-2 border-t p-2.5"
                    onSubmit={(e) => {
                        e.preventDefault();
                        send();
                    }}
                >
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                send();
                            }
                        }}
                        rows={1}
                        placeholder="Type a message..."
                        className="max-h-24 flex-1 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!input.trim() || mutation.isPending}
                        aria-label="Send"
                    >
                        <Send className="size-4" />
                    </Button>
                </form>
            </PopoverContent>
        </Popover>
    );
}
