import { client } from "./client";
import type { ResponseTemplate } from "./types";

// ---------- Types ----------

// The set of entities that can be pinned to the sidebar. Kept in sync with the
// backend CHECK constraint on the pins table.
export type PinEntityType = "dashboard" | "agent" | "orchestrator" | "chat";

// A pin resolved for rendering: label/image reflect the entity's CURRENT state
// (resolved live on the backend), and `route` is a ready-to-use frontend path.
export interface ResolvedPin {
    id: string;
    entity_type: PinEntityType;
    entity_id: string;
    label: string;
    image: string | null;
    route: string;
    position: number;
}

// Lightweight (type, id) pair used to toggle pin-button state on list pages.
export interface PinRef {
    entity_type: PinEntityType;
    entity_id: string;
}

// ---------- API functions ----------

export async function getPins(): Promise<ResponseTemplate<ResolvedPin[]>> {
    const { data } = await client.get<ResponseTemplate<ResolvedPin[]>>("/pins");
    return data;
}

export async function getPinIds(): Promise<ResponseTemplate<PinRef[]>> {
    const { data } = await client.get<ResponseTemplate<PinRef[]>>("/pins/ids");
    return data;
}

export async function createPin(
    ref: PinRef,
): Promise<ResponseTemplate<unknown>> {
    const { data } = await client.post<ResponseTemplate<unknown>>("/pins", ref);
    return data;
}

export async function deletePin(ref: PinRef): Promise<ResponseTemplate<null>> {
    // DELETE with a body — the pin is identified by its entity reference so a
    // detail page can unpin without knowing the pin's own id.
    const { data } = await client.delete<ResponseTemplate<null>>("/pins", {
        data: ref,
    });
    return data;
}

export async function reorderPins(
    pinIds: string[],
): Promise<ResponseTemplate<null>> {
    const { data } = await client.patch<ResponseTemplate<null>>(
        "/pins/reorder",
        { pin_ids: pinIds },
    );
    return data;
}
