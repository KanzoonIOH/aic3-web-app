import { client } from "./client";
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

export async function getConversations(params?: {
    limit?: number;
    offset?: number;
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
