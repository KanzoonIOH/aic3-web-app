import { getMcp, getMcpTools, type McpTool } from "@/api/mcps";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, Wrench } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/(main)/mcps/$id")({
    component: RouteComponent,
});

// ---------- Helpers ----------

function CopyButton({ value }: { value: string }) {
    const [copied, setCopied] = useState(false);

    function handleCopy() {
        navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    }

    return (
        <Button
            variant="ghost"
            size="icon-xs"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
            aria-label="Copy"
        >
            {copied ? (
                <Check className="size-3 text-green-500" />
            ) : (
                <Copy className="size-3" />
            )}
        </Button>
    );
}

// ---------- Tool card ----------

function ToolCard({ tool }: { tool: McpTool }) {
    const properties = tool.input_schema?.properties ?? {};
    const required = new Set(tool.input_schema?.required ?? []);
    const paramNames = Object.keys(properties);

    return (
        <div className="rounded-lg border p-4 flex flex-col gap-3">
            <div className="flex items-start gap-2">
                <Wrench className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-medium">
                        {tool.name}
                    </p>
                    {tool.description && (
                        <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">
                            {tool.description}
                        </p>
                    )}
                </div>
            </div>

            {paramNames.length > 0 && (
                <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                        Parameters
                    </p>
                    <div className="flex flex-col gap-2">
                        {paramNames.map((name) => {
                            const prop = properties[name];
                            return (
                                <div
                                    key={name}
                                    className="rounded-md border bg-muted/30 px-3 py-2"
                                >
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-mono text-xs font-medium">
                                            {name}
                                        </span>
                                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                                            {prop.enum
                                                ? prop.enum.join(" | ")
                                                : (prop.type ?? "any")}
                                        </span>
                                        {required.has(name) && (
                                            <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                                                required
                                            </span>
                                        )}
                                    </div>
                                    {prop.description && (
                                        <p className="mt-1 text-xs text-muted-foreground whitespace-pre-line">
                                            {prop.description}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// ---------- Route ----------

function RouteComponent() {
    const { id } = Route.useParams();

    const {
        data: mcp,
        isPending,
        isError,
    } = useQuery({
        queryKey: ["mcps", id],
        queryFn: () => getMcp(id),
    });

    const {
        data: tools,
        isPending: toolsPending,
        isError: toolsError,
    } = useQuery({
        queryKey: ["mcps", id, "tools"],
        queryFn: () => getMcpTools(id),
    });

    if (isPending) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading MCP...</p>
            </div>
        );
    }

    if (isError || !mcp) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                    Failed to load MCP
                </p>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                <div className="sticky top-0 px-6 py-4 bg-background border-b">
                    <h1 className="font-heading text-2xl font-semibold">
                        {mcp.data.name}
                    </h1>
                    {mcp.data.description && (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {mcp.data.description}
                        </p>
                    )}
                </div>

                <div className="p-6 flex flex-col gap-6">
                    {mcp.data.uri && (
                        <div className="rounded-lg border p-4">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                                URI
                            </p>
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-mono break-all">
                                    {mcp.data.uri}
                                </p>
                                <CopyButton value={mcp.data.uri} />
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-semibold">Tools</h2>
                            {tools && (
                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                    {tools.data.length}
                                </span>
                            )}
                        </div>

                        {toolsPending ? (
                            <p className="text-sm text-muted-foreground">
                                Loading tools...
                            </p>
                        ) : toolsError || !tools ? (
                            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-center">
                                <Wrench className="size-8 text-muted-foreground/40" />
                                <p className="text-sm text-muted-foreground">
                                    Failed to load tools
                                </p>
                            </div>
                        ) : tools.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-center">
                                <Wrench className="size-8 text-muted-foreground/40" />
                                <p className="text-sm text-muted-foreground">
                                    No tools found
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-3 md:grid-cols-2">
                                {tools.data.map((tool) => (
                                    <ToolCard key={tool.id} tool={tool} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
