import { UnderConstruction } from "@/components/under-construction";

export function Overview({ agentId }: { agentId: string }) {
    return (
        <>
            <UnderConstruction />
            <div hidden>{agentId}</div>
        </>
    );
}
