import type { UserRole } from "./auth";
import { client } from "./client";
import type { ResponseTemplate } from "./types";

// ---------- Types ----------

export interface Member {
    id: string;
    name: string;
    username: string;
    email: string;
    role: UserRole;
    image: string | null;
    created_at: string;
    updated_at: string;
    // has_password=false + role=PENDING => invited, not yet accepted.
    has_password: boolean;
    // Active invite token, present for pending invites so we can show the link.
    invite_token: string;
}

export interface UpdateMemberStatusRequest {
    role: string;
}

// ---------- API functions ----------

export async function getMembers(
    role?: UserRole,
): Promise<ResponseTemplate<Member[]>> {
    const { data } = await client.get<ResponseTemplate<Member[]>>("/members", {
        params: role ? { role } : undefined,
    });
    return data;
}

export async function acceptMember(
    id: string,
): Promise<ResponseTemplate<Member>> {
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

export interface InviteMemberResponse {
    user: Member;
    invite_url: string;
}

export async function inviteMember(
    email: string,
): Promise<ResponseTemplate<InviteMemberResponse>> {
    const { data } = await client.post<ResponseTemplate<InviteMemberResponse>>(
        "/members/invite",
        { email },
    );
    return data;
}
