import { UnderConstruction } from "@/components/under-construction";

export function Knowledges({ agentId }: { agentId: string }) {
    return (
        <>
            <UnderConstruction />
            <div hidden>{agentId}</div>
        </>
    );
}
