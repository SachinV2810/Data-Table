"use client";
import { useMemo, useState } from "react";
import { Student, FilterState } from "@/lib/types";
import { useStudents } from "@/hooks/useStudents";
import { SearchBar } from "./SearchBar";
import { FilterBar } from "./FilterBar";
import { ActionBar } from "./ActionBar";
import { StudentDetailModal } from "./StudentDetailModal";
import { StatsCards } from "./StatsCards";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ColumnDef, PaginatedTable } from "@/components/shared/PaginatedTable";
import { ExternalLink, GraduationCap, Loader2, SlidersHorizontal, X } from "lucide-react";

export function StudentListPage() {
  const [query, setQuery]             = useState("");
  const [filters, setFilters]         = useState<FilterState>({ department: "", semester: "", status: "", course: "" });
  const [columnFilters, setColumnFilters] = useState<Partial<Record<keyof Student, string>>>({});
  const [page, setPage]               = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField]     = useState<keyof Student | undefined>();
  const [sortDir, setSortDir]         = useState<"asc" | "desc">("asc");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data, total, facets, stats, isLoading, error } = useStudents({
    query, filters, columnFilters, page, rowsPerPage, sortField, sortDir,
  });

  const handleSearch = (q: string) => { setQuery(q); setPage(1); };
  const handleFilterChange = (key: keyof FilterState, value: string) => { setFilters(p => ({ ...p, [key]: value })); setPage(1); };
  const handleColumnFilterChange = (col: keyof Student, val: string) => { setColumnFilters(p => ({ ...p, [col]: val })); setPage(1); };
  const handleSort = (field: keyof Student) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  };
  const clearAll = () => { setQuery(""); setFilters({ department: "", semester: "", status: "", course: "" }); setColumnFilters({}); setPage(1); };

  const hasActiveFilters = !!query || !!filters.department || !!filters.semester || !!filters.status || !!filters.course || Object.values(columnFilters).some(v => v);
  const activeFilterCount = [query, filters.department, filters.semester, filters.status, filters.course, ...Object.values(columnFilters)].filter(Boolean).length;

  const columns = useMemo<ColumnDef<Student>[]>(() => {
    const semColors: Record<number, string> = {
      1: "bg-amber-100 text-amber-700",
      2: "bg-sky-100 text-sky-700",
      3: "bg-rose-100 text-rose-700",
      4: "bg-teal-100 text-teal-700",
      5: "bg-orange-100 text-orange-700",
      6: "bg-indigo-100 text-indigo-700",
    };

    return [
      {
        key: "rollNo",
        header: "Roll No",
        sortable: true,
        filterable: true,
        cell: (student) => (
          <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md whitespace-nowrap">
            {student.rollNo}
          </span>
        ),
      },
      { key: "course", header: "Course", sortable: true, filterable: true, cellClassName: "font-medium text-sm", cell: (student) => student.course },
      {
        key: "department",
        header: "Department",
        sortable: true,
        filterable: true,
        cell: (student) => <Badge variant={student.department === "Science" ? "info" : student.department === "Commerce" ? "success" : "purple"}>{student.department}</Badge>,
      },
      {
        key: "semester",
        header: "Sem",
        sortable: true,
        filterable: true,
        filterType: "number",
        cell: (student) => (
          <span className={`inline-flex w-7 h-7 rounded-full text-xs font-bold items-center justify-center ${semColors[student.semester] || "bg-gray-100 text-gray-600"}`}>
            {student.semester}
          </span>
        ),
      },
      { key: "name", header: "Name", sortable: true, filterable: true, cellClassName: "font-semibold text-sm whitespace-nowrap", cell: (student) => student.name },
      { key: "email", header: "Email", filterable: true, cellClassName: "text-[var(--color-muted-foreground)] text-xs", cell: (student) => student.email },
      { key: "contact", header: "Contact", filterable: true, cellClassName: "font-mono text-xs text-[var(--color-muted-foreground)]", cell: (student) => student.contact },
      {
        key: "status",
        header: "Status",
        sortable: true,
        filterable: true,
        cell: (student) => (
          <Badge variant={student.status === "Active" ? "success" : "destructive"} className="gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${student.status === "Active" ? "bg-emerald-500" : "bg-red-500"}`} />
            {student.status}
          </Badge>
        ),
      },
      {
        key: "actions",
        header: "View",
        headerClassName: "w-16",
        cell: (student) => (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--color-muted-foreground)] hover:text-indigo-600 hover:bg-indigo-50" onClick={() => setSelectedStudent(student)}>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>View details</TooltipContent>
          </Tooltip>
        ),
      },
    ];
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-violet-50/10">
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="no-print flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Student List</h1>
            </div>
          </div>
          <ActionBar apiQuery={{ query, filters, columnFilters, sortField, sortDir }} visibleStudents={data} />
        </div>

        {/* Stats */}
        {stats && (
          <div className="no-print">
            <StatsCards stats={stats} filteredCount={total} />
          </div>
        )}

        {/* Main card */}
        <Card className="border-0 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="no-print p-4 border-b bg-card space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <SearchBar value={query} onChange={handleSearch} />

              <Button
                variant={showFilters || hasActiveFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-1.5 flex-shrink-0 border-indigo-200"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-0.5 h-4 px-1.5 text-[10px] bg-white/30 text-white">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>

              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearAll} className="gap-1.5 flex-shrink-0 text-destructive border-destructive/30 hover:bg-destructive/10">
                  <X className="h-3.5 w-3.5" />
                  Clear
                </Button>
              )}

              {isLoading && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  Searching…
                </span>
              )}
            </div>

            {showFilters && (
              <>
                <Separator />
                <FilterBar
                  filters={filters} onChange={handleFilterChange}
                  departments={facets?.departments ?? []}
                  semesters={facets?.semesters ?? []}
                  courses={facets?.courses ?? []}
                />
              </>
            )}

            {!isLoading && (
              <p className="text-xs text-muted-foreground">
                {hasActiveFilters
                  ? <><span className="font-semibold text-primary">{total.toLocaleString()}</span> result{total !== 1 ? "s" : ""} found</>
                  : <><span className="font-semibold text-foreground">{total.toLocaleString()}</span> students</>}
              </p>
            )}
          </div>

          {error && (
            <div className="p-4 text-sm text-destructive bg-destructive/5 border-b border-destructive/20">
              ⚠️ {error}
            </div>
          )}

          <CardContent className="p-0">
            <TooltipProvider>
              <PaginatedTable<Student>
                columns={columns}
                data={data}
                loading={isLoading}
                pageIndex={page}
                pageSize={rowsPerPage}
                setPageIndex={setPage}
                setPageSize={setRowsPerPage}
                total={total}
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                columnFilters={columnFilters}
                onColumnFilterChange={handleColumnFilterChange}
                rowKey={(student) => student.id}
                emptyTitle="No students found"
              />
            </TooltipProvider>
          </CardContent>
        </Card>
      </div>

      <StudentDetailModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
    </div>
  );
}
