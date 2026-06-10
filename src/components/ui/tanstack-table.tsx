import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type ColumnFiltersState,
    type ColumnSizingState,
    type OnChangeFn,
    type PaginationState,
    type RowData,
    type RowSelectionState,
    type SortingState,
    type Table as TanStackTableInstance,
    type TableOptions,
    type VisibilityState,
} from "@tanstack/react-table";
import {
    ArrowDown,
    ArrowUp,
    ChevronLeft,
    ChevronRight,
    ChevronsUpDown,
} from "lucide-react";
import { useState, type ReactNode } from "react";

export type { ColumnDef, TanStackTableInstance };

// Per-column styling carried on `ColumnDef.meta`. This keeps the grid headless
// while still letting product screens attach classes to rendered table markup.
declare module "@tanstack/react-table" {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface ColumnMeta<TData extends RowData, TValue> {
        className?: string;
        headerClassName?: string;
        cellClassName?: string;
    }
}

export interface TanStackTableState {
    sorting?: SortingState;
    columnFilters?: ColumnFiltersState;
    globalFilter?: unknown;
    pagination?: PaginationState;
    rowSelection?: RowSelectionState;
    columnVisibility?: VisibilityState;
    columnSizing?: ColumnSizingState;
}

export interface TanStackTableRenderProps<TData> {
    table: TanStackTableInstance<TData>;
}

export interface TanStackTableProps<TData> {
    columns: ColumnDef<TData, unknown>[];
    data: TData[];
    getRowId?: TableOptions<TData>["getRowId"];

    /** Controlled table state. Omit a key to let this component own it. */
    state?: TanStackTableState;
    initialState?: TanStackTableState;
    onSortingChange?: OnChangeFn<SortingState>;
    onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
    onGlobalFilterChange?: OnChangeFn<unknown>;
    onPaginationChange?: OnChangeFn<PaginationState>;
    onRowSelectionChange?: OnChangeFn<RowSelectionState>;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
    onColumnSizingChange?: OnChangeFn<ColumnSizingState>;

    manualSorting?: boolean;
    manualFiltering?: boolean;
    manualPagination?: boolean;
    rowCount?: number;
    pageCount?: number;
    enableSorting?: boolean;
    enableRowSelection?: TableOptions<TData>["enableRowSelection"];
    enableMultiRowSelection?: TableOptions<TData>["enableMultiRowSelection"];
    enableColumnResizing?: boolean;

    isLoading?: boolean;
    isError?: boolean;
    loadingContent?: ReactNode;
    errorContent?: ReactNode;
    emptyContent?: ReactNode;
    renderToolbar?: (props: TanStackTableRenderProps<TData>) => ReactNode;
    renderFooter?: (props: TanStackTableRenderProps<TData>) => ReactNode;

    className?: string;
    tableClassName?: string;
    headerRowClassName?: string;
    rowClassName?: string | ((row: TData) => string | undefined);
}

export function TanStackTable<TData>({
    columns,
    data,
    getRowId,
    state,
    initialState,
    onSortingChange,
    onColumnFiltersChange,
    onGlobalFilterChange,
    onPaginationChange,
    onRowSelectionChange,
    onColumnVisibilityChange,
    onColumnSizingChange,
    manualSorting = false,
    manualFiltering = false,
    manualPagination = false,
    rowCount,
    pageCount,
    enableSorting = true,
    enableRowSelection = false,
    enableMultiRowSelection,
    enableColumnResizing = false,
    isLoading = false,
    isError = false,
    loadingContent = "Loading...",
    errorContent = "Failed to load data",
    emptyContent = "No data found",
    renderToolbar,
    renderFooter,
    className,
    tableClassName,
    headerRowClassName,
    rowClassName,
}: TanStackTableProps<TData>) {
    const [internalSorting, setInternalSorting] = useState<SortingState>(
        initialState?.sorting ?? [],
    );
    const [internalColumnFilters, setInternalColumnFilters] =
        useState<ColumnFiltersState>(initialState?.columnFilters ?? []);
    const [internalGlobalFilter, setInternalGlobalFilter] = useState<unknown>(
        initialState?.globalFilter,
    );
    const [internalPagination, setInternalPagination] =
        useState<PaginationState>(
            initialState?.pagination ?? { pageIndex: 0, pageSize: 10 },
        );
    const [internalRowSelection, setInternalRowSelection] =
        useState<RowSelectionState>(initialState?.rowSelection ?? {});
    const [internalColumnVisibility, setInternalColumnVisibility] =
        useState<VisibilityState>(initialState?.columnVisibility ?? {});
    const [internalColumnSizing, setInternalColumnSizing] =
        useState<ColumnSizingState>(initialState?.columnSizing ?? {});

    const table = useReactTable({
        data,
        columns,
        getRowId,
        state: {
            sorting: state?.sorting ?? internalSorting,
            columnFilters: state?.columnFilters ?? internalColumnFilters,
            globalFilter: state?.globalFilter ?? internalGlobalFilter,
            pagination: state?.pagination ?? internalPagination,
            rowSelection: state?.rowSelection ?? internalRowSelection,
            columnVisibility:
                state?.columnVisibility ?? internalColumnVisibility,
            columnSizing: state?.columnSizing ?? internalColumnSizing,
        },
        onSortingChange: (updater) => {
            setInternalSorting(updater);
            onSortingChange?.(updater);
        },
        onColumnFiltersChange: (updater) => {
            setInternalColumnFilters(updater);
            onColumnFiltersChange?.(updater);
        },
        onGlobalFilterChange: (updater) => {
            setInternalGlobalFilter(updater);
            onGlobalFilterChange?.(updater);
        },
        onPaginationChange: (updater) => {
            setInternalPagination(updater);
            onPaginationChange?.(updater);
        },
        onRowSelectionChange: (updater) => {
            setInternalRowSelection(updater);
            onRowSelectionChange?.(updater);
        },
        onColumnVisibilityChange: (updater) => {
            setInternalColumnVisibility(updater);
            onColumnVisibilityChange?.(updater);
        },
        onColumnSizingChange: (updater) => {
            setInternalColumnSizing(updater);
            onColumnSizingChange?.(updater);
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
        getFilteredRowModel: manualFiltering
            ? undefined
            : getFilteredRowModel(),
        getPaginationRowModel: manualPagination
            ? undefined
            : getPaginationRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        manualSorting,
        manualFiltering,
        manualPagination,
        rowCount,
        pageCount,
        enableSorting,
        enableRowSelection,
        enableMultiRowSelection,
        enableColumnResizing,
    });

    const colSpan = table.getVisibleLeafColumns().length || 1;

    return (
        <div className={cn("flex flex-col gap-3", className)}>
            {renderToolbar?.({ table })}
            <div className="rounded-lg border overflow-hidden">
                <Table className={tableClassName}>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow
                                key={headerGroup.id}
                                className={cn(
                                    "bg-muted/40 hover:bg-muted/40",
                                    headerRowClassName,
                                )}
                            >
                                {headerGroup.headers.map((header) => {
                                    const meta = header.column.columnDef.meta;
                                    const sorted = header.column.getIsSorted();
                                    return (
                                        <TableHead
                                            key={header.id}
                                            colSpan={header.colSpan}
                                            aria-sort={
                                                sorted === "asc"
                                                    ? "ascending"
                                                    : sorted === "desc"
                                                      ? "descending"
                                                      : undefined
                                            }
                                            style={{
                                                width: header.getSize(),
                                            }}
                                            className={cn(
                                                meta?.className,
                                                meta?.headerClassName,
                                            )}
                                            scope="col"
                                        >
                                            {header.isPlaceholder ? null : (
                                                <ColumnHeader header={header} />
                                            )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={colSpan}
                                    className="h-32 text-center text-sm text-muted-foreground"
                                >
                                    {loadingContent}
                                </TableCell>
                            </TableRow>
                        ) : isError ? (
                            <TableRow>
                                <TableCell
                                    colSpan={colSpan}
                                    className="h-32 text-center text-sm text-muted-foreground"
                                >
                                    {errorContent}
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={colSpan}
                                    className="h-32 text-center text-sm text-muted-foreground"
                                >
                                    {emptyContent}
                                </TableCell>
                            </TableRow>
                        ) : (
                            table.getRowModel().rows.map((row) => {
                                const original = row.original;
                                const resolvedRowClassName =
                                    typeof rowClassName === "function"
                                        ? rowClassName(original)
                                        : rowClassName;

                                return (
                                    <TableRow
                                        key={row.id}
                                        data-state={
                                            row.getIsSelected()
                                                ? "selected"
                                                : undefined
                                        }
                                        className={resolvedRowClassName}
                                    >
                                        {row.getVisibleCells().map((cell) => {
                                            const meta =
                                                cell.column.columnDef.meta;
                                            return (
                                                <TableCell
                                                    key={cell.id}
                                                    style={{
                                                        width: cell.column.getSize(),
                                                    }}
                                                    className={cn(
                                                        meta?.className,
                                                        meta?.cellClassName,
                                                    )}
                                                >
                                                    {flexRender(
                                                        cell.column.columnDef
                                                            .cell,
                                                        cell.getContext(),
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
            {renderFooter?.({ table })}
        </div>
    );
}

function ColumnHeader<TData>({
    header,
}: {
    header: TanStackTableInstance<TData>["getHeaderGroups"] extends () => Array<
        infer THeaderGroup
    >
        ? THeaderGroup extends { headers: Array<infer THeader> }
            ? THeader
            : never
        : never;
}) {
    const canSort = header.column.getCanSort();
    const sorted = header.column.getIsSorted();
    const content = flexRender(
        header.column.columnDef.header,
        header.getContext(),
    );

    if (!canSort) return content;

    const sortLabel =
        sorted === "asc"
            ? "Sorted ascending. Activate to sort descending."
            : sorted === "desc"
              ? "Sorted descending. Activate to clear sorting."
              : "Not sorted. Activate to sort ascending.";

    return (
        <button
            type="button"
            className="inline-flex items-center gap-1.5 text-left"
            aria-label={sortLabel}
            onClick={header.column.getToggleSortingHandler()}
        >
            {content}
            {sorted === "asc" ? (
                <ArrowUp className="size-3.5 text-muted-foreground" />
            ) : sorted === "desc" ? (
                <ArrowDown className="size-3.5 text-muted-foreground" />
            ) : (
                <ChevronsUpDown className="size-3.5 text-muted-foreground/60" />
            )}
        </button>
    );
}

export function createSelectionColumn<TData>(): ColumnDef<TData, unknown> {
    return {
        id: "select",
        header: ({ table }) => (
            <input
                type="checkbox"
                aria-label="Select all rows"
                checked={table.getIsAllPageRowsSelected()}
                ref={(input) => {
                    if (!input) return;
                    input.indeterminate = table.getIsSomePageRowsSelected();
                }}
                onChange={table.getToggleAllPageRowsSelectedHandler()}
                className="size-4 accent-primary"
            />
        ),
        cell: ({ row }) => (
            <input
                type="checkbox"
                aria-label="Select row"
                checked={row.getIsSelected()}
                disabled={!row.getCanSelect()}
                onChange={row.getToggleSelectedHandler()}
                className="size-4 accent-primary"
            />
        ),
        enableSorting: false,
        enableHiding: false,
        meta: { className: "w-0" },
    };
}

/**
 * URL/server-state wiring example:
 *
 * const [search, setSearch] = useSearch({ from: "/users" })
 * <TanStackTable
 *   data={users.data}
 *   columns={columns}
 *   manualPagination
 *   manualSorting
 *   rowCount={users.pagination.total_row}
 *   state={{
 *     pagination: { pageIndex: search.page - 1, pageSize: search.limit },
 *     sorting: search.sort ? [{ id: search.sort, desc: search.dir === "desc" }] : [],
 *   }}
 *   onPaginationChange={(updater) => {
 *     const next = typeof updater === "function"
 *       ? updater({ pageIndex: search.page - 1, pageSize: search.limit })
 *       : updater
 *     setSearch({ page: next.pageIndex + 1, limit: next.pageSize })
 *   }}
 * />
 */

// ---------- Styled wrapper (product-facing) ----------
//
// `TanStackDataTable` is the styled, product-facing wrapper used across the
// app. It reproduces a consistent look & feel (loading / error / empty states,
// server-driven pagination bar) while running on the headless `TanStackTable`
// engine above.

export interface DataTablePagination {
    /** Current page (1-indexed). */
    page: number;
    /** Total number of pages. */
    totalPage: number;
    /** Total number of rows across all pages. */
    totalRow?: number;
    /** Called when the user requests a different page. */
    onPageChange: (page: number) => void;
    /** Disable the controls (e.g. while fetching the next page). */
    disabled?: boolean;
}

export interface TanStackDataTableProps<TData> {
    columns: ColumnDef<TData, unknown>[];
    data: TData[];
    /** Unique key per row. */
    getRowKey?: (row: TData, index: number) => string | number;
    isLoading?: boolean;
    isError?: boolean;
    loadingMessage?: ReactNode;
    errorMessage?: ReactNode;
    emptyMessage?: ReactNode;
    /** Optional icon shown in the empty state. */
    emptyIcon?: ReactNode;
    /** Server-driven pagination controls. */
    pagination?: DataTablePagination;
    /** Controlled table state (sorting, filters, visibility, ...). */
    state?: TanStackTableState;
    initialState?: TanStackTableState;
    /** Enable header-click sorting (client-side). Defaults to true. */
    enableSorting?: boolean;
    className?: string;
    /** Extra className for each body row. */
    rowClassName?: string;
}

export function TanStackDataTable<TData>({
    columns,
    data,
    getRowKey,
    isLoading = false,
    isError = false,
    loadingMessage = "Loading...",
    errorMessage = "Failed to load data",
    emptyMessage = "No data found",
    emptyIcon,
    pagination,
    state,
    initialState,
    enableSorting = true,
    className,
    rowClassName,
}: TanStackDataTableProps<TData>) {
    return (
        <TanStackTable
            columns={columns}
            data={data}
            getRowId={
                getRowKey
                    ? (row, index) => String(getRowKey(row, index))
                    : undefined
            }
            state={state}
            initialState={initialState}
            // Pagination is server-driven; the table only renders the page of
            // rows it was handed.
            manualPagination
            enableSorting={enableSorting}
            isLoading={isLoading}
            isError={isError}
            className={className}
            rowClassName={rowClassName}
            loadingContent={
                <span className="text-sm text-muted-foreground">
                    {loadingMessage}
                </span>
            }
            errorContent={
                <span className="text-sm text-muted-foreground">
                    {errorMessage}
                </span>
            }
            emptyContent={
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    {emptyIcon}
                    <span className="text-sm">{emptyMessage}</span>
                </div>
            }
            renderFooter={
                pagination
                    ? () => <DataTablePaginationBar {...pagination} />
                    : undefined
            }
        />
    );
}

// ---------- Pagination bar ----------

export function DataTablePaginationBar({
    page,
    totalPage,
    totalRow,
    onPageChange,
    disabled = false,
}: DataTablePagination) {
    return (
        <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
                {totalRow && totalRow > 0
                    ? `Page ${page} of ${totalPage} · ${totalRow} total`
                    : ""}
            </p>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || disabled}
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                >
                    <ChevronLeft className="size-3.5" />
                    Prev
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPage || disabled}
                    onClick={() => onPageChange(page + 1)}
                >
                    Next
                    <ChevronRight className="size-3.5" />
                </Button>
            </div>
        </div>
    );
}
