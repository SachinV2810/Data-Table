"use client";
import React from "react";
import {
  ArrowUpDown, ArrowUp, ArrowDown,
  SlidersHorizontal, Loader2,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";


export interface ColumnDef<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  numeric?: boolean;
  render?: (row: T) => React.ReactNode;
}


export interface PaginatedTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  pageIndex: number;
  pageSize: number;
  setPageIndex: (page: number) => void;
  setPageSize: (size: number) => void;
  total: number;

  sortField?: keyof T;
  sortDir?: "asc" | "desc";
  onSort?: (field: keyof T) => void;

  columnFilters?: Partial<Record<keyof T, string>>;
  onColumnFilterChange?: (col: keyof T, val: string) => void;

  actionColumn?: {
    label: string;
    render: (row: T) => React.ReactNode;
  };

  getRowKey: (row: T) => string | number;
  emptyMessage?: string;
  pageSizeOptions?: number[];
}



function SortIcon<T>({ col, sortField, sortDir }: {
  col: ColumnDef<T>;
  sortField?: keyof T;
  sortDir?: "asc" | "desc";
}) {
  if (!col.sortable) return null;
  if (sortField !== col.key) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />;
  return sortDir === "asc"
    ? <ArrowUp className="h-3 w-3 text-indigo-600" />
    : <ArrowDown className="h-3 w-3 text-indigo-600" />;
}



function PaginationBar({ total, page, pageSize, setPageIndex, setPageSize, pageSizeOptions }: {
  total: number;
  page: number;
  pageSize: number;
  setPageIndex: (p: number) => void;
  setPageSize: (s: number) => void;
  pageSizeOptions: number[];
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pageNums: number[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pageNums.push(i);
  } else if (page <= 3) {
    pageNums.push(1, 2, 3, 4, 5);
  } else if (page >= totalPages - 2) {
    for (let i = totalPages - 4; i <= totalPages; i++) pageNums.push(i);
  } else {
    for (let i = page - 2; i <= page + 2; i++) pageNums.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t bg-slate-50/50">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">Rows per page</span>
        <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPageIndex(1); }}>
          <SelectTrigger className="h-8 w-[70px] bg-white text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Separator orientation="vertical" className="hidden sm:block h-6" />

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          <span className="font-medium text-foreground">{start.toLocaleString()}–{end.toLocaleString()}</span>
          {" "}of{" "}
          <span className="font-semibold text-indigo-600">{total.toLocaleString()}</span>
        </span>
        <div className="flex items-center gap-0.5 ml-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPageIndex(1)} disabled={page === 1}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPageIndex(page - 1)} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {pageNums.map((p) => (
            <Button key={p} variant={p === page ? "default" : "ghost"} size="icon" className="h-8 w-8 text-sm" onClick={() => setPageIndex(p)}>
              {p}
            </Button>
          ))}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPageIndex(page + 1)} disabled={page === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPageIndex(totalPages)} disabled={page === totalPages}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── PaginatedTable ──────────────────────────────────────────────────────────

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function PaginatedTable<T>({
  columns,
  data,
  loading = false,
  pageIndex,
  pageSize,
  setPageIndex,
  setPageSize,
  total,
  sortField,
  sortDir,
  onSort,
  columnFilters,
  onColumnFilterChange,
  actionColumn,
  getRowKey,
  emptyMessage = "No results found",
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: PaginatedTableProps<T>) {
  const [showColFilters, setShowColFilters] = React.useState(false);
  const totalCols = columns.length + (actionColumn ? 1 : 0);

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardContent className="p-0">
        {/* Column filter toggle */}
        {onColumnFilterChange && (
          <div className="flex justify-end px-4 py-2 border-b bg-slate-50">
            <Button
              variant="ghost" size="sm"
              onClick={() => setShowColFilters(!showColFilters)}
              className={`gap-1.5 text-xs ${showColFilters ? "bg-indigo-50 text-indigo-600" : "text-muted-foreground"}`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Column Filters
            </Button>
          </div>
        )}

        {/* Table */}
        <div className={`transition-opacity duration-150 ${loading ? "opacity-60 pointer-events-none" : ""}`}>
          <Table>
            <TableHeader>
              {/* Column headers */}
              <TableRow className="bg-gradient-to-r from-indigo-50/80 to-violet-50/80 hover:bg-indigo-50/80">
                {columns.map((col) => (
                  <TableHead
                    key={String(col.key)}
                    className={`font-semibold text-foreground/80 whitespace-nowrap ${col.sortable && onSort ? "cursor-pointer select-none" : ""}`}
                    onClick={() => col.sortable && onSort?.(col.key)}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      <SortIcon col={col} sortField={sortField} sortDir={sortDir} />
                    </div>
                  </TableHead>
                ))}
                {actionColumn && (
                  <TableHead className="w-16 text-foreground/80">{actionColumn.label}</TableHead>
                )}
              </TableRow>

              {/* Column filter inputs */}
              {showColFilters && onColumnFilterChange && (
                <TableRow className="bg-indigo-50/40 hover:bg-indigo-50/40">
                  {columns.map((col) => (
                    <TableHead key={String(col.key)} className="py-2">
                      <Input
                        placeholder="Filter…"
                        type="text"
                        inputMode={col.numeric ? "numeric" : "text"}
                        value={(columnFilters?.[col.key] as string) || ""}
                        onChange={(e) => {
                          const val = col.numeric
                            ? e.target.value.replace(/[^0-9]/g, "")
                            : e.target.value;
                          onColumnFilterChange(col.key, val);
                        }}
                        className="h-7 text-xs bg-white border-indigo-200 focus-visible:ring-indigo-300 placeholder:text-muted-foreground/50 font-normal"
                      />
                    </TableHead>
                  ))}
                  {actionColumn && <TableHead />}
                </TableRow>
              )}
            </TableHeader>

            <TableBody>
              {loading && data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={totalCols} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Loader2 className="h-7 w-7 text-indigo-600 animate-spin" />
                      <p className="text-sm font-medium">Loading…</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={totalCols} className="text-center py-20">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <SlidersHorizontal className="h-5 w-5" />
                      </div>
                      <p className="font-semibold text-foreground">{emptyMessage}</p>
                      <p className="text-xs">Try adjusting your search or filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, idx) => (
                  <TableRow key={getRowKey(row)} className={idx % 2 === 1 ? "bg-slate-50" : ""}>
                    {columns.map((col) => (
                      <TableCell key={String(col.key)}>
                        {col.render ? col.render(row) : String(row[col.key] ?? "")}
                      </TableCell>
                    ))}
                    {actionColumn && (
                      <TableCell>{actionColumn.render(row)}</TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <PaginationBar
          total={total}
          page={pageIndex}
          pageSize={pageSize}
          setPageIndex={setPageIndex}
          setPageSize={setPageSize}
          pageSizeOptions={pageSizeOptions}
        />
      </CardContent>
    </Card>
  );
}
