"use client";
import { useState } from "react";
import { Student } from "@/lib/types";
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, SlidersHorizontal, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StudentTableProps {
  students: Student[];
  onViewStudent: (student: Student) => void;
  columnFilters: Partial<Record<keyof Student, string>>;
  onColumnFilterChange: (col: keyof Student, val: string) => void;
  sortField?: keyof Student;
  sortDir?: "asc" | "desc";
  onSort: (field: keyof Student) => void;
  isLoading?: boolean;
}

const DEPT_VARIANT: Record<string, "info" | "success" | "purple"> = {
  Science:  "info",
  Commerce: "success",
  Arts:     "purple",
};

const SEM_COLORS: Record<number, string> = {
  1: "bg-amber-100 text-amber-700",
  2: "bg-sky-100 text-sky-700",
  3: "bg-rose-100 text-rose-700",
  4: "bg-teal-100 text-teal-700",
  5: "bg-orange-100 text-orange-700",
  6: "bg-indigo-100 text-indigo-700",
};

const COLS: { key: keyof Student; label: string; sortable?: boolean }[] = [
  { key: "rollNo",     label: "Roll No",    sortable: true  },
  { key: "course",     label: "Course",     sortable: true  },
  { key: "department", label: "Department", sortable: true  },
  { key: "semester",   label: "Sem",        sortable: true  },
  { key: "name",       label: "Name",       sortable: true  },
  { key: "email",      label: "Email",      sortable: false },
  { key: "contact",    label: "Contact",    sortable: false },
  { key: "status",     label: "Status",     sortable: true  },
];

function SortIcon({ field, sortField, sortDir }: { field: keyof Student; sortField?: keyof Student; sortDir?: "asc" | "desc" }) {
  if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-[var(--color-muted-foreground)]/50" />;
  return sortDir === "asc"
    ? <ArrowUp className="h-3 w-3 text-indigo-600" />
    : <ArrowDown className="h-3 w-3 text-indigo-600" />;
}

export function StudentTable({ students, onViewStudent, columnFilters, onColumnFilterChange, sortField, sortDir, onSort, isLoading }: StudentTableProps) {
  const [showColumnFilters, setShowColumnFilters] = useState(false);

  return (
    <TooltipProvider>
      <div>
        {/* Column filter toggle */}
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

        <div className={`transition-opacity duration-150 ${isLoading ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-indigo-50/80 to-violet-50/80 hover:bg-indigo-50/80">
                {COLS.map((col) => (
                  <TableHead
                    key={col.key}
                    className={`font-semibold text-[var(--color-foreground)]/80 whitespace-nowrap ${col.sortable ? "cursor-pointer select-none" : ""}`}
                    onClick={() => col.sortable && onSort(col.key)}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      {col.sortable && <SortIcon field={col.key} sortField={sortField} sortDir={sortDir} />}
                    </div>
                  </TableHead>
                ))}
                <TableHead className="w-16 text-[var(--color-foreground)]/80">View</TableHead>
              </TableRow>

              {/* Column filter inputs */}
              {showColumnFilters && (
                <TableRow className="bg-indigo-50/40 hover:bg-indigo-50/40">
                  {COLS.map((col) => (
                    <TableHead key={col.key} className="py-2">
                      <Input
                        placeholder="Filter…"
                        type={col.key === "semester" ? "number" : "text"}
                        inputMode={col.key === "semester" ? "numeric" : "text"}
                        min={col.key === "semester" ? 1 : undefined}
                        max={col.key === "semester" ? 6 : undefined}
                        value={columnFilters[col.key] || ""}
                        onChange={(e) => {
                          const val = col.key === "semester"
                            ? e.target.value.replace(/[^0-9]/g, "")
                            : e.target.value;
                          onColumnFilterChange(col.key, val);
                        }}
                        className="h-7 text-xs bg-white border-indigo-200 focus-visible:ring-indigo-300 placeholder:text-[var(--color-muted-foreground)]/50 font-normal"
                      />
                    </TableHead>
                  ))}
                  <TableHead />
                </TableRow>
              )}
            </TableHeader>

            <TableBody>
              {isLoading && students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COLS.length + 1} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3 text-[var(--color-muted-foreground)]">
                      <Loader2 className="h-7 w-7 text-indigo-600 animate-spin" />
                      <p className="text-sm font-medium">Loading students…</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COLS.length + 1} className="text-center py-20">
                    <div className="flex flex-col items-center gap-2 text-[var(--color-muted-foreground)]">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <SlidersHorizontal className="h-5 w-5" />
                      </div>
                      <p className="font-semibold text-[var(--color-foreground)]">No students found</p>
                      <p className="text-xs">Try adjusting your search or filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student, idx) => (
                  <TableRow key={student.id} className={idx % 2 === 1 ? "bg-slate-50" : ""}>
                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md whitespace-nowrap">
                        {student.rollNo}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{student.course}</TableCell>
                    <TableCell>
                      <Badge variant={DEPT_VARIANT[student.department] ?? "secondary"}>
                        {student.department}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex w-7 h-7 rounded-full text-xs font-bold items-center justify-center ${SEM_COLORS[student.semester] || "bg-gray-100 text-gray-600"}`}>
                        {student.semester}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold text-sm whitespace-nowrap">{student.name}</TableCell>
                    <TableCell className="text-[var(--color-muted-foreground)] text-xs">{student.email}</TableCell>
                    <TableCell className="font-mono text-xs text-[var(--color-muted-foreground)]">{student.contact}</TableCell>
                    <TableCell>
                      <Badge variant={student.status === "Active" ? "success" : "destructive"} className="gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${student.status === "Active" ? "bg-emerald-500" : "bg-red-500"}`} />
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--color-muted-foreground)] hover:text-indigo-600 hover:bg-indigo-50" onClick={() => onViewStudent(student)}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View details</TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
}
