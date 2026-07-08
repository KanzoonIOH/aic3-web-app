import {
    createAgent,
    deleteAgent,
    getAgents,
    type Agent,
    type BodyField,
} from "@/api/agents";
import {
    BodyFieldsEditor,
    cleanBodyFields,
} from "@/components/body-fields-editor";
import { AvatarPicker } from "@/components/avatar-picker";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { TagsInput } from "@/components/tags-input";
import { tagChipStyle } from "@/lib/tag-color";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    useResponsiveDrawerDirection,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, resolveServerMessage, textareaClass } from "@/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
    ArrowLeft,
    ArrowRight,
    BookIcon,
    Bot,
    LayoutTemplate,
    Pencil,
    Plug,
    Plus,
    SparklesIcon,
    Trash2,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { EditAgentDialog } from "./$id";
import { AGENT_TEMPLATES, type AgentTemplate } from "./-agent-templates";

export const Route = createFileRoute("/(main)/agents/")({
    component: RouteComponent,
});

// ---------- Schema ----------

const createAgentSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    description: z.string().trim(),
    guardrail: z.string().trim(),
    webhook_uri: z.string().trim().url("Webhook URI must be a valid URL"),
    webhook_input_field: z.string().trim(),
    webhook_output_field: z.string().trim(),
});

type CreateAgentValues = z.infer<typeof createAgentSchema>;

const EMPTY_CREATE_VALUES: CreateAgentValues = {
    name: "",
    description: "",
    guardrail: "",
    webhook_uri: "",
    webhook_input_field: "",
    webhook_output_field: "",
};

function templateToValues(t: AgentTemplate): CreateAgentValues {
    return {
        name: t.name,
        description: t.description,
        guardrail: t.guardrail,
        webhook_uri: t.webhook_uri,
        webhook_input_field: t.webhook_input_field,
        webhook_output_field: t.webhook_output_field,
    };
}

// ponytail: derive collection name from agent name; backend appends a unique
// suffix so slug collisions are fine.
function autoMilvusCollection(name: string): string {
    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
    return `agent_${slug || "kb"}`;
}

// ---------- Create Agent: choice + template picker ----------

// Two-step entry point. Click "Create Agent" → choose "Make my own" (blank
// form drawer) or "From template" (pick one → creates immediately → opens its
// detail page).
function CreateAgentButton() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [choiceOpen, setChoiceOpen] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    // null = drawer closed; otherwise the prefill values for the create form.
    const [prefill, setPrefill] = useState<CreateAgentValues | null>(null);
    // bump on each open so the drawer remounts with fresh form defaults.
    const [drawerKey, setDrawerKey] = useState(0);

    const templateMutation = useMutation({
        mutationFn: (t: AgentTemplate) =>
            createAgent({
                ...templateToValues(t),
                milvus_collection: autoMilvusCollection(t.name),
                webhook_body_fields: [],
                webhook_header_fields: [],
                tags: [],
            }),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["agents"] });
            setChoiceOpen(false);
            setShowTemplates(false);
            navigate({ to: "/agents/$id", params: { id: res.data.id } });
        },
    });

    function startScratch() {
        setChoiceOpen(false);
        setShowTemplates(false);
        setDrawerKey((k) => k + 1);
        setPrefill(EMPTY_CREATE_VALUES);
    }

    return (
        <>
            <Dialog
                open={choiceOpen}
                onOpenChange={(o) => {
                    if (templateMutation.isPending) return;
                    setChoiceOpen(o);
                    if (!o) {
                        setShowTemplates(false);
                        templateMutation.reset();
                    }
                }}
            >
                <DialogTrigger asChild>
                    <Button size="sm">
                        <Plus className="size-3.5" />
                        Create Agent
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                    {!showTemplates ? (
                        <>
                            <DialogHeader>
                                <DialogTitle>Create Agent</DialogTitle>
                                <DialogDescription>
                                    Start from scratch or pick a ready-made
                                    template.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col gap-3">
                                {/* Hero: From template — the recommended path */}
                                <button
                                    type="button"
                                    onClick={() => setShowTemplates(true)}
                                    className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 via-primary/5 to-background p-5 text-left shadow-sm shadow-primary/10 ring-1 ring-primary/10 transition-all hover:-translate-y-0.5 hover:border-primary/70 hover:shadow-lg hover:shadow-primary/20"
                                >
                                    <Shine />
                                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-inner ring-1 ring-primary/30">
                                        <LayoutTemplate className="size-6" />
                                    </span>
                                    <span className="flex min-w-0 flex-col gap-0.5">
                                        <span className="flex items-center gap-2">
                                            <span className="text-base font-semibold">
                                                Start from a template
                                            </span>
                                            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                                                Recommended
                                            </span>
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            Pick a pre-configured agent —
                                            created instantly and ready to use
                                            in one click.
                                        </span>
                                    </span>
                                    <ArrowRight className="ml-auto size-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
                                </button>

                                {/* Secondary: Make my own */}
                                <button
                                    type="button"
                                    onClick={startScratch}
                                    className="group relative flex items-center gap-3 overflow-hidden rounded-xl border bg-background p-3.5 text-left transition-all hover:border-primary/40 hover:bg-muted/40"
                                >
                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border">
                                        <SparklesIcon className="size-4" />
                                    </span>
                                    <span className="flex min-w-0 flex-col">
                                        <span className="text-sm font-medium">
                                            Make my own
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            Start blank and configure everything
                                            yourself.
                                        </span>
                                    </span>
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowTemplates(false)}
                                        className="text-muted-foreground hover:text-foreground"
                                        aria-label="Back"
                                        disabled={templateMutation.isPending}
                                    >
                                        <ArrowLeft className="size-4" />
                                    </button>
                                    Choose a template
                                </DialogTitle>
                                <DialogDescription>
                                    Pick one to create it instantly — you can
                                    fine-tune everything afterwards.
                                </DialogDescription>
                            </DialogHeader>
                            {templateMutation.isError && (
                                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                    {resolveServerMessage(
                                        templateMutation.error,
                                    )}
                                </p>
                            )}
                            <div className="grid max-h-[60vh] gap-3 overflow-y-auto sm:grid-cols-2">
                                {AGENT_TEMPLATES.map((t) => {
                                    const Icon = t.icon;
                                    const pending =
                                        templateMutation.isPending &&
                                        templateMutation.variables?.id === t.id;
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            disabled={
                                                templateMutation.isPending
                                            }
                                            onClick={() =>
                                                templateMutation.mutate(t)
                                            }
                                            className="group relative flex flex-col gap-2 overflow-hidden rounded-xl border bg-gradient-to-br from-muted/40 to-background p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md hover:shadow-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <Shine />
                                            <span
                                                className={cn(
                                                    "flex size-9 items-center justify-center rounded-lg ring-1",
                                                    t.accent,
                                                )}
                                            >
                                                <Icon className="size-4" />
                                            </span>
                                            <span className="text-sm font-medium">
                                                {t.name}
                                            </span>
                                            <span className="line-clamp-3 text-xs text-muted-foreground">
                                                {t.description}
                                            </span>
                                            {pending && (
                                                <span className="text-xs font-medium text-primary">
                                                    Creating…
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="border-t pt-3 text-center text-xs text-muted-foreground">
                                Looking for more? Browse the{" "}
                                <a
                                    href="#"
                                    className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
                                >
                                    template market
                                </a>{" "}
                                or{" "}
                                <a
                                    href="#"
                                    className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
                                >
                                    request a template
                                </a>
                                .
                            </p>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <CreateAgentDrawer
                key={drawerKey}
                prefill={prefill}
                onClose={() => setPrefill(null)}
            />
        </>
    );
}

// A soft diagonal sheen that sweeps across on hover.
function Shine() {
    return (
        <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full dark:via-white/10"
        />
    );
}

// ---------- Create Agent drawer (the actual form) ----------

// Controlled by CreateAgentButton: open iff prefill !== null.
function CreateAgentDrawer({
    prefill,
    onClose,
}: {
    prefill: CreateAgentValues | null;
    onClose: () => void;
}) {
    const direction = useResponsiveDrawerDirection();
    const [bodyFields, setBodyFields] = useState<BodyField[]>([]);
    const [headerFields, setHeaderFields] = useState<BodyField[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [image, setImage] = useState("");
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: createAgent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["agents"] });
            setBodyFields([]);
            setHeaderFields([]);
            setTags([]);
            setImage("");
            onClose();
        },
    });

    const form = useForm({
        defaultValues: prefill ?? EMPTY_CREATE_VALUES,
        onSubmit: async ({ value }) => {
            const result = createAgentSchema.safeParse(value);
            if (!result.success) return;
            await mutation.mutateAsync({
                ...result.data,
                milvus_collection: autoMilvusCollection(result.data.name),
                webhook_body_fields: cleanBodyFields(bodyFields),
                webhook_header_fields: cleanBodyFields(headerFields),
                tags,
                image: image || null,
            });
        },
    });

    function handleOpenChange(nextOpen: boolean) {
        if (!nextOpen) {
            mutation.reset();
            form.reset();
            setBodyFields([]);
            setHeaderFields([]);
            setTags([]);
            setImage("");
            onClose();
        }
    }

    const fieldValidator =
        (key: keyof CreateAgentValues) =>
        ({ value }: { value: string }) => {
            const r = createAgentSchema.shape[key].safeParse(value);
            return r.success ? undefined : r.error.issues[0]?.message;
        };

    return (
        <Drawer
            open={prefill !== null}
            onOpenChange={handleOpenChange}
            direction={direction}
        >
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>Create Agent</DrawerTitle>
                    <DrawerDescription>
                        Add a new agent to your workspace.
                    </DrawerDescription>
                </DrawerHeader>

                <div className="overflow-y-auto px-4">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            form.handleSubmit();
                        }}
                        className="flex flex-col gap-4 pb-4"
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

                        <AvatarPicker
                            value={image}
                            onChange={setImage}
                            name={form.state.values.name}
                        />

                        <form.Field name="description">
                            {(field) => (
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor={field.name}>
                                        Description
                                    </Label>
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

                        <form.Field name="guardrail">
                            {(field) => (
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor={field.name}>
                                        Guardrail
                                    </Label>
                                    <textarea
                                        id={field.name}
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => {
                                            field.handleChange(e.target.value);
                                            mutation.reset();
                                        }}
                                        placeholder="Hard rules the agent must always follow. You can edit this later in the Persona & Guardrail tab."
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
                                    <Label htmlFor={field.name}>
                                        Webhook URI
                                    </Label>
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

                        <div className="grid grid-cols-2 gap-3">
                            <form.Field name="webhook_input_field">
                                {(field) => (
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor={field.name}>
                                            Input field
                                        </Label>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => {
                                                field.handleChange(
                                                    e.target.value,
                                                );
                                                mutation.reset();
                                            }}
                                            placeholder="chatInput"
                                        />
                                    </div>
                                )}
                            </form.Field>
                            <form.Field name="webhook_output_field">
                                {(field) => (
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor={field.name}>
                                            Output field
                                        </Label>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => {
                                                field.handleChange(
                                                    e.target.value,
                                                );
                                                mutation.reset();
                                            }}
                                            placeholder="output"
                                        />
                                    </div>
                                )}
                            </form.Field>
                        </div>

                        <BodyFieldsEditor
                            rows={bodyFields}
                            onChange={(r) => {
                                setBodyFields(r);
                                mutation.reset();
                            }}
                        />

                        <BodyFieldsEditor
                            rows={headerFields}
                            onChange={(r) => {
                                setHeaderFields(r);
                                mutation.reset();
                            }}
                            label="Webhook auth / headers"
                            description="HTTP headers sent to the agent. Static for a fixed value (e.g. Authorization: Bearer xxx); dynamic is provided per request. Leave empty for an open agent."
                            keyPlaceholder="Header name (e.g. Authorization)"
                            addLabel="Add header"
                        />

                        <TagsInput
                            value={tags}
                            onChange={(t) => {
                                setTags(t);
                                mutation.reset();
                            }}
                        />
                    </form>
                </div>

                <DrawerFooter>
                    <div className="flex gap-2">
                        <DrawerClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </DrawerClose>
                        <form.Subscribe
                            selector={(state) => [
                                state.canSubmit,
                                state.isSubmitting,
                            ]}
                        >
                            {([canSubmit, isSubmitting]) => (
                                <Button
                                    type="submit"
                                    className="flex-1"
                                    disabled={
                                        !canSubmit ||
                                        isSubmitting ||
                                        mutation.isPending
                                    }
                                    onClick={() => form.handleSubmit()}
                                >
                                    {mutation.isPending
                                        ? "Creating..."
                                        : "Create"}
                                </Button>
                            )}
                        </form.Subscribe>
                    </div>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}

function AgentInitialsAvatar({
    name,
    image,
}: {
    name: string;
    image?: string | null;
}) {
    const box =
        "flex aspect-square size-14 items-center justify-center overflow-hidden rounded-xl border bg-primary/10 text-xl font-semibold text-primary";
    if (image && /^https?:\/\//.test(image)) {
        return (
            <div className={box}>
                <img
                    src={image}
                    alt={name}
                    className="size-full object-cover"
                />
            </div>
        );
    }
    if (image) {
        return <div className={box}>{image}</div>;
    }
    const parts = name.trim().split(/\s+/);
    const initial =
        parts.length === 1
            ? parts[0][0].toUpperCase()
            : (parts[0][0] + parts[1][0]).toUpperCase();
    return <div className={box}>{initial}</div>;
}

function AgentCard({ agent }: { agent: Agent }) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [deleteOpen, setDeleteOpen] = useState(false);

    const remove = useMutation({
        mutationFn: () => deleteAgent(agent.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["agents"] });
            setDeleteOpen(false);
        },
    });

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
            <div className="flex items-center justify-between">
                <div className="flex items-stretch gap-3">
                    <AgentInitialsAvatar name={agent.name} image={agent.image} />
                    <div className="flex h-14 flex-col justify-between">
                        <Badge
                            variant={agent.is_active ? "outline" : "secondary"}
                            className="w-fit"
                        >
                            {agent.is_active && (
                                <span className="relative flex size-2">
                                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-75" />
                                    <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                                </span>
                            )}
                            {agent.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {agent.tags && agent.tags.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <span
                                    className="max-w-[8rem] truncate rounded-full border px-2 py-0.5 text-xs"
                                    style={tagChipStyle(agent.tags[0].color)}
                                >
                                    {agent.tags[0].name}
                                </span>
                                {agent.tags.length > 1 && (
                                    <span className="text-xs text-muted-foreground">
                                        +{agent.tags.length - 1}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 opacity-0 transition-opacity group-hover/card:opacity-100 focus-within:opacity-100"
                >
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
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Delete agent"
                        onClick={() => setDeleteOpen(true)}
                    >
                        <Trash2 className="size-3.5" />
                    </Button>

                    {/* Rendered inside the stopPropagation wrapper: Radix
                        portals bubble React events to their tree parent (the
                        Card), which would navigate to the detail page. */}
                    <ConfirmDeleteDialog
                        open={deleteOpen}
                        onOpenChange={setDeleteOpen}
                        onConfirm={() => remove.mutate()}
                        isPending={remove.isPending}
                        title="Delete agent?"
                        name={agent.name}
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

    const [activeTagIds, setActiveTagIds] = useState<string[]>([]);

    // Distinct tags across all agents, keyed by id (so rename/color reflect here).
    const allTags = agents
        ? Object.values(
              Object.fromEntries(
                  agents.data
                      .flatMap((a) => a.tags ?? [])
                      .map((t) => [t.id, t] as const),
              ),
          ).sort((a, b) => a.name.localeCompare(b.name))
        : [];

    // Match ANY: keep agents that carry at least one selected tag.
    const visibleAgents = agents
        ? activeTagIds.length === 0
            ? agents.data
            : agents.data.filter((a) =>
                  (a.tags ?? []).some((t) => activeTagIds.includes(t.id)),
              )
        : [];

    function toggleTag(id: string) {
        setActiveTagIds((prev) =>
            prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
        );
    }

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
                        <CreateAgentButton />
                    </div>
                </div>

                {allTags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 px-6 pt-4">
                        <span className="mr-1 text-xs text-muted-foreground">
                            Filter by tag:
                        </span>
                        {allTags.map((tag) => {
                            const active = activeTagIds.includes(tag.id);
                            return (
                                <button
                                    key={tag.id}
                                    type="button"
                                    onClick={() => toggleTag(tag.id)}
                                    className="rounded-full border px-2.5 py-0.5 text-xs transition-opacity hover:opacity-80"
                                    style={
                                        active
                                            ? {
                                                  backgroundColor: tag.color,
                                                  borderColor: tag.color,
                                                  color: "#fff",
                                              }
                                            : tagChipStyle(tag.color)
                                    }
                                >
                                    {tag.name}
                                </button>
                            );
                        })}
                        {activeTagIds.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setActiveTagIds([])}
                                className="ml-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                )}

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
                    ) : visibleAgents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
                            <Bot className="size-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">
                                No agents found
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {visibleAgents.map((agent) => (
                                <AgentCard key={agent.id} agent={agent} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
