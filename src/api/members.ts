import { client } from "./client";
import type { ResponseTemplate } from "./types";

// ---------- Types ----------

export interface Member {
    id: string;
    name: string;
    username: string;
    email: string;
    role: "new" | "user" | "admin";
    created_at: string;
    updated_at: string;
}

export interface UpdateMemberStatusRequest {
    role: string;
}

// ---------- API functions ----------

export async function getMembers(): Promise<ResponseTemplate<Member[]>> {
    const { data } = await client.get<ResponseTemplate<Member[]>>("/members");
    return data;
}

export async function acceptMember(id: string): Promise<ResponseTemplate<Member>> {
    const { data } = await client.patch<ResponseTemplate<Member>>(
        `/members/${id}/accept`,
    );
    return data;
}

export async function updateMemberStatus(
    id: string,
    payload: UpdateMemberStatusRequest,
): Promise<ResponseTemplate<Member>> {
    const { data } = await client.patch<ResponseTemplate<Member>>(
        `/members/${id}/status`,
        payload,
    );
    return data;
}

export async function deleteMember(id: string): Promise<ResponseTemplate<null>> {
    const { data } = await client.delete<ResponseTemplate<null>>(
        `/members/${id}`,
    );
    return data;
}
