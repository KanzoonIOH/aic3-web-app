import { UnderConstruction } from "@/components/under-construction";

export function Mcps({ agentId }: { agentId: string }) {
    return (
        <>
            <UnderConstruction />
            <div hidden>{agentId}</div>
        </>
    );
}
