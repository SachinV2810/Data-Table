"use client";
import React, { useState } from "react";
import { Search, X, SlidersHorizontal, Printer, Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { DataPageConfig } from "@/lib/data-page-types";
import { PaginatedTable } from "@/components/ui/PaginatedTable";
import { useDataPage } from "@/hooks/useDataPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


async function downloadFile(url: string, filename: string) {
  const res = await fetch(url);
  if (!res.ok) { alert("Export failed"); return; }
  const blob = await res.blob();
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(blob), download: filename,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

function buildExportUrl(endpoint: string, params: Record<string, string>, format: "csv" | "excel") {
  return `${endpoint}?${new URLSearchParams({ ...params, format, limit: "500000", page: "1" })}`;
}


export function DataPage<T>({ config }: { config: DataPageConfig<T> }) {
  const {
    endpoint, columns, getRowKey,
    title, titleIcon, entityLabel = "records", searchPlaceholder,
    filters: filterDefs = [],
    statCards = [],
    export: exportDef,
    actionColumn: rawActionColumn,
    renderModal,
    defaultPageSize = 10,
    pageSizeOptions,
  } = config;


  const [query,         setQuery]         = useState("");
  const [filters,       setFilters]       = useState<Record<string, string>>(
    Object.fromEntries(filterDefs.map((f) => [f.key, ""]))
  );
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [page,          setPage]          = useState(1);
  const [pageSize,      setPageSize]      = useState(defaultPageSize);
  const [sortField,     setSortField]     = useState<string | undefined>();
  const [sortDir,       setSortDir]       = useState<"asc" | "desc">("asc");
  const [selected,      setSelected]      = useState<T | null>(null);
  const [showFilters,   setShowFilters]   = useState(false);

 
  const { data, total, totalPages, facets, stats, isLoading, error } = useDataPage<T>({
    endpoint, query, filters, columnFilters, page, rowsPerPage: pageSize, sortField, sortDir,
  });

 
  const handleSearch       = (q: string)                 => { setQuery(q);                               setPage(1); };
  const handleFilter       = (key: string, val: string)  => { setFilters((p) => ({ ...p, [key]: val })); setPage(1); };
  const handleColumnFilter = (col: keyof T, val: string) => { setColumnFilters((p) => ({ ...p, [String(col)]: val })); setPage(1); };
  const handleSort         = (field: keyof T) => {
    const f = String(field);
    if (sortField === f) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(f); setSortDir("asc"); }
    setPage(1);
  };
  const clearAll = () => {
    setQuery("");
    setFilters(Object.fromEntries(filterDefs.map((f) => [f.key, ""])));
    setColumnFilters({});
    setPage(1);
  };

  const hasFilters  = !!(query || Object.values(filters).some(Boolean) || Object.values(columnFilters).some(Boolean));
  const filterCount = [query, ...Object.values(filters), ...Object.values(columnFilters)].filter(Boolean).length;

  const exportParams: Record<string, string> = {
    ...(query ? { q: query } : {}),
    ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
    ...Object.fromEntries(Object.entries(columnFilters).filter(([, v]) => v).map(([k, v]) => [`col_${k}`, v])),
    ...(sortField ? { sortField } : {}),
    ...(sortDir   ? { sortDir   } : {}),
  };

  const actionColumn = rawActionColumn && renderModal
    ? {
        label: rawActionColumn.label,
        render: (row: T) => (
          <span onClick={() => setSelected(row)} style={{ display: "contents" }}>
            {rawActionColumn.render(row)}
          </span>
        ),
      }
    : rawActionColumn;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-violet-50/10">
        <style>{`@media print { .no-print { display: none !important; } }`}</style>

        <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-5">

          <div className="no-print flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {titleIcon && (
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                  {titleIcon}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                
              </div>
            </div>

            {(exportDef || true) && (
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => window.print()}
                      className="border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 gap-1.5">
                      <Printer className="h-4 w-4" /><span className="hidden sm:inline">Print</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Print</TooltipContent>
                </Tooltip>

                {exportDef && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm"
                          onClick={() => downloadFile(buildExportUrl(exportDef.endpoint, exportParams, "csv"), exportDef.csvFilename ?? "export.csv")}
                          className="border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 gap-1.5">
                          <Download className="h-4 w-4" /><span className="hidden sm:inline">CSV</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download CSV</TooltipContent>
                    </Tooltip>
      
                  </>
                )}
              </div>
            )}
          </div>

          {statCards.length > 0 && stats && (
            <div className="no-print grid grid-cols-2 lg:grid-cols-4 gap-3">
              {statCards.map(({ statKey, label, icon: Icon, iconBg, iconColor, valueColor }) => (
                <Card key={statKey} className="border-0 shadow-sm bg-white">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${valueColor}`}>
                        {Number(stats[statKey] ?? 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">{label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card className="no-print border-0 shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-card space-y-3">

              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder={searchPlaceholder ?? `Search ${entityLabel}…`}
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-9 pr-9 bg-white border-indigo-200 focus-visible:ring-indigo-400"
                  />
                  {query && (
                    <Button variant="ghost" size="icon" onClick={() => handleSearch("")}
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {filterDefs.length > 0 && (
                  <Button
                    variant={showFilters || hasFilters ? "default" : "outline"} size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="gap-1.5 flex-shrink-0 border-indigo-200"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {filterCount > 0 && (
                      <span className="ml-0.5 h-4 px-1.5 text-[10px] bg-white/30 text-white rounded-full flex items-center">
                        {filterCount}
                      </span>
                    )}
                  </Button>
                )}

                {hasFilters && (
                  <Button variant="outline" size="sm" onClick={clearAll}
                    className="gap-1.5 flex-shrink-0 text-destructive border-destructive/30 hover:bg-destructive/10">
                    <X className="h-3.5 w-3.5" /> Clear
                  </Button>
                )}

                {isLoading && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" /> Searching…
                  </span>
                )}
              </div>

              {showFilters && filterDefs.length > 0 && (
                <>
                  <Separator />
                  <div className="flex flex-wrap gap-2">
                    {filterDefs.map((f) => {
                      const options = f.staticOptions ?? facets?.[f.key] ?? [];
                      return (
                        <Select
                          key={f.key}
                          value={filters[f.key] || "all"}
                          onValueChange={(v) => handleFilter(f.key, v === "all" ? "" : v)}
                        >
                          <SelectTrigger className="w-[150px] bg-white border-indigo-200 text-sm">
                            <SelectValue placeholder={f.label} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All {f.label}s</SelectItem>
                            {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      );
                    })}
                  </div>
                </>
              )}

              {!isLoading && (
                <p className="text-xs text-muted-foreground">
                  {hasFilters
                    ? <><span className="font-semibold text-indigo-600">{total.toLocaleString()}</span> results found</>
                    : <><span className="font-semibold text-foreground">{total.toLocaleString()}</span> {entityLabel}</>}
                </p>
              )}

              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-md">
                  ⚠️ {error}
                </div>
              )}
            </div>
          </Card>

        
          <PaginatedTable<T>
            columns={columns}
            data={isLoading ? [] : data}
            loading={isLoading}
            pageIndex={page}
            pageSize={pageSize}
            setPageIndex={setPage}
            setPageSize={(s) => { setPageSize(s); setPage(1); }}
            total={total}
            sortField={sortField as keyof T | undefined}
            sortDir={sortDir}
            onSort={handleSort}
            columnFilters={columnFilters as Partial<Record<keyof T, string>>}
            onColumnFilterChange={handleColumnFilter}
            actionColumn={actionColumn}
            getRowKey={getRowKey}
            emptyMessage={`No ${entityLabel} found`}
            pageSizeOptions={pageSizeOptions}
          />
        </div>
      </div>

      {renderModal?.(selected, () => setSelected(null))}
    </TooltipProvider>
  );
}
