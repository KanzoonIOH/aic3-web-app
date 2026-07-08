import { client } from "./client";
import type { ResponseTemplate } from "./types";

export interface GlobalConfig {
    agent_name: string;
    industry_description: string;
    guardrail: string;
}

export async function getGlobalConfig(): Promise<
    ResponseTemplate<GlobalConfig>
> {
    const { data } =
        await client.get<ResponseTemplate<GlobalConfig>>("/global-config");
    return data;
}

export async function updateGlobalConfig(
    payload: GlobalConfig,
): Promise<ResponseTemplate<GlobalConfig>> {
    const { data } = await client.patch<ResponseTemplate<GlobalConfig>>(
        "/global-config",
        payload,
    );
    return data;
}
