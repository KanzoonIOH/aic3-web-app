import { uploadImage } from "@/api/agents";
import {
    getOrchestrator,
    updateOrchestrator,
    type Orchestrator,
    type OrchestratorDetail,
} from "@/api/orchestrators";
import { AvatarPicker } from "@/components/avatar-picker";
import { LogsTable } from "@/components/logs-table";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
    useResponsiveDrawerDirection,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { copyText, resolveServerMessage, textareaClass } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
    Check,
    Copy,
    LayoutGridIcon,
    Link,
    MessagesSquareIcon,
    Pencil,
    ScrollText,
    SmilePlusIcon,
    TerminalSquare,
    Users,
} from "lucide-react";
import { useState } from "react";
import { ChatSanbox } from "../-ChatSandbox";
import { OrchestratorCustomization } from "../-OrchestratorCustomization";
import { Overview } from "../-Overview";
import { DetailHeader } from "../-DetailHeader";
import type { OrchestratorAgent } from "@/api/orchestrators";
import { UserAvatar } from "@/components/user-avatar";
import { Link as RouterLink } from "@tanstack/react-router";

export const Route = createFileRoute("/(main)/agents/orchestrator/$id")({
    component: RouteComponent,
});

// ---------- Edit drawer (name, avatar, description, active toggle) ----------

// Accepts either the list row (Orchestrator) or the detail — both carry every
// editable field. trigger lets the list card supply its own button.
export function EditOrchestratorDialog({
    orch,
    trigger,
}: {
    orch: Omit<Orchestrator, "agents_count">;
    trigger?: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const direction = useResponsiveDrawerDirection();
    const [name, setName] = useState(orch.name);
    const [description, setDescription] = useState(orch.description ?? "");
    const [isActive, setIsActive] = useState(orch.is_active);
    const [image, setImage] = useState(orch.image ?? "");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [webhookUri, setWebhookUri] = useState(orch.webhook_uri ?? "");
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async () => {
            const imageUrl = imageFile ? await uploadImage(imageFile) : image;
            await updateOrchestrator(orch.id, {
                name: name.trim(),
                description: description.trim() || null,
                is_active: isActive,
                // Preserve fields owned by the Customization tab.
                routing_guide: orch.routing_guide,
                persona: orch.persona,
                guardrail: orch.guardrail,
                image: imageUrl || null,
                webhook_uri: webhookUri.trim(),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orchestrators"] });
            queryClient.invalidateQueries({ queryKey: ["orchestrators", orch.id] });
            setOpen(false);
        },
    });

    function handleOpenChange(next: boolean) {
        setOpen(next);
        mutation.reset();
        setName(orch.name);
        setDescription(orch.description ?? "");
        setIsActive(orch.is_active);
        setImage(orch.image ?? "");
        setImageFile(null);
        setWebhookUri(orch.webhook_uri ?? "");
    }

    const canSubmit = name.trim().length > 0;

    return (
        <Drawer open={open} onOpenChange={handleOpenChange} direction={direction}>
            <DrawerTrigger asChild>
                {trigger ?? (
                    <Button size="sm" variant="outline">
                        <Pencil className="size-3.5" />
                        Edit orchestrator
                    </Button>
                )}
            </DrawerTrigger>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>Edit orchestrator</DrawerTitle>
                    <DrawerDescription>
                        Update this orchestrator's public details.
                    </DrawerDescription>
                </DrawerHeader>

                <div className="overflow-y-auto px-4">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (canSubmit) mutation.mutate();
                        }}
                        className="flex flex-col gap-4 pb-4"
                    >
                        {mutation.isError && (
                            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                {resolveServerMessage(mutation.error)}
                            </p>
                        )}

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="orch-name">Name</Label>
                            <Input
                                id="orch-name"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    mutation.reset();
                                }}
                                autoFocus
                            />
                        </div>

                        <AvatarPicker
                            value={image}
                            onChange={(v) => {
                                setImage(v);
                                setImageFile(null);
                            }}
                            onFile={setImageFile}
                            name={name}
                        />

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="orch-desc">Description</Label>
                            <textarea
                                id="orch-desc"
                                value={description}
                                onChange={(e) => {
                                    setDescription(e.target.value);
                                    mutation.reset();
                                }}
                                className={textareaClass}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="orch-webhook">Webhook URI</Label>
                            <Input
                                id="orch-webhook"
                                value={webhookUri}
                                onChange={(e) => {
                                    setWebhookUri(e.target.value);
                                    mutation.reset();
                                }}
                                placeholder="https://upstream.example.com/agents/orchestrator/ask"
                            />
                            <p className="text-xs text-muted-foreground">
                                The upstream URL chat requests are forwarded to.
                                Append /stream for the streaming variant.
                            </p>
                        </div>

                        <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => {
                                    setIsActive(e.target.checked);
                                    mutation.reset();
                                }}
                                className="size-4 accent-primary"
                            />
                            Orchestrator is active
                        </label>
                    </form>
                </div>

                <DrawerFooter>
                    <div className="flex gap-2">
                        <DrawerClose asChild>
                            <Button type="button" variant="outline" className="flex-1">
                                Cancel
                            </Button>
                        </DrawerClose>
                        <Button
                            type="button"
                            className="flex-1"
                            disabled={!canSubmit || mutation.isPending}
                            onClick={() => canSubmit && mutation.mutate()}
                        >
                            {mutation.isPending ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}

// ---------- Integration tab ----------

const API_BASE_URL = import.meta.env.VITE_API_URL as string;

function useCopyState() {
    const [copied, setCopied] = useState(false);
    function copy(text: string) {
        copyText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }
    return { copied, copy };
}

function ApiTab({ orch }: { orch: OrchestratorDetail }) {
    // Orchestrator chat rides the same /chat/{id} route as agents.
    const endpointUrl = `${API_BASE_URL}/chat/${orch.id}`;
    const curlSnippet = `curl --request POST \\
  --url ${endpointUrl} \\
  --header 'authorization: Bearer [your token here]' \\
  --header 'content-type: application/json' \\
  --header 'x-session-id: [existing session id]' \\
  --data '{
  "sessionId": "string",
  "chatInput": "apa paket internet yang bagus?"
}'`;

    const urlCopy = useCopyState();
    const curlCopy = useCopyState();

    return (
        <div className="h-full overflow-y-auto px-6 py-6">
            <div className="max-w-2xl flex flex-col gap-6">
                <div>
                    <h2 className="text-base font-semibold mb-1">Chat endpoint</h2>
                    <p className="text-sm text-muted-foreground">
                        Send a{" "}
                        <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
                            POST
                        </code>{" "}
                        request to chat with this orchestrator programmatically.
                        Replace{" "}
                        <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
                            [your token here]
                        </code>{" "}
                        with a valid API key. Include the{" "}
                        <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
                            x-session-id
                        </code>{" "}
                        header only when continuing an existing session.
                    </p>
                </div>

                <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Endpoint URL
                    </p>
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
                        <code className="flex-1 text-sm font-mono break-all text-foreground">
                            {endpointUrl}
                        </code>
                        <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => urlCopy.copy(endpointUrl)}
                            title="Copy URL"
                            className="shrink-0"
                        >
                            {urlCopy.copied ? (
                                <Check className="size-3.5 text-green-500" />
                            ) : (
                                <Link className="size-3.5" />
                            )}
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            cURL example
                        </p>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => curlCopy.copy(curlSnippet)}
                            className="gap-1.5 h-7 text-xs"
                        >
                            {curlCopy.copied ? (
                                <>
                                    <Check className="size-3.5 text-green-500" /> Copied
                                </>
                            ) : (
                                <>
                                    <Copy className="size-3.5" /> Copy cURL
                                </>
                            )}
                        </Button>
                    </div>
                    <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 px-4 py-3.5 text-xs font-mono leading-relaxed text-foreground whitespace-pre">
                        {curlSnippet}
                    </pre>
                </div>
            </div>
        </div>
    );
}

// ---------- Agents tab ----------

function AgentsTab({ agents }: { agents: OrchestratorAgent[] }) {
    if (agents.length === 0) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Users className="size-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                        No agents linked to this orchestrator.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto px-6 py-6">
            <div className="mx-auto flex max-w-2xl flex-col gap-4">
                <div>
                    <h2 className="text-base font-semibold">Agents</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        The sub-agents this orchestrator can route to. Click an
                        agent to open its detail page.
                    </p>
                </div>
                <div className="flex flex-col gap-2">
                    {agents.map((agent) => (
                        <RouterLink
                            key={agent.agent_id}
                            to="/agents/garden/$id"
                            params={{ id: agent.agent_id }}
                        >
                            <div className="flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/40">
                                <UserAvatar
                                    image={agent.agent_image}
                                    name={agent.agent_name}
                                    size="sm"
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">
                                        {agent.agent_name}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {agent.description || agent.endpoint || "—"}
                                    </p>
                                </div>
                            </div>
                        </RouterLink>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ---------- Page ----------

function RouteComponent() {
    const { id } = Route.useParams();

    const {
        data: orch,
        isPending,
        isError,
    } = useQuery({
        queryKey: ["orchestrators", id],
        queryFn: () => getOrchestrator(id),
    });

    if (isPending) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading orchestrator...</p>
            </div>
        );
    }

    if (isError || !orch) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                    Failed to load orchestrator
                </p>
            </div>
        );
    }

    const o = orch.data;

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <DetailHeader
                name={o.name}
                description={o.description}
                image={o.image}
                isActive={o.is_active}
                editTrigger={<EditOrchestratorDialog orch={o} />}
            />

            <Tabs
                defaultValue="overview"
                className="flex-1 grid grid-rows-[auto_1fr] overflow-hidden gap-0"
            >
                <div className="border-b">
                    <TabsList variant="line">
                        <TabsTrigger value="overview">
                            <LayoutGridIcon />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="agents">
                            <Users />
                            Agents
                        </TabsTrigger>
                        <TabsTrigger value="persona">
                            <SmilePlusIcon />
                            Customization
                        </TabsTrigger>
                        <TabsTrigger value="chat">
                            <MessagesSquareIcon />
                            Chat Sandbox
                        </TabsTrigger>
                        <TabsTrigger value="logs">
                            <ScrollText />
                            Logs
                        </TabsTrigger>
                        <TabsTrigger value="api">
                            <TerminalSquare />
                            Integration
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview" className="overflow-hidden">
                    <Overview agentId={id} />
                </TabsContent>
                <TabsContent value="agents" className="overflow-y-auto">
                    <AgentsTab agents={o.agents} />
                </TabsContent>
                <TabsContent value="persona" className="overflow-hidden">
                    <OrchestratorCustomization orchestratorId={id} />
                </TabsContent>
                <TabsContent value="chat" className="overflow-hidden">
                    <ChatSanbox agentId={id} agentName={o.name} outputField="reply" />
                </TabsContent>
                <TabsContent value="logs" className="overflow-y-auto">
                    <div className="p-6">
                        <LogsTable agentId={id} />
                    </div>
                </TabsContent>
                <TabsContent value="api" className="overflow-hidden">
                    <ApiTab orch={o} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
