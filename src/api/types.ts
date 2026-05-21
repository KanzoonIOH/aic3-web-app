export type PaginationType = {
    page: number;
    total_page: number;
    limit: number;
};

export type ResponseTemplate<T = unknown> = {
    data: T;
    message: string;
    pagination: PaginationType | null;
};
