import type { UserRole } from "./auth";
import { client } from "./client";
import type { ResponseTemplate } from "./types";

export interface Me {
    id: string;
    name: string;
    username: string;
    email: string;
    role: UserRole;
    image: string | null;
    created_at: string;
    updated_at: string;
}

export async function getMe(): Promise<ResponseTemplate<Me>> {
    const { data } = await client.get<ResponseTemplate<Me>>("/me");
    return data;
}

// image: emoji string, null to clear, or undefined to leave unchanged.
export async function updateDetails(payload: {
    name: string;
    username: string;
    image?: string | null;
}): Promise<ResponseTemplate<Me>> {
    const { data } = await client.patch<ResponseTemplate<Me>>("/me", payload);
    return data;
}

export async function updatePassword(payload: {
    old_password: string;
    new_password: string;
}): Promise<ResponseTemplate<Me>> {
    const { data } = await client.patch<ResponseTemplate<Me>>(
        "/me/password",
        payload,
    );
    return data;
}

export async function uploadAvatar(file: File): Promise<ResponseTemplate<Me>> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await client.patch<ResponseTemplate<Me>>(
        "/me/avatar",
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
}
