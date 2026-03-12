"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Student, FilterState } from "@/lib/student-types";
import { SearchResult } from "@/lib/search-engine";

export interface UseStudentsParams {
  query: string;
  filters: FilterState;
  columnFilters: Partial<Record<keyof Student, string>>;
  page: number;
  rowsPerPage: number;
  sortField?: keyof Student;
  sortDir?: "asc" | "desc";
}

export interface UseStudentsResult {
  data: Student[];
  total: number;
  totalPages: number;
  facets: SearchResult<Student>["facets"] | null;
  stats: SearchResult<Student>["stats"] | null;
  isLoading: boolean;
  error: string | null;
}

function buildUrl(params: UseStudentsParams): string {
  const sp = new URLSearchParams();

  if (params.query) sp.set("q", params.query);
  if (params.filters.department) sp.set("department", params.filters.department);
  if (params.filters.semester) sp.set("semester", params.filters.semester);
  if (params.filters.status) sp.set("status", params.filters.status);
  if (params.filters.course) sp.set("course", params.filters.course);
  sp.set("page", String(params.page));
  sp.set("limit", String(params.rowsPerPage));
  if (params.sortField) sp.set("sortField", params.sortField);
  if (params.sortDir) sp.set("sortDir", params.sortDir);

  for (const [key, val] of Object.entries(params.columnFilters)) {
    if (val && val.trim()) sp.set(`col_${key}`, val);
  }

  return `/api/students?${sp.toString()}`;
}

export function useStudents(params: UseStudentsParams): UseStudentsResult {
  const [data, setData] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [facets, setFacets] = useState<SearchResult<Student>["facets"] | null>(null);
  const [stats, setStats] = useState<SearchResult<Student>["stats"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const abortController = useRef<AbortController | null>(null);

  const fetchData = useCallback(
    (p: UseStudentsParams) => {
    
      abortController.current?.abort();
      abortController.current = new AbortController();

      const url = buildUrl(p);

      setIsLoading(true);
      setError(null);

      fetch(url, { signal: abortController.current.signal })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((result: SearchResult<Student>) => {
          setData(result.data);
          setTotal(result.total);
          setTotalPages(result.totalPages);
          setFacets(result.facets);
          setStats(result.stats);
          setIsLoading(false);
        })
        .catch((err) => {
          if (err.name === "AbortError") return; 
          setError(String(err.message ?? err));
          setIsLoading(false);
        });
    },
    []
  );

  useEffect(() => {
  
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchData(params), 120);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  
  }, [
    params.query,
    params.filters.department,
    params.filters.semester,
    params.filters.status,
    params.filters.course,
    JSON.stringify(params.columnFilters),
    params.page,
    params.rowsPerPage,
    params.sortField,
    params.sortDir,
  ]);

  return { data, total, totalPages, facets, stats, isLoading, error };
}
