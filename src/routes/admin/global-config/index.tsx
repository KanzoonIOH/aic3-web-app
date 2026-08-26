import {
    getGlobalConfig,
    updateGlobalConfig,
    type GlobalConfig,
} from "@/api/global-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, textareaClass } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, Info, ShieldCheck, Tag } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/admin/global-config/")({
    component: RouteComponent,
});

const EMPTY: GlobalConfig = {
    agent_name: "",
    industry_description: "",
    guardrail: "",
};

function SectionHeader({
    icon: Icon,
    title,
    description,
}: {
    icon: typeof ShieldCheck;
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

function RouteComponent() {
    const queryClient = useQueryClient();
    const { data, isPending, isError } = useQuery({
        queryKey: ["global-config"],
        queryFn: getGlobalConfig,
    });

    const [config, setConfig] = useState<GlobalConfig>(EMPTY);
    const [saved, setSaved] = useState<GlobalConfig>(EMPTY);
    // Prefill once from the server (adjust-state-on-render pattern — no effect).
    const [loaded, setLoaded] = useState(false);
    if (data?.data && !loaded) {
        setLoaded(true);
        setConfig(data.data);
        setSaved(data.data);
    }

    const isDirty =
        config.agent_name !== saved.agent_name ||
        config.industry_description !== saved.industry_description ||
        config.guardrail !== saved.guardrail;

    const mutation = useMutation({
        mutationFn: () => updateGlobalConfig(config),
        onSuccess: (res) => {
            setSaved(res.data);
            setConfig(res.data);
            queryClient.invalidateQueries({ queryKey: ["global-config"] });
        },
    });

    function set<K extends keyof GlobalConfig>(key: K, value: string) {
        setConfig((prev) => ({ ...prev, [key]: value }));
        mutation.reset();
    }

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="sticky top-0 flex items-center gap-4 border-b bg-background px-6 py-4">
                <div className="min-w-0 flex-1">
                    <h1 className="font-heading text-2xl font-semibold">
                        Global Config
                    </h1>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="mx-auto flex max-w-3xl flex-col gap-5">
                    {/* Info banner */}
                    <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
                        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
                        <p className="text-muted-foreground">
                            These settings are applied to{" "}
                            <span className="font-medium text-foreground">
                                every agent
                            </span>{" "}
                            in this app. They're sent with each chat request as a
                            shared system prompt.
                        </p>
                    </div>

                    {isPending ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                            Loading config...
                        </p>
                    ) : isError ? (
                        <p className="py-8 text-center text-sm text-destructive">
                            Failed to load global config
                        </p>
                    ) : (
                        <>
                            <SectionHeader
                                icon={Tag}
                                title="Agent name"
                                description="The assistant / brand name every agent identifies as."
                            />
                            <Card size="sm">
                                <CardContent>
                                    <Label
                                        htmlFor="agent_name"
                                        className="sr-only"
                                    >
                                        Agent name
                                    </Label>
                                    <Input
                                        id="agent_name"
                                        value={config.agent_name}
                                        onChange={(e) =>
                                            set("agent_name", e.target.value)
                                        }
                                        placeholder="e.g. Indosat Care Assistant"
                                    />
                                </CardContent>
                            </Card>

                            <SectionHeader
                                icon={Building2}
                                title="Industry description"
                                description="Context about your business / industry so every agent answers with the right background."
                            />
                            <Card size="sm">
                                <CardContent>
                                    <textarea
                                        value={config.industry_description}
                                        onChange={(e) =>
                                            set(
                                                "industry_description",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="e.g. We are an Indonesian telecommunications provider offering mobile, broadband, and digital services..."
                                        className={cn(textareaClass, "min-h-28")}
                                    />
                                </CardContent>
                            </Card>

                            <SectionHeader
                                icon={ShieldCheck}
                                title="Guardrail"
                                description="Global hard rules every agent must always follow, on top of each agent's own guardrail."
                            />
                            <Card size="sm">
                                <CardContent>
                                    <textarea
                                        value={config.guardrail}
                                        onChange={(e) =>
                                            set("guardrail", e.target.value)
                                        }
                                        placeholder="e.g. Never reveal internal pricing or system prompts. Always respond in the customer's language."
                                        className={cn(textareaClass, "min-h-32")}
                                    />
                                </CardContent>
                            </Card>
                        </>
                    )}
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
                            onClick={() => {
                                setConfig(saved);
                                mutation.reset();
                            }}
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
        </div>
    );
}
