import { client } from "./client";
import type { Attachment } from "./agents";
import type { ResponseTemplate } from "./types";

export interface Conversation {
    id: string;
    agent_id: string;
    agent_name: string;
    started_at: string;
    ended_at: string | null;
    is_active: boolean;
    last_message: string | null;
    last_message_at: string | null;
    message_count: number;
}

export interface ConversationMessage {
    id: string;
    conversation_id: string;
    role: "user" | "assistant" | "system";
    content: string | null;
    attachments: unknown;
    data: unknown;
    created_at: string;
}

// message.attachments is stored verbatim from the chat request body, so it is
// only trustworthy enough to narrow here — anything malformed is dropped.
export function toAttachments(raw: unknown): Attachment[] | undefined {
    if (!Array.isArray(raw)) return undefined;
    const out = raw.filter(
        (a): a is Attachment =>
            !!a &&
            typeof a === "object" &&
            typeof (a as Attachment).url === "string" &&
            typeof (a as Attachment).name === "string",
    );
    return out.length ? out : undefined;
}

export interface ConversationDetail {
    conversation: {
        id: string;
        agent_id: string;
        agent_name: string;
        started_at: string;
        ended_at: string | null;
        is_active: boolean;
    };
    messages: ConversationMessage[];
}

// mine=true scopes the list to the caller's own conversations (viewer app).
export async function getConversations(params?: {
    limit?: number;
    offset?: number;
    mine?: boolean;
}) {
    const res = await client.get<ResponseTemplate<Conversation[]>>(
        "/conversations",
        { params },
    );
    return res.data;
}

export async function getConversation(id: string) {
    const res = await client.get<ResponseTemplate<ConversationDetail>>(
        `/conversations/${id}`,
    );
    return res.data.data;
}

export async function deleteConversation(id: string) {
    await client.delete(`/conversations/${id}`);
}
