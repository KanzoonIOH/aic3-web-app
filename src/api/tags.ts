import { client } from "./client";
import type { ResponseTemplate } from "./types";

export interface Tag {
    id: string;
    name: string;
    color: string;
    // Present only on the tags-list endpoint (not on agent.tags).
    agents_count?: number;
}

export async function getTags(): Promise<ResponseTemplate<Tag[]>> {
    const { data } = await client.get<ResponseTemplate<Tag[]>>("/tags");
    return data;
}

export async function updateTag(
    id: string,
    payload: { name: string; color: string },
): Promise<ResponseTemplate<Tag>> {
    const { data } = await client.patch<ResponseTemplate<Tag>>(
        `/tags/${id}`,
        payload,
    );
    return data;
}

export async function deleteTag(id: string): Promise<void> {
    await client.delete(`/tags/${id}`);
}
