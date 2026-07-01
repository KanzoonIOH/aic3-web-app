import { createAgent, getAgents, type Agent } from "@/api/agents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { resolveServerMessage, textareaClass } from "@/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookIcon, Bot, Pencil, Plug, Plus } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { EditAgentDialog } from "./$id";

export const Route = createFileRoute("/(main)/agents/")({
    component: RouteComponent,
});

// ---------- Schema ----------

const createAgentSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    description: z.string().trim(),
    webhook_uri: z.string().trim().url("Webhook URI must be a valid URL"),
});

type CreateAgentValues = z.infer<typeof createAgentSchema>;

// ---------- Create Agent dialog ----------

function CreateAgentDialog() {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: createAgent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["agents"] });
            setOpen(false);
            form.reset();
        },
    });

    const form = useForm({
        defaultValues: {
            name: "",
            description: "",
            webhook_uri: "",
        } satisfies CreateAgentValues,
        onSubmit: async ({ value }) => {
            const result = createAgentSchema.safeParse(value);
            if (!result.success) return;
            await mutation.mutateAsync(result.data);
        },
    });

    function handleOpenChange(nextOpen: boolean) {
        setOpen(nextOpen);
        if (!nextOpen) {
            mutation.reset();
            form.reset();
        }
    }

    const fieldValidator =
        (key: keyof CreateAgentValues) =>
        ({ value }: { value: string }) => {
            const r = createAgentSchema.shape[key].safeParse(value);
            return r.success ? undefined : r.error.issues[0]?.message;
        };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="size-3.5" />
                    Create Agent
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Agent</DialogTitle>
                    <DialogDescription>
                        Add a new agent to your workspace.
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
                            onChange: fieldValidator("name"),
                            onSubmit: fieldValidator("name"),
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
                                    placeholder="My Agent"
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

                    <form.Field name="description">
                        {(field) => (
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor={field.name}>Description</Label>
                                <textarea
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => {
                                        field.handleChange(e.target.value);
                                        mutation.reset();
                                    }}
                                    placeholder="Optional description"
                                    className={textareaClass}
                                />
                            </div>
                        )}
                    </form.Field>

                    <form.Field
                        name="webhook_uri"
                        validators={{
                            onChange: fieldValidator("webhook_uri"),
                            onSubmit: fieldValidator("webhook_uri"),
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
                                    {mutation.isPending
                                        ? "Creating..."
                                        : "Create"}
                                </Button>
                            )}
                        </form.Subscribe>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function AgentInitialsAvatar({ name }: { name: string }) {
    const parts = name.trim().split(/\s+/);
    const initial =
        parts.length === 1
            ? parts[0][0].toUpperCase()
            : (parts[0][0] + parts[1][0]).toUpperCase();
    return (
        <div className="flex aspect-square size-14 items-center justify-center rounded-xl border bg-primary/10 text-xl font-semibold text-primary mb-auto">
            {initial}
        </div>
    );
}

function AgentCard({ agent }: { agent: Agent }) {
    const navigate = useNavigate();
    return (
        <Card
            role="button"
            tabIndex={0}
            onClick={() =>
                navigate({ to: "/agents/$id", params: { id: agent.id } })
            }
            onKeyDown={(e) => {
                // ponytail: only the focused card handles keys; ignore keys bubbling from children (dialog inputs)
                if (e.target !== e.currentTarget) return;
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate({ to: "/agents/$id", params: { id: agent.id } });
                }
            }}
            className="flex cursor-pointer flex-col gap-3 rounded-xl bg-inherit p-4 transition-colors hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <AgentInitialsAvatar name={agent.name} />
                    <Badge
                        variant={agent.is_active ? "outline" : "secondary"}
                        className="w-fit mb-auto"
                    >
                        {agent.is_active && (
                            <span className="relative flex size-2">
                                <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-75" />
                                <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                            </span>
                        )}
                        {agent.is_active ? "Active" : "Inactive"}
                    </Badge>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                    <EditAgentDialog
                        agent={agent}
                        trigger={
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground"
                            >
                                <Pencil className="size-3.5" />
                                Edit
                            </Button>
                        }
                    />
                </div>
            </div>

            <span className="line-clamp-2 text-xl font-semibold">
                {agent.name}
            </span>

            <p className="max-h-[4.5rem] overflow-y-auto text-sm leading-relaxed text-muted-foreground">
                {agent.description}
            </p>

            <div className="flex gap-4 pt-1 mt-auto">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <BookIcon className="size-3.5" />
                    {agent.knowledges_count}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Plug className="size-3.5" />
                    {agent.mcps_count}
                </span>
            </div>
        </Card>
    );
}

function RouteComponent() {
    const {
        data: agents,
        isPending,
        isError,
    } = useQuery({
        queryKey: ["agents"],
        queryFn: getAgents,
    });

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                <div className="sticky top-0 px-6 py-4 flex flex-wrap items-start gap-4 bg-background border-b">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            All Agents
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground flex gap-2"></p>
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <CreateAgentDialog />
                    </div>
                </div>

                <div className="p-6">
                    {isPending ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-16">
                            <p className="text-sm text-muted-foreground">
                                Loading agents...
                            </p>
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
                            <Bot className="size-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">
                                Failed to load agents
                            </p>
                        </div>
                    ) : agents.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
                            <Bot className="size-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">
                                No agents found
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {agents.data.map((agent) => (
                                <AgentCard key={agent.id} agent={agent} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
