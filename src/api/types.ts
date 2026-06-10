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
