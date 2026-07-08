export type PaginationType = {
    page: number;
    total_page: number;
    limit: number;
    rows?: number;
    total_row?: number;
};

export type ResponseTemplate<T = unknown> = {
    data: T;
    message: string;
    pagination: PaginationType | null;
};

// Common list query params. `offset` is a 0-based PAGE INDEX (page - 1), not a
// row offset — the backend multiplies it by limit. `sort` is a fixed enum
// string like "name_asc" / "created_desc", not a column+direction pair.
export type ListParams = {
    offset?: number;
    limit?: number;
    search?: string;
    sort?: string;
};
