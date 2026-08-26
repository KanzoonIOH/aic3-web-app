import { getAgents, type Agent } from "@/api/agents";
import {
    createOrchestrator,
    deleteOrchestrator,
    getOrchestrators,
    type Orchestrator,
} from "@/api/orchestrators";
import { ListToolbar, type Option } from "@/components/list-toolbar";
import { TagsInput } from "@/components/tags-input";
import { Button } from "@/components/ui/button";
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
import { DataTablePaginationBar } from "@/components/ui/tanstack-table";
import { cn, resolveServerMessage, textareaClass } from "@/lib/utils";
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bot, Check, Network, Pencil, Plus, Search } from "lucide-react";
import { useState } from "react";
import { EditOrchestratorDialog } from "./$id";
import { EntityCard } from "../-EntityCard";

export const Route = createFileRoute("/admin/agents/orchestrator/")({
    component: RouteComponent,
});

// ---------- Agent avatar (shared visual with the garden) ----------

function AgentAvatar({
    name,
    image,
    className,
}: {
    name: string;
    image?: string | null;
    className?: string;
}) {
    const box = cn(
        "flex aspect-square items-center justify-center overflow-hidden rounded-lg border bg-primary/10 font-semibold text-primary",
        className,
    );
    if (image && /^https?:\/\//.test(image)) {
        return (
            <div className={box}>
                <img src={image} alt={name} className="size-full object-cover" />
            </div>
        );
    }
    if (image) return <div className={box}>{image}</div>;
    const parts = name.trim().split(/\s+/);
    const initial =
        parts.length === 1
            ? (parts[0][0] ?? "?").toUpperCase()
            : (parts[0][0] + parts[1][0]).toUpperCase();
    return <div className={box}>{initial}</div>;
}

// ---------- Agent multi-select (step 3) ----------

// ponytail: no checkbox component in the kit; a toggle button row is enough.
// Only agents with a non-empty template_id are eligible (endpoint == template_id).
function AgentPicker({
    selected,
    onToggle,
}: {
    selected: string[];
    onToggle: (id: string) => void;
}) {
    const [search, setSearch] = useState("");
    const { data, isPending } = useQuery({
        queryKey: ["agents", "picker", { search }],
        queryFn: () =>
            getAgents({ limit: 100, search: search || undefined }),
        placeholderData: keepPreviousData,
    });

    const agents = (data?.data ?? []).filter((a) => a.template_id);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <Label>Agents</Label>
                <span className="text-xs text-muted-foreground">
                    {selected.length} selected
                </span>
            </div>
            <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search agents..."
                    className="pl-8"
                />
            </div>
            <div className="max-h-64 overflow-y-auto rounded-lg border">
                {isPending ? (
                    <p className="p-4 text-center text-sm text-muted-foreground">
                        Loading agents...
                    </p>
                ) : agents.length === 0 ? (
                    <p className="p-4 text-center text-sm text-muted-foreground">
                        No eligible agents found
                    </p>
                ) : (
                    <ul className="divide-y">
                        {agents.map((agent: Agent) => {
                            const active = selected.includes(agent.id);
                            return (
                                <li key={agent.id}>
                                    <button
                                        type="button"
                                        onClick={() => onToggle(agent.id)}
                                        className={cn(
                                            "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50",
                                            active && "bg-primary/5",
                                        )}
                                    >
                                        <AgentAvatar
                                            name={agent.name}
                                            image={agent.image}
                                            className="size-9 text-sm"
                                        />
                                        <span className="flex min-w-0 flex-1 flex-col">
                                            <span className="truncate text-sm font-medium">
                                                {agent.name}
                                            </span>
                                            <span className="truncate text-xs text-muted-foreground">
                                                {agent.description ||
                                                    agent.template_id}
                                            </span>
                                        </span>
                                        <span
                                            className={cn(
                                                "flex size-5 shrink-0 items-center justify-center rounded-md border",
                                                active
                                                    ? "border-primary bg-primary text-primary-foreground"
                                                    : "border-input",
                                            )}
                                        >
                                            {active && (
                                                <Check className="size-3.5" />
                                            )}
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}

// ---------- Create drawer ----------

function CreateOrchestratorDrawer({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const direction = useResponsiveDrawerDirection();
    const queryClient = useQueryClient();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [isActive, setIsActive] = useState(true);
    const [agentIds, setAgentIds] = useState<string[]>([]);

    const mutation = useMutation({
        mutationFn: createOrchestrator,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orchestrators"] });
            handleClose();
        },
    });

    function handleClose() {
        setName("");
        setDescription("");
        setTags([]);
        setIsActive(true);
        setAgentIds([]);
        mutation.reset();
        onClose();
    }

    const canSubmit = name.trim().length > 0 && agentIds.length > 0;

    return (
        <Drawer
            open={open}
            onOpenChange={(o) => {
                if (!o) handleClose();
            }}
            direction={direction}
        >
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>Create Orchestrator</DrawerTitle>
                    <DrawerDescription>
                        Name it, then choose the agents it can route to.
                    </DrawerDescription>
                </DrawerHeader>

                <div className="overflow-y-auto px-4">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!canSubmit) return;
                            mutation.mutate({
                                name: name.trim(),
                                description: description.trim() || null,
                                is_active: isActive,
                                tags,
                                agent_ids: agentIds,
                            });
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
                                placeholder="Travel Concierge"
                                autoFocus
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="orch-desc">Description</Label>
                            <textarea
                                id="orch-desc"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Optional description"
                                className={textareaClass}
                            />
                        </div>

                        <TagsInput value={tags} onChange={setTags} />

                        <label className="flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5">
                            <span className="flex flex-col">
                                <span className="text-sm font-medium">
                                    Active
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    Inactive orchestrators can't be called via
                                    API key.
                                </span>
                            </span>
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="size-4 accent-primary"
                            />
                        </label>

                        <AgentPicker
                            selected={agentIds}
                            onToggle={(id) =>
                                setAgentIds((prev) =>
                                    prev.includes(id)
                                        ? prev.filter((x) => x !== id)
                                        : [...prev, id],
                                )
                            }
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
                        <Button
                            type="button"
                            className="flex-1"
                            disabled={!canSubmit || mutation.isPending}
                            onClick={() =>
                                canSubmit &&
                                mutation.mutate({
                                    name: name.trim(),
                                    description: description.trim() || null,
                                    is_active: isActive,
                                    tags,
                                    agent_ids: agentIds,
                                })
                            }
                        >
                            {mutation.isPending ? "Creating..." : "Create"}
                        </Button>
                    </div>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}

function CreateOrchestratorButton() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button size="sm" onClick={() => setOpen(true)}>
                <Plus className="size-3.5" />
                Create Orchestrator
            </Button>
            <CreateOrchestratorDrawer
                open={open}
                onClose={() => setOpen(false)}
            />
        </>
    );
}

// ---------- Card ----------

function OrchestratorCard({ orchestrator }: { orchestrator: Orchestrator }) {
    const navigate = useNavigate();
    return (
        <EntityCard
            name={orchestrator.name}
            description={orchestrator.description}
            image={orchestrator.image}
            isActive={orchestrator.is_active}
            invalidateKey={["orchestrators"]}
            onDelete={() => deleteOrchestrator(orchestrator.id)}
            onOpen={() =>
                navigate({
                    to: "/admin/agents/orchestrator/$id",
                    params: { id: orchestrator.id },
                })
            }
            editTrigger={
                <EditOrchestratorDialog
                    orch={orchestrator}
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
            }
            footer={
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Bot className="size-3.5" />
                    {orchestrator.agents_count} agents
                </span>
            }
        />
    );
}

// ---------- Page ----------

const LIMIT = 12;

const SORTS: Option[] = [
    { label: "Newest", value: "created_desc" },
    { label: "Oldest", value: "created_asc" },
    { label: "Recently updated", value: "modified_desc" },
    { label: "Name (A–Z)", value: "name_asc" },
    { label: "Name (Z–A)", value: "name_desc" },
    { label: "Active first", value: "is_active_asc" },
    { label: "Inactive first", value: "is_active_desc" },
];

const STATUS: Option[] = [
    { label: "Active", value: "true" },
    { label: "Inactive", value: "false" },
];

function RouteComponent() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("");
    const [status, setStatus] = useState("");

    const {
        data: orchestrators,
        isPending,
        isError,
        isFetching,
    } = useQuery({
        queryKey: ["orchestrators", { page, search, sort, status }],
        queryFn: () =>
            getOrchestrators({
                offset: page - 1,
                limit: LIMIT,
                search: search || undefined,
                sort: sort || undefined,
                is_active: status === "" ? undefined : status === "true",
            }),
        placeholderData: keepPreviousData,
    });
    const pagination = orchestrators?.pagination;

    function resetTo<T>(setter: (v: T) => void) {
        return (v: T) => {
            setter(v);
            setPage(1);
        };
    }

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                <div className="sticky top-0 flex flex-wrap items-start gap-4 border-b bg-background px-6 py-4">
                    <div>
                        <h1 className="font-heading text-2xl font-semibold">
                            Agent Orchestrators
                        </h1>
                        <p className="mt-0.5 flex gap-2 text-sm text-muted-foreground">
                            Route conversations across a team of agents.
                        </p>
                    </div>
                </div>

                <div className="space-y-4 p-6">
                    <ListToolbar
                        search={search}
                        onSearchChange={resetTo(setSearch)}
                        searchPlaceholder="Search orchestrators..."
                        filters={[
                            {
                                label: "Status",
                                value: status,
                                options: STATUS,
                                onChange: resetTo(setStatus),
                                allLabel: "All statuses",
                            },
                        ]}
                        sort={{
                            label: "Sort",
                            value: sort,
                            options: SORTS,
                            onChange: resetTo(setSort),
                        }}
                        action={<CreateOrchestratorButton />}
                    />

                    {isPending ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-16">
                            <p className="text-sm text-muted-foreground">
                                Loading orchestrators...
                            </p>
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
                            <Network className="size-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">
                                Failed to load orchestrators
                            </p>
                        </div>
                    ) : orchestrators.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
                            <Network className="size-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">
                                No orchestrators found
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {orchestrators.data.map((o) => (
                                    <OrchestratorCard
                                        key={o.id}
                                        orchestrator={o}
                                    />
                                ))}
                            </div>
                            <DataTablePaginationBar
                                page={page}
                                totalPage={pagination?.total_page ?? 1}
                                totalRow={pagination?.total_row ?? 0}
                                onPageChange={setPage}
                                disabled={isFetching}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
