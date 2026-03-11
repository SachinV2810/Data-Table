"use client";
import { Printer, Download, FileSpreadsheet } from "lucide-react";
import { Student, FilterState } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ApiQuery {
  query: string;
  filters: FilterState;
  columnFilters: Partial<Record<keyof Student, string>>;
  sortField?: keyof Student;
  sortDir?: "asc" | "desc";
}

interface ActionBarProps {
  apiQuery: ApiQuery;
  visibleStudents: Student[];
}

function buildExportUrl(apiQuery: ApiQuery, format: "csv" | "excel"): string {
  const sp = new URLSearchParams();
  if (apiQuery.query) sp.set("q", apiQuery.query);
  if (apiQuery.filters.department) sp.set("department", apiQuery.filters.department);
  if (apiQuery.filters.semester)   sp.set("semester",   apiQuery.filters.semester);
  if (apiQuery.filters.status)     sp.set("status",     apiQuery.filters.status);
  if (apiQuery.filters.course)     sp.set("course",     apiQuery.filters.course);
  if (apiQuery.sortField) sp.set("sortField", apiQuery.sortField);
  if (apiQuery.sortDir)   sp.set("sortDir",   apiQuery.sortDir);
  for (const [key, val] of Object.entries(apiQuery.columnFilters)) {
    if (val?.trim()) sp.set(`col_${key}`, val);
  }
  sp.set("limit", "500000");
  sp.set("page", "1");
  sp.set("format", format);
  return `/api/students/export?${sp.toString()}`;
}

async function downloadExport(url: string, filename: string) {
  const res = await fetch(url);
  if (!res.ok) { alert("Export failed"); return; }
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href; a.download = filename; a.click();
  URL.revokeObjectURL(href);
}

export function ActionBar({ apiQuery, visibleStudents }: ActionBarProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-400 gap-1.5">
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Print table</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={() => downloadExport(buildExportUrl(apiQuery, "csv"), "students.csv")} className="border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-400 gap-1.5">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">CSV</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download as CSV</TooltipContent>
        </Tooltip>

        
      </div>
    </TooltipProvider>
  );
}
