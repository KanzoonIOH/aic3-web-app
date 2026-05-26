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

type ResponseGetMembers = ResponseTemplate<Member[]>;
export async function getMembers(): Promise<ResponseGetMembers> {
    const { data } = await client.get<ResponseGetMembers>("/members");
    return data;
}

type ResponseAcceptMember = ResponseTemplate<Member>;
export async function acceptMember(id: string): Promise<ResponseAcceptMember> {
    const { data } = await client.patch<ResponseAcceptMember>(
        `/members/${id}/accept`,
    );
    return data;
}

type ResponseUpdateMemberStatus = ResponseTemplate<Member>;
export async function updateMemberStatus(
    id: string,
    payload: UpdateMemberStatusRequest,
): Promise<ResponseUpdateMemberStatus> {
    const { data } = await client.patch<ResponseUpdateMemberStatus>(
        `/members/${id}/status`,
        payload,
    );
    return data;
}

type ResponseDeleteMember = ResponseTemplate<null>;
export async function deleteMember(id: string): Promise<ResponseDeleteMember> {
    const { data } = await client.delete<ResponseDeleteMember>(
        `/members/${id}`,
    );
    return data;
}
