import { chatWithAgent, type CcProduct, type NextStep } from "@/api/agents";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { BotMessageSquare, MessageSquare, Smartphone } from "lucide-react";
import { ChatSandboxWhatsApp } from "./-ChatSandboxWhatsApp";
import { MarkdownMessage } from "./-MarkdownMessage";

// ---------- Types ----------

interface Message {
    role: "user" | "assistant";
    text: string;
}

interface SuggestionItem {
    label: string;
}

interface SuggestionGroup {
    service_category: string;
    list: SuggestionItem[];
}

// ---------- Constants ----------

const INITIAL_SUGGESTIONS: SuggestionGroup[] = [
    {
        service_category: "Account Inquiry",
        list: [
            { label: "Ringkasan saldo semua rekening" },
            { label: "Limit tersedia kartu kredit" },
            { label: "Cek saldo rekening saat ini" },
        ],
    },
    {
        service_category: "Action",
        list: [
            { label: "Mulai pembukaan rekening tabungan" },
            { label: "Mulai pengajuan kartu kredit" },
            { label: "Mulai pengajuan KTA" },
        ],
    },
    {
        service_category: "Complaint",
        list: [
            { label: "Aplikasi error atau gagal login" },
            { label: "Uang ATM tidak keluar atau jumlah tidak sesuai" },
            { label: "Masalah kartu debit atau kredit" },
        ],
    },
    {
        service_category: "Credit Card",
        list: [
            { label: "Syarat pengajuan kartu kredit" },
            { label: "Langkah pengajuan kartu kredit" },
            { label: "Penjelasan tagihan kartu kredit" },
        ],
    },
    {
        service_category: "Loans",
        list: [
            { label: "Syarat pengajuan KTA" },
            { label: "Langkah pengajuan KTA" },
            { label: "Informasi KTA" },
        ],
    },
    {
        service_category: "Mortgage",
        list: [
            { label: "Syarat pengajuan KPR" },
            { label: "Langkah pengajuan KPR" },
            { label: "Informasi KPR" },
        ],
    },
    {
        service_category: "Promotions",
        list: [
            { label: "Promo dining kartu kredit" },
            { label: "Promo cicilan 0% kartu kredit" },
            { label: "Program reward dan poin" },
        ],
    },
    {
        service_category: "Savings",
        list: [
            { label: "Syarat pembukaan Tabungan Reguler" },
            { label: "Langkah pembukaan Tabungan Reguler" },
            { label: "Informasi Tabungan Reguler" },
        ],
    },
];

const CC_TITLE: Record<CcProduct["card_type"], string> = {
    classic: "Hasanah Card Classic",
    gold: "Hasanah Card Gold",
    platinum: "Hasanah Card Platinum",
};

const CC_GRADIENT: Record<CcProduct["card_type"], string> = {
    classic: "linear-gradient(135deg, #c8c5bc 0%, #888780 100%)",
    gold: "linear-gradient(135deg, #FAC775 0%, #BA7517 100%)",
    platinum: "linear-gradient(135deg, #c4b5fd 0%, #7C3AED 100%)",
};

const CC_ACCENT: Record<CcProduct["card_type"], string> = {
    classic: "#888780",
    gold: "#BA7517",
    platinum: "#7C3AED",
};

const MAX_ROWS = 8;

// ---------- Sub-components ----------

function InitialSuggestions({
    groups,
    onSelect,
}: {
    groups: SuggestionGroup[];
    onSelect: (label: string) => void;
}) {
    return (
        <div className="shrink-0 border-t bg-background pt-3 pb-1">
            <p className="mb-2 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                What can I help you with?
            </p>
            <ScrollArea type="scroll" className="w-full">
                <div className="flex min-w-max gap-3 px-4 pb-3">
                    {groups.map((group) => (
                        <div
                            key={group.service_category}
                            className="flex flex-col gap-1.5"
                        >
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                                {group.service_category}
                            </p>
                            <div className="flex flex-col gap-1.5">
                                {group.list.map((item) => (
                                    <button
                                        key={item.label}
                                        type="button"
                                        onClick={() => onSelect(item.label)}
                                        className="shrink-0 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring whitespace-nowrap"
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}

function NextStepSuggestions({
    steps,
    onSelect,
}: {
    steps: NextStep[];
    onSelect: (label: string) => void;
}) {
    return (
        <div className="shrink-0 border-t bg-background pt-3 pb-2">
            <div className="flex items-center gap-1.5 mb-2 px-4 text-xs text-muted-foreground">
                <MessageSquare className="size-3.5" />
                <span>Suggested replies</span>
            </div>
            <div className="flex flex-col gap-1.5 px-4">
                {steps.map((step) => (
                    <button
                        key={step.label}
                        type="button"
                        onClick={() => onSelect(step.label)}
                        className="w-full text-left rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        {step.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

function CcProductCards({
    products,
    onSelect,
}: {
    products: CcProduct[];
    onSelect: (label: string) => void;
}) {
    const [openDetail, setOpenDetail] = useState<Record<string, boolean>>({});

    function toggleDetail(cardType: string) {
        setOpenDetail((prev) => ({ ...prev, [cardType]: !prev[cardType] }));
    }

    return (
        <div className="shrink-0 border-t bg-background pt-3 pb-2">
            <p className="mb-2 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Pilih kartu kredit
            </p>
            <ScrollArea type="scroll" className="w-full">
                <div className="flex gap-3 px-4 pb-3">
                    {products.map((p) => (
                        <div
                            key={p.card_type}
                            className="w-52 shrink-0 flex flex-col gap-3 rounded-xl border border-border bg-background p-4"
                        >
                            {/* Card art */}
                            <div
                                className="h-20 rounded-lg"
                                style={{ background: CC_GRADIENT[p.card_type] }}
                            />

                            {/* Title */}
                            <p className="text-sm font-medium text-foreground leading-snug">
                                {CC_TITLE[p.card_type]}
                            </p>

                            <div className="h-px bg-border" />

                            {/* Benefits */}
                            <ul className="flex flex-col gap-1.5">
                                {p.benefit.map((b) => (
                                    <li
                                        key={b}
                                        className="flex items-start gap-1.5 text-xs text-muted-foreground"
                                    >
                                        <svg
                                            className="mt-0.5 size-3.5 shrink-0"
                                            viewBox="0 0 14 14"
                                            fill="none"
                                        >
                                            <circle
                                                cx="7"
                                                cy="7"
                                                r="6.5"
                                                stroke={CC_ACCENT[p.card_type]}
                                                strokeWidth="0.8"
                                            />
                                            <path
                                                d="M4 7l2 2 4-4"
                                                stroke={CC_ACCENT[p.card_type]}
                                                strokeWidth="1.2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        {b}
                                    </li>
                                ))}
                            </ul>

                            {/* Pick button */}
                            <button
                                type="button"
                                onClick={() =>
                                    onSelect(
                                        `Saya mau daftar ${CC_TITLE[p.card_type]}`,
                                    )
                                }
                                className="w-full rounded-lg border border-border py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                                style={
                                    p.card_type === "platinum"
                                        ? {
                                              borderColor: CC_ACCENT.platinum,
                                              color: CC_ACCENT.platinum,
                                          }
                                        : {}
                                }
                            >
                                Pilih{" "}
                                {CC_TITLE[p.card_type].replace(
                                    "Hasanah Card ",
                                    "",
                                )}
                            </button>

                            {/* Detail toggle */}
                            <button
                                type="button"
                                onClick={() => toggleDetail(p.card_type)}
                                className="w-full text-center text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                            >
                                {openDetail[p.card_type]
                                    ? "Sembunyikan ▲"
                                    : "Lihat detail ▼"}
                            </button>

                            {/* Detail rows */}
                            {openDetail[p.card_type] && (
                                <div className="rounded-lg bg-muted/50 px-3 py-2.5 flex flex-col gap-1.5 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Limit maks
                                        </span>
                                        <span className="font-medium">
                                            Rp{" "}
                                            {p.limit.max.toLocaleString(
                                                "id-ID",
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Welcome bonus
                                        </span>
                                        <span className="font-medium">
                                            {p.welcome_bonus > 0
                                                ? `Rp ${p.welcome_bonus.toLocaleString("id-ID")}`
                                                : "–"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Lounge bandara
                                        </span>
                                        <span className="font-medium">
                                            {p.free_lounge ? "✓ Gratis" : "–"}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}

// ---------- ChatDefault ----------

function ChatDefault({ agentId, agentName }: { agentId: string; agentName: string }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [showInitialSuggestions, setShowInitialSuggestions] = useState(
        agentName.toLowerCase().includes("customer care"),
    );
    const [nextSteps, setNextSteps] = useState<NextStep[] | null>(null);
    const [ccProducts, setCcProducts] = useState<CcProduct[] | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const sessionId = useRef(new Date().toLocaleTimeString()).current;

    const resizeTextarea = useCallback(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
        const maxHeight = lineHeight * MAX_ROWS + 16;
        el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
        el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
    }, []);

    const mutation = useMutation({
        mutationFn: (text: string) => chatWithAgent(agentId, text, sessionId),
        onSuccess: (response) => {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", text: response.reply },
            ]);
            setNextSteps(response.next_step ?? null);
            setCcProducts(response.product ?? null);
        },
        onError: () => {
            // errors shown inline
        },
    });

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, nextSteps, ccProducts]);

    function sendText(text: string) {
        if (!text.trim() || mutation.isPending) return;
        setShowInitialSuggestions(false);
        setNextSteps(null);
        setCcProducts(null);
        setInput("");
        setMessages((prev) => [...prev, { role: "user", text }]);
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
    const showCcProducts =
        lastIsAssistant &&
        !mutation.isPending &&
        ccProducts &&
        ccProducts.length > 0;

    return (
        <div className="flex h-full min-h-0 flex-col">
            <ScrollArea className="min-h-0 flex-1 px-4 py-4 w-full max-w-3xl mx-auto">
                {messages.length === 0 && !showInitialSuggestions && (
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

            {/* CC product cards — shown above next_step suggestions */}
            {showCcProducts && (
                <CcProductCards products={ccProducts!} onSelect={sendText} />
            )}

            {/* Next-step suggestions */}
            {showNextSteps && (
                <NextStepSuggestions steps={nextSteps!} onSelect={sendText} />
            )}

            {/* Initial grouped suggestions (only before first message) */}
            {showInitialSuggestions && messages.length === 0 && (
                <InitialSuggestions
                    groups={INITIAL_SUGGESTIONS}
                    onSelect={sendText}
                />
            )}

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
                    />
                </div>
            </div>
        </div>
    );
}

// ---------- ChatSanbox (exported, owns view toggle) ----------

type ViewMode = "chatbot" | "whatsapp";

export function ChatSanbox({ agentId, agentName }: { agentId: string; agentName: string }) {
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
                    <ChatDefault agentId={agentId} agentName={agentName} />
                ) : (
                    <ChatSandboxWhatsApp agentId={agentId} />
                )}
            </div>
        </div>
    );
}
