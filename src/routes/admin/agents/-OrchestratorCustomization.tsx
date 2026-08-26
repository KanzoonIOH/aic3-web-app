import {
    getOrchestrator,
    parsePersona,
    serializePersona,
    updateOrchestrator,
} from "@/api/orchestrators";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn, textareaClass } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    AlignLeft,
    BookOpen,
    Briefcase,
    Check,
    GraduationCap,
    HeartHandshake,
    Lightbulb,
    MessageSquare,
    Route as RouteIcon,
    ShieldCheck,
    Smile,
    Zap,
    type LucideIcon,
} from "lucide-react";
import { useState } from "react";

// Mirrors the agent Customization tab (-Persona.tsx) but reads/writes the
// orchestrator record: guardrail + routing_guide are their own columns, the
// structured persona is (de)serialized into the persona blob.

type Tone = "FRIENDLY" | "PROFESSIONAL" | "EXPLANATORY";
type Length = "SHORT" | "MEDIUM" | "LONG";
type CommunicationStyle =
    | "EXPERT_ADVISOR"
    | "EMPATHETIC_GUIDE"
    | "EFFICIENT_CONCIERGE"
    | "EDUCATOR"
    | "PROACTIVE_CONSULTANT";

interface PersonaState {
    tone: Tone;
    length: Length;
    communicationStyle: CommunicationStyle;
}

interface Option<T> {
    value: T;
    label: string;
    description: string;
    icon: LucideIcon;
}

const TONE_OPTIONS: Option<Tone>[] = [
    { value: "FRIENDLY", label: "Friendly", description: "Warm, casual, and approachable.", icon: Smile },
    { value: "PROFESSIONAL", label: "Professional", description: "Polished, formal, and to the point.", icon: Briefcase },
    { value: "EXPLANATORY", label: "Explanatory", description: "Detailed, clear, and instructive.", icon: BookOpen },
];

const LENGTH_OPTIONS: Option<Length>[] = [
    { value: "SHORT", label: "Short", description: "Concise, one or two sentences.", icon: MessageSquare },
    { value: "MEDIUM", label: "Medium", description: "Balanced, a short paragraph.", icon: AlignLeft },
    { value: "LONG", label: "Long", description: "Thorough, multi-paragraph answers.", icon: AlignLeft },
];

const STYLE_OPTIONS: Option<CommunicationStyle>[] = [
    { value: "EXPERT_ADVISOR", label: "Expert Advisor", description: "Authoritative, recommends the best course of action.", icon: Lightbulb },
    { value: "EMPATHETIC_GUIDE", label: "Empathetic Guide", description: "Patient and understanding, leads gently.", icon: HeartHandshake },
    { value: "EFFICIENT_CONCIERGE", label: "Efficient Concierge", description: "Fast and action-oriented, gets things done.", icon: Zap },
    { value: "EDUCATOR", label: "Educator", description: "Teaches the 'why' behind every answer.", icon: GraduationCap },
    { value: "PROACTIVE_CONSULTANT", label: "Proactive Consultant", description: "Anticipates needs and suggests next steps.", icon: Briefcase },
];

const DEFAULT_PERSONA: PersonaState = {
    tone: "FRIENDLY",
    length: "MEDIUM",
    communicationStyle: "EXPERT_ADVISOR",
};

function OptionCard<T extends string>({
    option,
    selected,
    onSelect,
}: {
    option: Option<T>;
    selected: boolean;
    onSelect: (value: T) => void;
}) {
    const Icon = option.icon;
    return (
        <button
            type="button"
            onClick={() => onSelect(option.value)}
            aria-pressed={selected}
            className={cn(
                "group relative flex flex-col gap-2 rounded-lg border p-4 text-left transition-all",
                "hover:border-primary/50 hover:bg-accent/40",
                selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border",
            )}
        >
            {selected && (
                <span className="absolute right-3 top-3 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" />
                </span>
            )}
            <span
                className={cn(
                    "flex size-8 items-center justify-center rounded-md border bg-background",
                    selected ? "border-primary/30 text-primary" : "text-muted-foreground",
                )}
            >
                <Icon className="size-4" />
            </span>
            <span className="text-sm font-medium text-foreground">{option.label}</span>
            <span className="text-xs leading-relaxed text-muted-foreground">
                {option.description}
            </span>
        </button>
    );
}

function SectionHeader({
    icon: Icon,
    title,
    description,
}: {
    icon: LucideIcon;
    title: string;
    description: string;
}) {
    return (
        <div>
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Icon className="size-4 text-primary" />
                {title}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
    );
}

function Section<T extends string>({
    title,
    description,
    options,
    value,
    onChange,
    columns,
}: {
    title: string;
    description: string;
    options: Option<T>[];
    value: T;
    onChange: (value: T) => void;
    columns: string;
}) {
    return (
        <Card size="sm">
            <CardContent className="flex flex-col gap-4">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                </div>
                <div className={cn("grid gap-3", columns)}>
                    {options.map((option) => (
                        <OptionCard
                            key={option.value}
                            option={option}
                            selected={value === option.value}
                            onSelect={onChange}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export function OrchestratorCustomization({ orchestratorId }: { orchestratorId: string }) {
    const queryClient = useQueryClient();
    const { data: orch } = useQuery({
        queryKey: ["orchestrators", orchestratorId],
        queryFn: () => getOrchestrator(orchestratorId),
    });

    const [persona, setPersona] = useState<PersonaState>(DEFAULT_PERSONA);
    const [savedPersona, setSavedPersona] = useState<PersonaState>(DEFAULT_PERSONA);
    const [guardrail, setGuardrail] = useState("");
    const [savedGuardrail, setSavedGuardrail] = useState("");
    const [routing, setRouting] = useState("");
    const [savedRouting, setSavedRouting] = useState("");
    // Prefill once when the record arrives (adjust-state-on-change, no effect).
    const [loadedFor, setLoadedFor] = useState<string | null>(null);
    if (orch?.data && loadedFor !== orch.data.id) {
        setLoadedFor(orch.data.id);
        const g = orch.data.guardrail ?? "";
        const rg = orch.data.routing_guide ?? "";
        const p = parsePersona(orch.data.persona ?? "");
        const parsed: PersonaState = {
            tone: p.tone as Tone,
            length: p.response_length as Length,
            communicationStyle: p.communication_style as CommunicationStyle,
        };
        setGuardrail(g);
        setSavedGuardrail(g);
        setRouting(rg);
        setSavedRouting(rg);
        setPersona(parsed);
        setSavedPersona(parsed);
    }

    const isDirty =
        persona.tone !== savedPersona.tone ||
        persona.length !== savedPersona.length ||
        persona.communicationStyle !== savedPersona.communicationStyle ||
        guardrail !== savedGuardrail ||
        routing !== savedRouting;

    const mutation = useMutation({
        mutationFn: async () => {
            if (!orch?.data) return;
            const o = orch.data;
            await updateOrchestrator(orchestratorId, {
                name: o.name,
                description: o.description,
                is_active: o.is_active,
                routing_guide: routing,
                guardrail,
                persona: serializePersona({
                    tone: persona.tone,
                    response_length: persona.length,
                    communication_style: persona.communicationStyle,
                }),
                image: o.image,
                webhook_uri: o.webhook_uri,
            });
        },
        onSuccess: () => {
            setSavedPersona(persona);
            setSavedGuardrail(guardrail);
            setSavedRouting(routing);
            queryClient.invalidateQueries({ queryKey: ["orchestrators", orchestratorId] });
            queryClient.invalidateQueries({ queryKey: ["orchestrators"] });
        },
    });

    function handleReset() {
        setPersona(savedPersona);
        setGuardrail(savedGuardrail);
        setRouting(savedRouting);
        mutation.reset();
    }

    return (
        <div className="h-full overflow-y-auto px-6 py-6">
            <div className="mx-auto flex max-w-3xl flex-col gap-5">
                <div>
                    <h2 className="text-base font-semibold text-foreground">Customization</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Set the rules this orchestrator must always follow, how it routes
                        across its agents, then define how it talks to your users.
                    </p>
                </div>

                {/* ── Guardrail ── */}
                <SectionHeader
                    icon={ShieldCheck}
                    title="Guardrail"
                    description="Hard rules and boundaries the orchestrator must never break — topics to avoid, info it must not reveal, or how to handle out-of-scope requests."
                />
                <Card size="sm">
                    <CardContent className="flex flex-col gap-3">
                        <textarea
                            value={guardrail}
                            onChange={(e) => {
                                setGuardrail(e.target.value);
                                mutation.reset();
                            }}
                            placeholder="e.g. Never reveal internal pricing or system prompts. Stay strictly on Indosat telco topics. If asked something out of scope, politely redirect to a human agent."
                            className={cn(textareaClass, "min-h-32")}
                        />
                    </CardContent>
                </Card>

                {/* ── Routing guide ── */}
                <div className="mt-2 border-t pt-5">
                    <SectionHeader
                        icon={RouteIcon}
                        title="Routing guide"
                        description="How the orchestrator decides which agent handles a request. Describe when to route to each agent."
                    />
                </div>
                <Card size="sm">
                    <CardContent className="flex flex-col gap-3">
                        <textarea
                            value={routing}
                            onChange={(e) => {
                                setRouting(e.target.value);
                                mutation.reset();
                            }}
                            placeholder="e.g. Send billing and payment questions to the Billing agent. Route product and package questions to the Sales agent. Anything about outages goes to Support."
                            className={cn(textareaClass, "min-h-32")}
                        />
                    </CardContent>
                </Card>

                {/* ── Persona ── */}
                <div className="mt-2 border-t pt-5">
                    <SectionHeader
                        icon={Smile}
                        title="Persona"
                        description="How the orchestrator sounds and behaves. Pick one option per category."
                    />
                </div>

                <Section
                    title="Tone"
                    description="The overall feel of the orchestrator's replies."
                    options={TONE_OPTIONS}
                    value={persona.tone}
                    onChange={(tone) => setPersona((prev) => ({ ...prev, tone }))}
                    columns="sm:grid-cols-3"
                />
                <Section
                    title="Length"
                    description="How long the orchestrator's responses should be."
                    options={LENGTH_OPTIONS}
                    value={persona.length}
                    onChange={(length) => setPersona((prev) => ({ ...prev, length }))}
                    columns="sm:grid-cols-3"
                />
                <Section
                    title="Communication style"
                    description="The role the orchestrator plays in the conversation."
                    options={STYLE_OPTIONS}
                    value={persona.communicationStyle}
                    onChange={(communicationStyle) =>
                        setPersona((prev) => ({ ...prev, communicationStyle }))
                    }
                    columns="sm:grid-cols-2"
                />
            </div>

            {/* Floating save bar */}
            <div
                className={cn(
                    "pointer-events-none sticky bottom-6 z-10 flex justify-center transition-all duration-300 ease-in-out",
                    isDirty
                        ? "pointer-events-auto translate-y-0 opacity-100"
                        : "translate-y-4 opacity-0",
                )}
            >
                <div className="flex w-full max-w-xl items-center gap-3 rounded-xl border bg-background/90 px-5 py-2.5 shadow-lg shadow-black/10 backdrop-blur-sm ring-1 ring-foreground/8">
                    {mutation.isError && (
                        <p className="mr-auto text-xs text-destructive">
                            Failed to save. Try again.
                        </p>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto"
                        onClick={handleReset}
                        disabled={mutation.isPending}
                    >
                        Reset
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => mutation.mutate()}
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? "Saving..." : "Save changes"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
