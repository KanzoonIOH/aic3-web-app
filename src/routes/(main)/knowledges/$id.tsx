import { getKnowledge } from "@/api/knowledges";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(main)/knowledges/$id")({
    component: RouteComponent,
});

function RouteComponent() {
    const { id } = Route.useParams();

    const {
        data: knowledge,
        isPending,
        isError,
    } = useQuery({
        queryKey: ["knowledges", id],
        queryFn: () => getKnowledge(id),
    });

    if (isPending) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                    Loading knowledge...
                </p>
            </div>
        );
    }

    if (isError || !knowledge) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                    Failed to load knowledge
                </p>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                <div className="sticky top-0 px-6 py-4 bg-background border-b">
                    <h1 className="font-heading text-2xl font-semibold">
                        {knowledge.data.name}
                    </h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {knowledge.data.description}
                    </p>
                </div>

                <div className="p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span className="capitalize">
                            {knowledge.data.source_type}
                        </span>
                    </div>

                    {knowledge.data.source_uri && (
                        <div className="rounded-lg border p-4">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                                Source URI
                            </p>
                            <p className="text-sm font-mono break-all">
                                {knowledge.data.source_uri}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
