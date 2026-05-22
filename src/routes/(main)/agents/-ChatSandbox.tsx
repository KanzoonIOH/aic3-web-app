import { chatWithAgent } from "@/api/agents";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

interface Message {
    role: "user" | "assistant";
    text: string;
}

const MAX_ROWS = 8;

export function ChatSanbox({ agentId }: { agentId: string }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        mutationFn: (text: string) => chatWithAgent(agentId, text),
        onSuccess: (response) => {
            console.log(response);
            setMessages((prev) => [
                ...prev,
                { role: "assistant", text: response.reply },
            ]);
        },
        onError: (response) => {
            console.log(response);
            // setMessages((prev) => [
            //     ...prev,
            //     { role: "assistant", text: response.data.reply },
            // ]);
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
        // reset height after clearing input
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
                                <p className="max-w-[75%] text-sm leading-relaxed">
                                    {msg.text}
                                </p>
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

            <div className="shrink-0 pt-3 pb-9">
                <div className="flex items-end gap-2 w-full max-w-3xl mx-auto">
                    <textarea
                        ref={textareaRef}
                        className="h-auto flex-1 resize-none rounded-md border border-input bg-transparent px-5 py-5 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
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
