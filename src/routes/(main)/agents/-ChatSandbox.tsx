import { chatWithAgent } from "@/api/agents";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { BotMessageSquare, Smartphone } from "lucide-react";
import { ChatSandboxWhatsApp } from "./-ChatSandboxWhatsApp";
import { MarkdownMessage } from "./-MarkdownMessage";

interface Message {
    role: "user" | "assistant";
    text: string;
}

const MAX_ROWS = 8;

function ChatDefault({ agentId }: { agentId: string }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const sessionId = new Date().toLocaleTimeString();

    const resizeTextarea = useCallback(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
        const maxHeight = lineHeight * MAX_ROWS + /* py-2 top+bottom */ 16;
        el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
        el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
    }, []);

    const mutation = useMutation({
        mutationFn: (text: string) => chatWithAgent(agentId, text, sessionId),
        onSuccess: (response) => {
            console.log(response);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    text: response.reply,
                },
            ]);
        },
        onError: (response) => {
            console.log(response);
        },
    });

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    function handleSend() {
        const text = input.trim();
        if (!text || mutation.isPending) return;
        setInput("");
        setMessages((prev) => [...prev, { role: "user", text }]);
        mutation.mutate(text);
        requestAnimationFrame(() => resizeTextarea());
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    return (
        <div className="flex h-full flex-col">
            <ScrollArea className="flex-1 px-4 py-4 w-full max-w-3xl mx-auto">
                {messages.length === 0 && (
                    <p className="mt-8 text-center text-sm text-muted-foreground">
                        Send a message to start the conversation.
                    </p>
                )}
                <div className="flex flex-col gap-4">
                    {messages.map((msg, i) =>
                        msg.role === "user" ? (
                            <div key={i} className="flex justify-end">
                                <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
                                    {msg.text}
                                </div>
                            </div>
                        ) : (
                            <div key={i} className="flex justify-start">
                                <MarkdownMessage
                                    text={msg.text}
                                    className="max-w-[75%] text-sm leading-relaxed"
                                />
                            </div>
                        ),
                    )}
                    {mutation.isPending && (
                        <div className="flex justify-start">
                            <p className="text-sm text-muted-foreground animate-pulse">
                                Thinking...
                            </p>
                        </div>
                    )}
                    {mutation.isError && (
                        <div className="flex justify-start">
                            <p className="text-sm text-destructive">
                                Something went wrong. Please try again.
                            </p>
                        </div>
                    )}
                </div>
                <div ref={bottomRef} />
            </ScrollArea>

            <div className="shrink-0 pt-3 pb-8 mx-5">
                <div className="flex items-end gap-2 w-full max-w-3xl mx-auto">
                    <textarea
                        ref={textareaRef}
                        className="h-auto flex-1 resize-none rounded-full border border-input bg-transparent px-5 py-5 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
                        placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
                        rows={1}
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            resizeTextarea();
                        }}
                        onKeyDown={handleKeyDown}
                        disabled={mutation.isPending}
                    />
                    <Button
                        hidden
                        onClick={handleSend}
                        disabled={!input.trim() || mutation.isPending}
                    ></Button>
                </div>
            </div>
        </div>
    );
}

type ViewMode = "chatbot" | "whatsapp";

export function ChatSanbox({ agentId }: { agentId: string }) {
    const [view, setView] = useState<ViewMode>("chatbot");

    return (
        <div className="flex h-full flex-col overflow-hidden">
            {/* Toggle bar */}
            <div className="shrink-0 flex items-center justify-center gap-1.5 border-b px-4 py-2 bg-background">
                <button
                    type="button"
                    onClick={() => setView("chatbot")}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        view === "chatbot"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                    <BotMessageSquare className="size-4" />
                    Chatbot
                </button>
                <button
                    type="button"
                    onClick={() => setView("whatsapp")}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        view === "whatsapp"
                            ? "bg-[#075e54] text-white"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                    <Smartphone className="size-4" />
                    WhatsApp
                </button>
            </div>

            {/* View content */}
            <div className="flex-1 overflow-hidden">
                {view === "chatbot" ? (
                    <ChatDefault agentId={agentId} />
                ) : (
                    <ChatSandboxWhatsApp agentId={agentId} />
                )}
            </div>
        </div>
    );
}
