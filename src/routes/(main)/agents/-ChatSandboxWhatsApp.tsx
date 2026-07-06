import { chatWithAgent, type NextStep } from "@/api/agents";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Paperclip, Send, SmileIcon } from "lucide-react";
import { MarkdownMessage } from "./-MarkdownMessage";

interface Message {
    role: "user" | "assistant";
    text: string;
    time: string;
}

const MAX_ROWS = 6;

// WhatsApp Web dark palette, matched to the source CSS variables.
const C = {
    pageBg: "#111b21",
    chatBg: "#0b141a",
    header: "#202c33",
    inputBar: "#202c33",
    inputField: "#2a3942",
    incoming: "#202c33",
    outgoing: "#005c4b",
    text: "#e9edef",
    subtext: "#8696a0",
    tick: "#53bdeb",
    accent: "#00a884",
    pillBg: "rgba(17,27,33,0.85)",
};

// WhatsApp's dark wallpaper is a subtle repeated leaf/floral motif.
const PATTERN = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="304" height="304" viewBox="0 0 304 304">
  <rect width="304" height="304" fill="#0b141a"/>
  <g fill="none" stroke="#8696a0" stroke-width="0.4" opacity="0.07">
    <!-- leaf cluster top-left -->
    <path d="M20 10 Q30 0 40 10 Q30 20 20 10Z"/>
    <path d="M15 18 Q25 8 35 18 Q25 28 15 18Z"/>
    <path d="M25 4 Q35 -6 45 4 Q35 14 25 4Z"/>
    <!-- leaf cluster top-right -->
    <path d="M168 10 Q178 0 188 10 Q178 20 168 10Z"/>
    <path d="M163 18 Q173 8 183 18 Q173 28 163 18Z"/>
    <path d="M173 4 Q183 -6 193 4 Q183 14 173 4Z"/>
    <!-- leaf cluster mid-left -->
    <path d="M68 62 Q78 52 88 62 Q78 72 68 62Z"/>
    <path d="M63 70 Q73 60 83 70 Q73 80 63 70Z"/>
    <path d="M73 56 Q83 46 93 56 Q83 66 73 56Z"/>
    <!-- leaf cluster mid-right -->
    <path d="M218 62 Q228 52 238 62 Q228 72 218 62Z"/>
    <path d="M213 70 Q223 60 233 70 Q223 80 213 70Z"/>
    <path d="M223 56 Q233 46 243 56 Q233 66 223 56Z"/>
    <!-- center cluster -->
    <path d="M116 114 Q126 104 136 114 Q126 124 116 114Z"/>
    <path d="M111 122 Q121 112 131 122 Q121 132 111 122Z"/>
    <path d="M121 108 Q131 98 141 108 Q131 118 121 108Z"/>
    <!-- bottom clusters -->
    <path d="M20 210 Q30 200 40 210 Q30 220 20 210Z"/>
    <path d="M15 218 Q25 208 35 218 Q25 228 15 218Z"/>
    <path d="M168 210 Q178 200 188 210 Q178 220 168 210Z"/>
    <path d="M163 218 Q173 208 183 218 Q173 228 163 218Z"/>
    <path d="M68 262 Q78 252 88 262 Q78 272 68 262Z"/>
    <path d="M218 262 Q228 252 238 262 Q228 272 218 262Z"/>
    <path d="M116 264 Q126 254 136 264 Q126 274 116 264Z"/>
  </g>
</svg>`,
);

function getTime() {
    return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function DoubleTick() {
    return (
        <svg
            width="18"
            height="11"
            viewBox="0 0 18 11"
            fill="none"
            className="inline-block"
        >
            <path
                d="M1.2 5.8L4.4 9L11.8 1.4"
                stroke={C.tick}
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M6.1 8.8L8 10.2L16.8 1.4"
                stroke={C.tick}
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function MetaRow({ time, isSent }: { time: string; isSent: boolean }) {
    return (
        <span
            className="inline-flex items-center gap-0.5 align-bottom ml-1.5 translate-y-[1px] whitespace-nowrap"
            style={{ color: C.subtext, fontSize: 11 }}
        >
            {time}
            {isSent && <DoubleTick />}
        </span>
    );
}

function OutgoingBubble({ text, time }: { text: string; time: string }) {
    return (
        <div className="flex justify-end">
            <div className="relative max-w-[75%]" style={{ minWidth: 80 }}>
                {/* tail */}
                <svg
                    className="absolute -right-[6px] top-0"
                    width="8"
                    height="13"
                    viewBox="0 0 8 13"
                    fill="none"
                >
                    <path
                        d="M0 0 Q6 0 8 6 Q6 10 2 12 Q1 9 0 0Z"
                        fill={C.outgoing}
                    />
                </svg>
                <div
                    className="rounded-lg rounded-tr-none px-[9px] pt-[5px] pb-[5px] text-[13px] leading-[1.45] shadow-md"
                    style={{
                        backgroundColor: C.outgoing,
                        color: C.text,
                        wordBreak: "break-word",
                    }}
                >
                    {text}
                    <MetaRow time={time} isSent />
                </div>
            </div>
        </div>
    );
}

function IncomingBubble({ text, time }: { text: string; time: string }) {
    return (
        <div className="flex justify-start">
            <div className="relative max-w-[75%]" style={{ minWidth: 80 }}>
                {/* tail */}
                <svg
                    className="absolute -left-[6px] top-0"
                    width="8"
                    height="13"
                    viewBox="0 0 8 13"
                    fill="none"
                >
                    <path
                        d="M8 0 Q2 0 0 6 Q2 10 6 12 Q7 9 8 0Z"
                        fill={C.incoming}
                    />
                </svg>
                <div
                    className="rounded-lg rounded-tl-none px-[9px] pt-[5px] pb-[5px] text-[13px] leading-[1.45] shadow-md"
                    style={{
                        backgroundColor: C.incoming,
                        color: C.text,
                        wordBreak: "break-word",
                    }}
                >
                    <MarkdownMessage text={text} />
                    <MetaRow time={time} isSent={false} />
                </div>
            </div>
        </div>
    );
}

function TypingBubble() {
    return (
        <div className="flex justify-start">
            <div className="relative">
                <svg
                    className="absolute -left-[6px] top-0"
                    width="8"
                    height="13"
                    viewBox="0 0 8 13"
                    fill="none"
                >
                    <path
                        d="M8 0 Q2 0 0 6 Q2 10 6 12 Q7 9 8 0Z"
                        fill={C.incoming}
                    />
                </svg>
                <div
                    className="rounded-lg rounded-tl-none px-4 py-2.5 shadow-md"
                    style={{ backgroundColor: C.incoming }}
                >
                    <div className="flex items-end gap-[3px] h-4">
                        {[0, 160, 320].map((delay) => (
                            <span
                                key={delay}
                                className="rounded-full animate-bounce"
                                style={{
                                    width: 7,
                                    height: 7,
                                    backgroundColor: C.subtext,
                                    animationDelay: `${delay}ms`,
                                    animationDuration: "1s",
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ChatSandboxWhatsApp({
    agentId,
    outputField = "reply",
}: {
    agentId: string;
    outputField?: string;
}) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [nextSteps, setNextSteps] = useState<NextStep[] | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const sessionIdRef = useRef<string | undefined>(undefined);

    const resizeTextarea = useCallback(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        const lh = parseFloat(getComputedStyle(el).lineHeight);
        const max = lh * MAX_ROWS + 24;
        el.style.height = `${Math.min(el.scrollHeight, max)}px`;
        el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
    }, []);

    const mutation = useMutation({
        mutationFn: (text: string) =>
            chatWithAgent(
                agentId,
                text,
                sessionIdRef.current,
                undefined,
                undefined,
                undefined,
                outputField,
            ),
        onSuccess: (res) => {
            if (res.sessionId) sessionIdRef.current = res.sessionId;
            setMessages((p) => [
                ...p,
                { role: "assistant", text: res.reply, time: getTime() },
            ]);
            setNextSteps(res.next_step ?? null);
        },
    });

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, mutation.isPending, nextSteps]);

    function sendText(text: string) {
        if (!text.trim() || mutation.isPending) return;
        setNextSteps(null);
        setInput("");
        setMessages((p) => [...p, { role: "user", text, time: getTime() }]);
        mutation.mutate(text);
        requestAnimationFrame(() => resizeTextarea());
    }

    function handleSend() {
        sendText(input);
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    const lastIsAssistant =
        messages.length > 0 &&
        messages[messages.length - 1].role === "assistant";
    const showNextSteps =
        lastIsAssistant &&
        !mutation.isPending &&
        nextSteps &&
        nextSteps.length > 0;

    return (
        /* outer fills the tab panel and centers the phone */
        <div className="flex h-full items-center justify-center">
            {/* Phone shell */}
            <div
                className="flex flex-col overflow-hidden shadow-2xl h-full max-h-[98%] aspect-[9/16]"
                style={{
                    borderRadius: 20,
                    border: "1px solid rgba(255,255,255,0.06)",
                }}
            >
                {/* Status bar */}
                <div
                    className="flex items-center justify-between px-5 pt-2.5 pb-1 shrink-0 text-[11px] font-semibold"
                    style={{ backgroundColor: C.header, color: C.text }}
                >
                    <span>9:41</span>
                    <div className="flex items-center gap-1.5">
                        {/* wifi */}
                        <svg
                            className="w-3.5 h-3"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
                        </svg>
                        {/* battery */}
                        <svg
                            className="w-4 h-3"
                            viewBox="0 0 24 14"
                            fill="currentColor"
                        >
                            <rect
                                x="0"
                                y="1"
                                width="20"
                                height="12"
                                rx="2"
                                ry="2"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            />
                            <rect
                                x="1.5"
                                y="2.5"
                                width="14"
                                height="9"
                                rx="1"
                                fill="currentColor"
                            />
                            <path d="M21 5v4a2 2 0 0 0 0-4z" />
                        </svg>
                    </div>
                </div>

                {/* App header */}
                <div
                    className="flex items-center gap-3 px-3 py-2 shrink-0"
                    style={{ backgroundColor: C.header }}
                >
                    {/* back arrow */}
                    <svg
                        className="w-5 h-5 shrink-0"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        style={{ color: C.subtext }}
                    >
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                    </svg>
                    {/* avatar */}
                    <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 select-none"
                        style={{ backgroundColor: "#6a7175", color: "#fff" }}
                    >
                        A
                    </div>
                    <div className="min-w-0 flex-1">
                        <p
                            className="text-[15px] font-semibold leading-tight truncate"
                            style={{ color: C.text }}
                        >
                            AI Agent
                        </p>
                        <p
                            className="text-[12px] leading-tight"
                            style={{ color: C.accent }}
                        >
                            {mutation.isPending ? "typing..." : "online"}
                        </p>
                    </div>
                    {/* video + phone + dots */}
                    <div
                        className="flex items-center gap-4 shrink-0"
                        style={{ color: C.subtext }}
                    >
                        <svg
                            className="w-5 h-5"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                        </svg>
                        <svg
                            className="w-5 h-5"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                        </svg>
                        <svg
                            className="w-5 h-5"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                    </div>
                </div>

                {/* Chat body */}
                <div
                    className="flex-1 overflow-hidden"
                    style={{
                        backgroundColor: C.chatBg,
                        backgroundImage: `url("data:image/svg+xml,${PATTERN}")`,
                        backgroundRepeat: "repeat",
                        backgroundSize: "304px 304px",
                    }}
                >
                    <ScrollArea className="h-full">
                        <div className="flex flex-col gap-[2px] px-2 pt-3 pb-2">
                            <div className="flex justify-center mb-2">
                                <span
                                    className="rounded-lg px-3 py-1 text-[11px] font-medium tracking-wide"
                                    style={{
                                        backgroundColor: C.pillBg,
                                        color: C.subtext,
                                    }}
                                >
                                    TODAY
                                </span>
                            </div>

                            {/* encryption notice */}
                            <div className="flex justify-center mb-2">
                                <div
                                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px]"
                                    style={{
                                        backgroundColor: C.pillBg,
                                        color: C.subtext,
                                    }}
                                >
                                    {/* lock icon */}
                                    <svg
                                        className="w-3 h-3 shrink-0"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                    >
                                        <path d="M12 1C8.676 1 6 3.676 6 7v1H4v15h16V8h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v1H8V7c0-2.276 1.724-4 4-4zm0 9a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
                                    </svg>
                                    Messages are end-to-end encrypted
                                </div>
                            </div>

                            {messages.length === 0 && (
                                <div className="flex justify-center mt-8">
                                    <span
                                        className="rounded-lg px-4 py-2 text-[12px]"
                                        style={{
                                            backgroundColor: C.pillBg,
                                            color: C.subtext,
                                        }}
                                    >
                                        Send a message to start chatting
                                    </span>
                                </div>
                            )}

                            {messages.map((msg, i) =>
                                msg.role === "user" ? (
                                    <OutgoingBubble
                                        key={i}
                                        text={msg.text}
                                        time={msg.time}
                                    />
                                ) : (
                                    <IncomingBubble
                                        key={i}
                                        text={msg.text}
                                        time={msg.time}
                                    />
                                ),
                            )}

                            {mutation.isPending && <TypingBubble />}

                            {mutation.isError && (
                                <div className="flex justify-center">
                                    <span className="rounded-lg px-3 py-1 text-[11px] bg-red-900/60 text-red-300">
                                        Something went wrong. Please try again.
                                    </span>
                                </div>
                            )}

                            {showNextSteps && (
                                <div className="flex justify-start pt-2">
                                    <div className="flex max-w-[85%] flex-col gap-1.5">
                                        {nextSteps!.map((step) => (
                                            <button
                                                key={step.label}
                                                type="button"
                                                onClick={() =>
                                                    sendText(step.label)
                                                }
                                                className="rounded-lg border px-3 py-2 text-left text-[13px] leading-snug shadow-sm transition-opacity active:opacity-80"
                                                style={{
                                                    backgroundColor: C.incoming,
                                                    borderColor:
                                                        "rgba(0,168,132,0.45)",
                                                    color: C.accent,
                                                }}
                                            >
                                                {step.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div ref={bottomRef} />
                        </div>
                    </ScrollArea>
                </div>

                {/* Input bar */}
                <div
                    className="flex items-end gap-2 px-2 py-2 shrink-0"
                    style={{ backgroundColor: C.inputBar }}
                >
                    {/* pill input */}
                    <div
                        className="flex flex-1 items-end gap-1.5 rounded-[24px] px-3 py-[6px]"
                        style={{ backgroundColor: C.inputField }}
                    >
                        <button
                            className="shrink-0 mb-[3px]"
                            style={{ color: C.subtext }}
                            tabIndex={-1}
                            type="button"
                        >
                            <SmileIcon className="w-[22px] h-[22px]" />
                        </button>
                        <textarea
                            ref={textareaRef}
                            className="flex-1 resize-none bg-transparent text-[15px] outline-none leading-[1.4] placeholder:opacity-60"
                            placeholder="Message"
                            rows={1}
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                resizeTextarea();
                            }}
                            onKeyDown={handleKeyDown}
                            disabled={mutation.isPending}
                            style={{
                                color: C.text,
                                caretColor: C.accent,
                                maxHeight: 120,
                            }}
                        />
                        <button
                            className="shrink-0 mb-[3px]"
                            style={{ color: C.subtext }}
                            tabIndex={-1}
                            type="button"
                        >
                            <Paperclip className="w-[22px] h-[22px]" />
                        </button>
                    </div>

                    {/* send / mic FAB */}
                    <button
                        onClick={handleSend}
                        disabled={mutation.isPending}
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-opacity active:opacity-80 disabled:opacity-50"
                        style={{ backgroundColor: C.accent }}
                        type="button"
                    >
                        {input.trim() ? (
                            <Send className="w-4 h-4 text-white translate-x-px" />
                        ) : (
                            <Mic className="w-4 h-4 text-white" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
