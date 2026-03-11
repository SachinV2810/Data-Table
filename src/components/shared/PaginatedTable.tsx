"use client";

import { ReactNode, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type SortDirection = "asc" | "desc";

export interface ColumnDef<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  filterPlaceholder?: string;
  filterType?: "text" | "number";
  headerClassName?: string;
  cellClassName?: string;
  cell: (row: T) => ReactNode;
}

interface PaginatedTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading: boolean;
  pageIndex: number;
  pageSize: number;
  setPageIndex: (page: number) => void;
  setPageSize: (size: number) => void;
  total: number;
  sortField?: keyof T;
  sortDir?: SortDirection;
  onSort?: (field: keyof T) => void;
  columnFilters?: Partial<Record<keyof T, string>>;
  onColumnFilterChange?: (col: keyof T, value: string) => void;
  rowKey: (row: T, index: number) => React.Key;
  pageSizeOptions?: number[];
  emptyTitle?: string;
  emptyDescription?: string;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function PaginatedTable<T>({
  columns,
  data,
  loading,
  pageIndex,
  pageSize,
  setPageIndex,
  setPageSize,
  total,
  sortField,
  sortDir = "asc",
  onSort,
  columnFilters,
  onColumnFilterChange,
  rowKey,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your search or filters",
}: PaginatedTableProps<T>) {
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const pageNumbers = useMemo(() => {
    const nums: number[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) nums.push(i);
    } else if (pageIndex <= 3) {
      nums.push(1, 2, 3, 4, 5);
    } else if (pageIndex >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) nums.push(i);
    } else {
      for (let i = pageIndex - 2; i <= pageIndex + 2; i++) nums.push(i);
    }
    return nums;
  }, [pageIndex, totalPages]);

  const start = total === 0 ? 0 : (pageIndex - 1) * pageSize + 1;
  const end = Math.min(pageIndex * pageSize, total);

  return (
    <div>
      {onColumnFilterChange && (
        <div className="flex justify-end px-4 py-2 border-b bg-slate-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowColumnFilters(!showColumnFilters)}
            className={`gap-1.5 text-xs ${showColumnFilters ? "bg-indigo-50 text-indigo-600 hover:bg-primary/15" : "text-[var(--color-muted-foreground)]"}`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Column Filters
          </Button>
        </div>
      )}

      <div className={`transition-opacity duration-150 ${loading ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-indigo-50/80 to-violet-50/80 hover:bg-indigo-50/80">
              {columns.map((col) => (
                <TableHead
                  key={String(col.key)}
                  className={`font-semibold text-[var(--color-foreground)]/80 whitespace-nowrap ${col.sortable && onSort ? "cursor-pointer select-none" : ""} ${col.headerClassName ?? ""}`}
                  onClick={() => col.sortable && onSort?.(col.key as keyof T)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && onSort && (
                      sortField !== col.key ? <ArrowUpDown className="h-3 w-3 text-[var(--color-muted-foreground)]/50" /> :
                        sortDir === "asc" ? <ArrowUp className="h-3 w-3 text-indigo-600" /> : <ArrowDown className="h-3 w-3 text-indigo-600" />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>

            {showColumnFilters && onColumnFilterChange && (
              <TableRow className="bg-indigo-50/40 hover:bg-indigo-50/40">
                {columns.map((col) => {
                  const typedKey = col.key as keyof T;
                  if (!col.filterable) return <TableHead key={String(col.key)} />;
                  const isNumber = col.filterType === "number";
                  return (
                    <TableHead key={String(col.key)} className="py-2">
                      <Input
                        placeholder={col.filterPlaceholder ?? "Filter…"}
                        type="text"
                        inputMode={isNumber ? "numeric" : "text"}
                        pattern={isNumber ? "[0-9]*" : undefined}
                        value={columnFilters?.[typedKey] || ""}
                        onChange={(e) => {
                          const val = isNumber ? e.target.value.replace(/[^0-9]/g, "") : e.target.value;
                          onColumnFilterChange(typedKey, val);
                        }}
                        className="h-7 text-xs bg-white border-indigo-200 focus-visible:ring-indigo-300 placeholder:text-[var(--color-muted-foreground)]/50 font-normal"
                      />
                    </TableHead>
                  );
                })}
              </TableRow>
            )}
          </TableHeader>

          <TableBody>
            {loading && data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-20">
                  <div className="flex flex-col items-center gap-3 text-[var(--color-muted-foreground)]">
                    <Loader2 className="h-7 w-7 text-indigo-600 animate-spin" />
                    <p className="text-sm font-medium">Loading data…</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-20">
                  <div className="flex flex-col items-center gap-2 text-[var(--color-muted-foreground)]">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                      <SlidersHorizontal className="h-5 w-5" />
                    </div>
                    <p className="font-semibold text-[var(--color-foreground)]">{emptyTitle}</p>
                    <p className="text-xs">{emptyDescription}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, idx) => (
                <TableRow key={rowKey(row, idx)} className={idx % 2 === 1 ? "bg-slate-50" : ""}>
                  {columns.map((col) => (
                    <TableCell key={String(col.key)} className={col.cellClassName}>{col.cell(row)}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t bg-muted/10">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Rows per page</span>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPageIndex(1); }}>
            <SelectTrigger className="h-8 w-[70px] bg-white border-input text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((r) => <SelectItem key={r} value={String(r)}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Separator orientation="vertical" className="hidden sm:block h-6" />

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            <span className="font-medium text-foreground">{start.toLocaleString()}–{end.toLocaleString()}</span> of <span className="font-semibold text-primary">{total.toLocaleString()}</span>
          </span>

          <div className="flex items-center gap-0.5 ml-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPageIndex(1)} disabled={pageIndex === 1}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPageIndex(pageIndex - 1)} disabled={pageIndex === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {pageNumbers.map((p) => (
              <Button key={p} variant={p === pageIndex ? "default" : "ghost"} size="icon" className="h-8 w-8 text-sm" onClick={() => setPageIndex(p)}>
                {p}
              </Button>
            ))}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPageIndex(pageIndex + 1)} disabled={pageIndex === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPageIndex(totalPages)} disabled={pageIndex === totalPages}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
