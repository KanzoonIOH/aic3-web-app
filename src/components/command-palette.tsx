import { getAgents } from "@/api/agents";
import { getKnowledges } from "@/api/knowledges";
import { getMcps } from "@/api/mcps";
import { getOrchestrators } from "@/api/orchestrators";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { navGroups } from "@/routes/(main)/-nav";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { BookOpen, Bot, Network, Plug } from "lucide-react";
import { useEffect, useState } from "react";

// Flatten navGroups (incl. nested Agents children) into jump targets.
// Typed as plain strings so the `as const` route-literal union doesn't fight
// flatMap; navigate() takes a string path fine.
type NavTarget = { to: string; label: string };
const navTargets: NavTarget[] = navGroups.flatMap((group) =>
    group.items.flatMap((item): NavTarget[] =>
        "children" in item
            ? item.children.map((c) => ({ to: c.to, label: c.label }))
            : [{ to: item.to, label: item.label }],
    ),
);

const ENTITY_LIMIT = 5;

export function CommandPalette({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");

    // Debounce the typed query before hitting the API (matches list-toolbar).
    const [debounced, setDebounced] = useState("");
    useEffect(() => {
        const t = setTimeout(() => setDebounced(query), 300);
        return () => clearTimeout(t);
    }, [query]);

    // Clear the query when the palette closes so it opens fresh next time.
    function handleOpenChange(next: boolean) {
        if (!next) setQuery("");
        onOpenChange(next);
    }

    const hasQuery = debounced.trim().length > 0;
    const enabled = open && hasQuery;

    const agents = useQuery({
        queryKey: ["palette", "agents", debounced],
        queryFn: () => getAgents({ search: debounced, limit: ENTITY_LIMIT }),
        enabled,
        select: (r) => r.data,
    });
    const orchestrators = useQuery({
        queryKey: ["palette", "orchestrators", debounced],
        queryFn: () =>
            getOrchestrators({ search: debounced, limit: ENTITY_LIMIT }),
        enabled,
        select: (r) => r.data,
    });
    const knowledges = useQuery({
        queryKey: ["palette", "knowledges", debounced],
        queryFn: () =>
            getKnowledges({ search: debounced, limit: ENTITY_LIMIT }),
        enabled,
        select: (r) => r.data,
    });
    const mcps = useQuery({
        queryKey: ["palette", "mcps", debounced],
        queryFn: () => getMcps({ search: debounced, limit: ENTITY_LIMIT }),
        enabled,
        select: (r) => r.data,
    });

    function go(to: string) {
        handleOpenChange(false);
        navigate({ to });
    }

    return (
        <CommandDialog
            open={open}
            onOpenChange={handleOpenChange}
            // Entity results are already filtered server-side; don't re-filter
            // them out. Nav items are matched manually below via the query.
            shouldFilter={false}
        >
            <CommandInput
                placeholder="Search menus, agents, knowledge, MCPs..."
                value={query}
                onValueChange={setQuery}
            />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>

                <CommandGroup heading="Go to">
                    {navTargets
                        .filter((t) =>
                            t.label
                                .toLowerCase()
                                .includes(query.trim().toLowerCase()),
                        )
                        .map((t) => (
                            <CommandItem
                                key={t.to}
                                value={`nav:${t.label}`}
                                onSelect={() => go(t.to)}
                            >
                                {t.label}
                            </CommandItem>
                        ))}
                </CommandGroup>

                {hasQuery && agents.data && agents.data.length > 0 && (
                    <CommandGroup heading="Agents">
                        {agents.data.map((a) => (
                            <CommandItem
                                key={a.id}
                                value={`agent:${a.id}`}
                                onSelect={() =>
                                    navigate({
                                        to: "/agents/garden/$id",
                                        params: { id: a.id },
                                    }).then(() => handleOpenChange(false))
                                }
                            >
                                <Bot />
                                {a.name}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {hasQuery &&
                    orchestrators.data &&
                    orchestrators.data.length > 0 && (
                        <CommandGroup heading="Orchestrators">
                            {orchestrators.data.map((o) => (
                                <CommandItem
                                    key={o.id}
                                    value={`orch:${o.id}`}
                                    onSelect={() =>
                                        navigate({
                                            to: "/agents/orchestrator/$id",
                                            params: { id: o.id },
                                        }).then(() => handleOpenChange(false))
                                    }
                                >
                                    <Network />
                                    {o.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                {hasQuery && knowledges.data && knowledges.data.length > 0 && (
                    <CommandGroup heading="Knowledges">
                        {knowledges.data.map((k) => (
                            <CommandItem
                                key={k.id}
                                value={`know:${k.id}`}
                                // No knowledge detail route: land on the list.
                                onSelect={() => go("/knowledges")}
                            >
                                <BookOpen />
                                {k.name}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {hasQuery && mcps.data && mcps.data.length > 0 && (
                    <CommandGroup heading="MCPs">
                        {mcps.data.map((m) => (
                            <CommandItem
                                key={m.id}
                                value={`mcp:${m.id}`}
                                // No MCP detail route: land on the list.
                                onSelect={() => go("/mcps")}
                            >
                                <Plug />
                                {m.name}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}
            </CommandList>
        </CommandDialog>
    );
}
