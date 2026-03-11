"use client";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface PaginationProps {
  total: number;
  page: number;
  rowsPerPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
}

const ROW_OPTIONS = [10, 25, 50, 100];

export function Pagination({ total, page, rowsPerPage, totalPages, onPageChange, onRowsPerPageChange }: PaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const end   = Math.min(page * rowsPerPage, total);

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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t bg-muted/10">
      {/* Rows per page */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">Rows per page</span>
        <Select value={String(rowsPerPage)} onValueChange={(v) => onRowsPerPageChange(Number(v))}>
          <SelectTrigger className="h-8 w-[70px] bg-white border-input text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROW_OPTIONS.map((r) => <SelectItem key={r} value={String(r)}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Separator orientation="vertical" className="hidden sm:block h-6" />

      {/* Page info + navigation */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          <span className="font-medium text-foreground">{start.toLocaleString()}–{end.toLocaleString()}</span>
          {" "}of{" "}
          <span className="font-semibold text-primary">{total.toLocaleString()}</span>
        </span>

        <div className="flex items-center gap-0.5 ml-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onPageChange(1)} disabled={page === 1}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {pageNums.map((p) => (
            <Button
              key={p}
              variant={p === page ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8 text-sm"
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          ))}

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onPageChange(totalPages)} disabled={page === totalPages}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
