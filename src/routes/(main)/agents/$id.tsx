import { getAgent } from "@/api/agents";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(main)/agents/$id")({
    component: RouteComponent,
});

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
            <div className="px-6 py-4 bg-background border-b shrink-0">
                <h1 className="font-heading text-2xl font-semibold">
                    {agent.data.name}
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    {agent.data.description}
                </p>
            </div>

            <Tabs
                defaultValue="overview"
                className="grid grid-rows-[auto_1fr] flex-1 overflow-hidden px-3 py-2"
            >
                <TabsList variant="line">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="knowledge">Knowledges</TabsTrigger>
                    <TabsTrigger value="mcp">MCPs</TabsTrigger>
                    <TabsTrigger value="chat">Chat Sandbox</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="overflow-hidden">
                    <ScrollArea className="h-full">
                        <h1 className="h-[1000px] bg-neutral-800">
                            A long content
                        </h1>
                    </ScrollArea>
                </TabsContent>
                <TabsContent
                    value="knowledge"
                    className="flex-1 overflow-hidden mt-4"
                >
                    <ScrollArea className="h-full">Knowledges</ScrollArea>
                </TabsContent>
                <TabsContent
                    value="mcp"
                    className="flex-1 overflow-hidden mt-4"
                >
                    <ScrollArea className="h-full">MCPs</ScrollArea>
                </TabsContent>
                <TabsContent
                    value="chat"
                    className="flex-1 overflow-hidden mt-4"
                >
                    <ScrollArea className="h-full">Chat Sandbox</ScrollArea>
                </TabsContent>
            </Tabs>
        </div>
    );
}
