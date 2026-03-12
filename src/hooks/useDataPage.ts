"use client";
import { useState, useEffect, useCallback, useRef } from "react";

export interface UseDataPageParams {
  endpoint: string;
  query: string;
  filters: Record<string, string>;
  columnFilters: Record<string, string>;
  page: number;
  rowsPerPage: number;
  sortField?: string;
  sortDir?: "asc" | "desc";
}

export interface UseDataPageResult<T> {
  data: T[];
  total: number;
  totalPages: number;
  facets: Record<string, string[]> | null;
  stats: Record<string, number> | null;
  isLoading: boolean;
  error: string | null;
}

function buildUrl(params: UseDataPageParams): string {
  const sp = new URLSearchParams();
  if (params.query) sp.set("q", params.query);
  for (const [k, v] of Object.entries(params.filters))       if (v) sp.set(k, v);
  for (const [k, v] of Object.entries(params.columnFilters)) if (v?.trim()) sp.set(`col_${k}`, v);
  sp.set("page",  String(params.page));
  sp.set("limit", String(params.rowsPerPage));
  if (params.sortField) sp.set("sortField", params.sortField);
  if (params.sortDir)   sp.set("sortDir",   params.sortDir);
  return `${params.endpoint}?${sp.toString()}`;
}

export function useDataPage<T>(params: UseDataPageParams): UseDataPageResult<T> {
  const [data,       setData]       = useState<T[]>([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [facets,     setFacets]     = useState<Record<string, string[]> | null>(null);
  const [stats,      setStats]      = useState<Record<string, number>  | null>(null);
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  const timer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abort  = useRef<AbortController | null>(null);

  const fetch_ = useCallback((p: UseDataPageParams) => {
    abort.current?.abort();
    abort.current = new AbortController();
    setIsLoading(true);
    setError(null);

    fetch(buildUrl(p), { signal: abort.current.signal })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((res) => {
        setData(res.data       ?? []);
        setTotal(res.total     ?? 0);
        setTotalPages(res.totalPages ?? 1);
        setFacets(res.facets   ?? null);
        setStats(res.stats     ?? null);
        setIsLoading(false);
      })
      .catch((e) => { if (e.name !== "AbortError") { setError(String(e.message ?? e)); setIsLoading(false); } });
  }, []); 

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fetch_(params), 120);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [ 
    params.endpoint, params.query,
    JSON.stringify(params.filters),
    JSON.stringify(params.columnFilters),
    params.page, params.rowsPerPage,
    params.sortField, params.sortDir,
  ]);

  return { data, total, totalPages, facets, stats, isLoading, error };
}
