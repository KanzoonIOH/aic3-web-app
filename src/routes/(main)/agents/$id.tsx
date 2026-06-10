import { getAgent, updateAgent, type Agent } from "@/api/agents";
import { LogsTable } from "@/components/logs-table";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import axios from "axios";
import {
    BookIcon,
    Check,
    Copy,
    LayoutGridIcon,
    Link,
    MessagesSquareIcon,
    Pencil,
    PlugIcon,
    ScrollText,
    SmilePlusIcon,
    TerminalSquare,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { ChatSanbox } from "./-ChatSandbox";
import { Knowledges } from "./-Knowledges";
import { Mcps } from "./-Mcps";
import { Overview } from "./-Overview";
import { Persona } from "./-Persona";

export const Route = createFileRoute("/(main)/agents/$id")({
    component: RouteComponent,
});

const updateAgentSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    description: z.string().trim(),
    is_active: z.boolean(),
    webhook_uri: z
        .string()
        .trim()
        .refine((value) => {
            if (value.length === 0) return true;

            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        }, "Webhook URI must be a valid URL"),
});

type UpdateAgentValues = z.infer<typeof updateAgentSchema>;

type ApiError = {
    message?: string;
};

function resolveServerMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as ApiError | undefined;
        return data?.message ?? error.message;
    }
    return "An unexpected error occurred.";
}

function getAgentFormValues(agent: Agent): UpdateAgentValues {
    return {
        name: agent.name,
        description: agent.description,
        is_active: agent.is_active,
        webhook_uri: agent.webhook_uri,
    };
}

function EditAgentDialog({ agent }: { agent: Agent }) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (payload: UpdateAgentValues) =>
            updateAgent(agent.id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["agents"] });
            queryClient.invalidateQueries({ queryKey: ["agents", agent.id] });
            setOpen(false);
        },
    });

    const form = useForm({
        defaultValues: getAgentFormValues(agent),
        onSubmit: async ({ value }) => {
            const result = updateAgentSchema.safeParse(value);
            if (!result.success) return;

            await mutation.mutateAsync(result.data);
        },
    });

    function handleOpenChange(nextOpen: boolean) {
        setOpen(nextOpen);
        mutation.reset();
        form.reset(getAgentFormValues(agent));
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                    <Pencil className="size-3.5" />
                    Edit agent
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit agent</DialogTitle>
                    <DialogDescription>
                        Update this agent's public details and webhook target.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                    className="flex flex-col gap-4"
                >
                    {mutation.isError && (
                        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {resolveServerMessage(mutation.error)}
                        </p>
                    )}

                    <form.Field
                        name="name"
                        validators={{
                            onChange: ({ value }) => {
                                const result =
                                    updateAgentSchema.shape.name.safeParse(
                                        value,
                                    );
                                return result.success
                                    ? undefined
                                    : result.error.issues[0]?.message;
                            },
                            onSubmit: ({ value }) => {
                                const result =
                                    updateAgentSchema.shape.name.safeParse(
                                        value,
                                    );
                                return result.success
                                    ? undefined
                                    : result.error.issues[0]?.message;
                            },
                        }}
                    >
                        {(field) => (
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor={field.name}>Name</Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => {
                                        field.handleChange(e.target.value);
                                        mutation.reset();
                                    }}
                                    aria-invalid={
                                        field.state.meta.errors.length > 0
                                    }
                                    autoFocus
                                />
                                {field.state.meta.errors.length > 0 && (
                                    <p className="text-xs text-destructive">
                                        {field.state.meta.errors[0]}
                                    </p>
                                )}
                            </div>
                        )}
                    </form.Field>

                    <form.Field
                        name="description"
                        validators={{
                            onChange: ({ value }) => {
                                const result =
                                    updateAgentSchema.shape.description.safeParse(
                                        value,
                                    );
                                return result.success
                                    ? undefined
                                    : result.error.issues[0]?.message;
                            },
                            onSubmit: ({ value }) => {
                                const result =
                                    updateAgentSchema.shape.description.safeParse(
                                        value,
                                    );
                                return result.success
                                    ? undefined
                                    : result.error.issues[0]?.message;
                            },
                        }}
                    >
                        {(field) => (
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor={field.name}>Detail</Label>
                                <textarea
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => {
                                        field.handleChange(e.target.value);
                                        mutation.reset();
                                    }}
                                    className={cn(
                                        "min-h-20 w-full rounded-md border border-input bg-transparent px-2.5 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
                                    )}
                                    aria-invalid={
                                        field.state.meta.errors.length > 0
                                    }
                                />
                                {field.state.meta.errors.length > 0 && (
                                    <p className="text-xs text-destructive">
                                        {field.state.meta.errors[0]}
                                    </p>
                                )}
                            </div>
                        )}
                    </form.Field>

                    <form.Field
                        name="webhook_uri"
                        validators={{
                            onChange: ({ value }) => {
                                const result =
                                    updateAgentSchema.shape.webhook_uri.safeParse(
                                        value,
                                    );
                                return result.success
                                    ? undefined
                                    : result.error.issues[0]?.message;
                            },
                            onSubmit: ({ value }) => {
                                const result =
                                    updateAgentSchema.shape.webhook_uri.safeParse(
                                        value,
                                    );
                                return result.success
                                    ? undefined
                                    : result.error.issues[0]?.message;
                            },
                        }}
                    >
                        {(field) => (
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor={field.name}>Webhook URI</Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => {
                                        field.handleChange(e.target.value);
                                        mutation.reset();
                                    }}
                                    placeholder="https://example.com/webhook"
                                    aria-invalid={
                                        field.state.meta.errors.length > 0
                                    }
                                />
                                {field.state.meta.errors.length > 0 && (
                                    <p className="text-xs text-destructive">
                                        {field.state.meta.errors[0]}
                                    </p>
                                )}
                            </div>
                        )}
                    </form.Field>

                    <form.Field name="is_active">
                        {(field) => (
                            <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => {
                                        field.handleChange(e.target.checked);
                                        mutation.reset();
                                    }}
                                    className="size-4 accent-primary"
                                />
                                Agent is active
                            </label>
                        )}
                    </form.Field>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>
                        <form.Subscribe
                            selector={(state) => [
                                state.canSubmit,
                                state.isSubmitting,
                            ]}
                        >
                            {([canSubmit, isSubmitting]) => (
                                <Button
                                    type="submit"
                                    disabled={
                                        !canSubmit ||
                                        isSubmitting ||
                                        mutation.isPending
                                    }
                                >
                                    {mutation.isPending ? "Saving..." : "Save"}
                                </Button>
                            )}
                        </form.Subscribe>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

const API_BASE_URL = import.meta.env.VITE_API_URL as string;

function useCopyState() {
    const [copied, setCopied] = useState(false);
    function copy(text: string) {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }
    return { copied, copy };
}

function ApiTab({ agentId }: { agentId: string }) {
    const endpointUrl = `${API_BASE_URL}/chat/${agentId}`;

    const curlSnippet = `curl --request POST \\
  --url ${endpointUrl} \\
  --header 'authorization: Bearer [your token here]' \\
  --header 'content-type: application/json' \\
  --header 'x-session-id: [existing session id]' \\
  --data '{
  "sessionId": "string",
  "chatInput": "apa yg bagus untuk dibeli di tahun 2025"
}'`;

    const curlCopy = useCopyState();
    const urlCopy = useCopyState();

    return (
        <div className="h-full overflow-y-auto px-6 py-6">
            <div className="max-w-2xl flex flex-col gap-6">
                <div>
                    <h2 className="text-base font-semibold mb-1">
                        Chat endpoint
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Send a{" "}
                        <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
                            POST
                        </code>{" "}
                        request to chat with this agent programmatically.
                        Replace{" "}
                        <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
                            [your token here]
                        </code>{" "}
                        with a valid API key. Include the{" "}
                        <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
                            x-session-id
                        </code>{" "}
                        header only when continuing an existing session; omit it
                        to start a new one.
                    </p>
                </div>

                {/* Endpoint URL row */}
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

                {/* cURL snippet */}
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
                                    <Check className="size-3.5 text-green-500" />{" "}
                                    Copied
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

function RouteComponent() {
    const { id } = Route.useParams();

    const {
        data: agent,
        isPending,
        isError,
    } = useQuery({
        queryKey: ["agents", id],
        queryFn: () => getAgent(id),
    });

    if (isPending) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                    Loading agent...
                </p>
            </div>
        );
    }

    if (isError || !agent) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                    Failed to load agent
                </p>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="px-6 py-4 bg-background border-b shrink-0 flex items-start gap-4">
                <div className="min-w-0 flex-1">
                    <h1 className="font-heading text-2xl font-semibold">
                        {agent.data.name}
                    </h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {agent.data.description}
                    </p>
                </div>
                <EditAgentDialog agent={agent.data} />
            </div>

            <Tabs
                defaultValue="chat"
                className="flex-1 grid grid-rows-[auto_1fr] overflow-hidden gap-0"
            >
                <div className="border-b">
                    <TabsList variant="line">
                        <TabsTrigger value="overview">
                            <LayoutGridIcon />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="persona">
                            <SmilePlusIcon />
                            Persona
                        </TabsTrigger>
                        <TabsTrigger value="knowledge">
                            <BookIcon />
                            Knowledges
                        </TabsTrigger>
                        <TabsTrigger value="mcp">
                            <PlugIcon />
                            MCPs
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

                <TabsContent value="persona" className="overflow-hidden">
                    <Persona agentId={id} />
                </TabsContent>
                <TabsContent value="overview" className="overflow-hidden">
                    <Overview agentId={id} />
                </TabsContent>
                <TabsContent value="knowledge" className="overflow-hidden">
                    <Knowledges agentId={id} />
                </TabsContent>
                <TabsContent value="mcp" className="overflow-hidden">
                    <Mcps agentId={id} />
                </TabsContent>
                <TabsContent value="chat" className="overflow-hidden">
                    <ChatSanbox agentId={id} agentName={agent.data.name} />
                </TabsContent>
                <TabsContent value="logs" className="overflow-y-auto">
                    <div className="p-6">
                        <LogsTable agentId={id} />
                    </div>
                </TabsContent>
                <TabsContent value="api" className="overflow-hidden">
                    <ApiTab agentId={id} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
