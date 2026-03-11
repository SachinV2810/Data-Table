/**
 * StudentSearchEngine
 *
 * High-performance server-side search & filter engine designed for 100k+ records.
 *
 * Architecture:
 * - Inverted index: token → Set<id> for fast full-text lookup
 * - Bitmap index (Map<value, Set<id>>) for O(1) categorical filters
 * - Column-specific inverted indices for per-column text search
 * - All filtering is set-intersection — no row-by-row scanning
 * - Singleton pattern: built once at startup, reused across requests
 */

import { Student } from "./types";

// ─── Prefix Index (sorted token array + binary search) ───────────────────────
// Replaces the O(n) linear scan with O(log n) binary search + contiguous slice.

class PrefixIndex {
  private sortedTokens: string[] = [];
  private tokenToIds: Map<string, Set<number>> = new Map();

  build(tokenMap: Map<string, Set<number>>) {
    this.tokenToIds = tokenMap;
    this.sortedTokens = Array.from(tokenMap.keys()).sort();
  }

  /** Returns union of all id-sets whose token starts with `prefix`. O(log n + k) */
  lookup(prefix: string): Set<number> {
    // Exact match fast path
    if (this.tokenToIds.has(prefix)) {
      const exact = this.tokenToIds.get(prefix)!;
      // Still collect prefix matches too for completeness
    }

    const result = new Set<number>();
    const lo = this.lowerBound(prefix);
    const end = prefix.slice(0, -1) + String.fromCharCode(prefix.charCodeAt(prefix.length - 1) + 1);

    for (let i = lo; i < this.sortedTokens.length; i++) {
      const tok = this.sortedTokens[i];
      if (tok >= end) break;
      if (tok.startsWith(prefix)) {
        for (const id of this.tokenToIds.get(tok)!) result.add(id);
      }
    }
    return result;
  }

  private lowerBound(prefix: string): number {
    let lo = 0, hi = this.sortedTokens.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.sortedTokens[mid] < prefix) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  clear() {
    this.sortedTokens = [];
    this.tokenToIds.clear();
  }
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SearchParams {
  query?: string;
  department?: string;
  semester?: string;
  status?: string;
  course?: string;
  columnFilters?: Partial<Record<keyof Student, string>>;
  page?: number;
  rowsPerPage?: number;
  sortField?: keyof Student;
  sortDir?: "asc" | "desc";
}

export interface SearchResult {
  data: Student[];
  total: number;
  page: number;
  rowsPerPage: number;
  totalPages: number;
  facets: {
    departments: string[];
    semesters: string[];
    statuses: string[];
    courses: string[];
  };
  stats: {
    total: number;
    active: number;
    inactive: number;
    departments: number;
  };
}

// ─── Engine ─────────────────────────────────────────────────────────────────

class StudentSearchEngine {
  private students: Student[] = [];
  private allIds: Set<number> = new Set();

  // Full-text inverted index: token → Set of student ids
  private invertedIndex: Map<string, Set<number>> = new Map();
  // Fast prefix index built from invertedIndex
  private prefixIndex: PrefixIndex = new PrefixIndex();

  // Bitmap (categorical) indexes for O(1) filter lookup
  private deptIndex: Map<string, Set<number>> = new Map();
  private semesterIndex: Map<string, Set<number>> = new Map();
  private statusIndex: Map<string, Set<number>> = new Map();
  private courseIndex: Map<string, Set<number>> = new Map();

  // Per-column inverted indexes for column filter feature
  private columnIndex: Map<keyof Student, Map<string, Set<number>>> = new Map();

  // Id → array index for O(1) student lookup
  private idToIndex: Map<number, number> = new Map();

  // Facet caches
  private _facets: SearchResult["facets"] | null = null;
  private _stats: SearchResult["stats"] | null = null;

  private initialized = false;

  // ─── Build Index ─────────────────────────────────────────────────────────

  build(students: Student[]) {
    console.time("[SearchEngine] build");
    this.students = students;
    this.allIds = new Set();
    this.invertedIndex.clear();
    this.prefixIndex.clear();
    this.deptIndex.clear();
    this.semesterIndex.clear();
    this.statusIndex.clear();
    this.courseIndex.clear();
    this.columnIndex.clear();
    this.idToIndex.clear();
    this._facets = null;
    this._stats = null;

    const COLUMN_KEYS: (keyof Student)[] = [
      "rollNo", "name", "email", "contact", "course",
      "department", "subjects", "status",
    ];

    for (const key of COLUMN_KEYS) {
      this.columnIndex.set(key, new Map());
    }

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const id = s.id;

      this.allIds.add(id);
      this.idToIndex.set(id, i);

      // ── Full-text tokens ──
      const fullText = [
        s.rollNo, s.name, s.email, s.contact,
        s.course, s.department, s.subjects, s.status,
        String(s.semester),
      ].join(" ").toLowerCase();

      const tokens = this.tokenize(fullText);
      for (const token of tokens) {
        if (!this.invertedIndex.has(token)) {
          this.invertedIndex.set(token, new Set());
        }
        this.invertedIndex.get(token)!.add(id);
      }

      // ── Bitmap indexes ──
      this.addToBitmapIndex(this.deptIndex, s.department, id);
      this.addToBitmapIndex(this.semesterIndex, String(s.semester), id);
      this.addToBitmapIndex(this.statusIndex, s.status, id);
      this.addToBitmapIndex(this.courseIndex, s.course, id);

      // ── Per-column indexes ──
      for (const key of COLUMN_KEYS) {
        const colMap = this.columnIndex.get(key)!;
        const val = String(s[key]).toLowerCase();
        const colTokens = this.tokenize(val);
        for (const tok of colTokens) {
          if (!colMap.has(tok)) colMap.set(tok, new Set());
          colMap.get(tok)!.add(id);
        }
      }
    }

    this.initialized = true;
    // Build prefix index from the completed inverted index
    this.prefixIndex.build(this.invertedIndex);
    console.timeEnd("[SearchEngine] build");
    console.log(`[SearchEngine] Indexed ${students.length} students, ${this.invertedIndex.size} tokens`);
  }

  // ─── Search ──────────────────────────────────────────────────────────────

  search(params: SearchParams): SearchResult {
    if (!this.initialized) {
      throw new Error("SearchEngine not initialized. Call build() first.");
    }

    const {
      query = "",
      department = "",
      semester = "",
      status = "",
      course = "",
      columnFilters = {},
      page = 1,
      rowsPerPage = 10,
      sortField,
      sortDir = "asc",
    } = params;

    // Start with all IDs — intersect returns a new Set each time so allIds is never mutated
    let resultIds: Set<number> = this.allIds;

    // ── Full-text search ──
    if (query.trim()) {
      const queryIds = this.searchText(query.trim().toLowerCase());
      resultIds = this.intersect(resultIds, queryIds);
    }

    // ── Categorical filters (bitmap lookup) ──
    if (department) {
      resultIds = this.intersect(resultIds, this.deptIndex.get(department) ?? new Set());
    }
    if (semester) {
      resultIds = this.intersect(resultIds, this.semesterIndex.get(semester) ?? new Set());
    }
    if (status) {
      resultIds = this.intersect(resultIds, this.statusIndex.get(status) ?? new Set());
    }
    if (course) {
      resultIds = this.intersect(resultIds, this.courseIndex.get(course) ?? new Set());
    }

    // ── Column filters ──
    for (const [key, val] of Object.entries(columnFilters)) {
      if (!val || !val.trim()) continue;
      const colKey = key as keyof Student;
      const colMap = this.columnIndex.get(colKey);
      if (!colMap) continue;

      const colIds = this.searchColumnText(colMap, val.trim().toLowerCase());
      resultIds = this.intersect(resultIds, colIds);
    }

    // ── Materialize matched students ──
    let matched: Student[] = [];
    for (const id of resultIds) {
      const idx = this.idToIndex.get(id);
      if (idx !== undefined) matched.push(this.students[idx]);
    }

    // ── Sort ──
    if (sortField) {
      matched = this.sort(matched, sortField, sortDir);
    }

    // ── Paginate ──
    const total = matched.length;
    const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * rowsPerPage;
    const data = matched.slice(start, start + rowsPerPage);

    return {
      data,
      total,
      page: safePage,
      rowsPerPage,
      totalPages,
      facets: this.getFacets(),
      stats: this.getStats(),
    };
  }

  // ─── Full-text search using inverted index ────────────────────────────────

  private searchText(query: string): Set<number> {
    const tokens = this.tokenize(query);
    if (tokens.length === 0) return this.allIds; // no clone — read-only

    let result: Set<number> | null = null;
    for (const token of tokens) {
      const matches = this.prefixIndex.lookup(token);
      result = result === null ? matches : this.intersect(result, matches);
      if (result.size === 0) return result;
    }
    return result ?? this.allIds;
  }

  private getTokenMatches(token: string): Set<number> {
    return this.prefixIndex.lookup(token);
  }

  private searchColumnText(colMap: Map<string, Set<number>>, query: string): Set<number> {
    const tokens = this.tokenize(query);
    if (tokens.length === 0) return this.allIds;

    // Build a per-column prefix index on demand (cached on the map itself)
    const colPrefixKey = "__prefixIndex__";
    let colPrefix = (colMap as any)[colPrefixKey] as PrefixIndex | undefined;
    if (!colPrefix) {
      colPrefix = new PrefixIndex();
      colPrefix.build(colMap);
      (colMap as any)[colPrefixKey] = colPrefix;
    }

    let result: Set<number> | null = null;
    for (const token of tokens) {
      const matches = colPrefix.lookup(token);
      result = result === null ? matches : this.intersect(result, matches);
      if (result.size === 0) return result;
    }
    return result ?? this.allIds;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 2);
  }

  private addToBitmapIndex(index: Map<string, Set<number>>, key: string, id: number) {
    if (!index.has(key)) index.set(key, new Set());
    index.get(key)!.add(id);
  }

  private intersect(a: Set<number>, b: Set<number>): Set<number> {
    // Always iterate the smaller set
    const [small, large] = a.size <= b.size ? [a, b] : [b, a];
    const result = new Set<number>();
    for (const id of small) {
      if (large.has(id)) result.add(id);
    }
    return result;
  }

  private sort(students: Student[], field: keyof Student, dir: "asc" | "desc"): Student[] {
    return [...students].sort((a, b) => {
      const cmp = String(a[field]).localeCompare(String(b[field]), undefined, { numeric: true });
      return dir === "asc" ? cmp : -cmp;
    });
  }

  private getFacets(): SearchResult["facets"] {
    if (this._facets) return this._facets;
    this._facets = {
      departments: Array.from(this.deptIndex.keys()).sort(),
      semesters: Array.from(this.semesterIndex.keys()).sort((a, b) => Number(a) - Number(b)),
      statuses: Array.from(this.statusIndex.keys()).sort(),
      courses: Array.from(this.courseIndex.keys()).sort(),
    };
    return this._facets;
  }

  private getStats(): SearchResult["stats"] {
    if (this._stats) return this._stats;
    this._stats = {
      total: this.students.length,
      active: this.statusIndex.get("Active")?.size ?? 0,
      inactive: this.statusIndex.get("Inactive")?.size ?? 0,
      departments: this.deptIndex.size,
    };
    return this._stats;
  }

  getStudentById(id: number): Student | null {
    const idx = this.idToIndex.get(id);
    return idx !== undefined ? this.students[idx] : null;
  }

  isReady() {
    return this.initialized;
  }

  /** Force a full rebuild on the next request (used by the reload API). */
  invalidate() {
    this.initialized = false;
    console.log("[SearchEngine] Invalidated — will rebuild on next request");
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────
// Node.js module caching keeps this alive across requests in the same process.
// We also attach loadedFilePath/mtime to the global so they survive
// Next.js hot-module reloads in dev (which re-execute this module but keep `global`).

declare global {
  // eslint-disable-next-line no-var
  var __studentEngine: StudentSearchEngine | undefined;
  var __studentEngineFilePath: string | undefined;
  var __studentEngineMtime: number | undefined;
}

export function getSearchEngine(): StudentSearchEngine {
  if (!global.__studentEngine) {
    global.__studentEngine = new StudentSearchEngine();
  }
  return global.__studentEngine;
}

/** Read back the persisted file tracking state from the global. */
export function getEngineFileMeta(): { filePath: string | null; mtime: number } {
  return {
    filePath: global.__studentEngineFilePath ?? null,
    mtime:    global.__studentEngineMtime   ?? 0,
  };
}

/** Persist file tracking state to the global so it survives hot reloads. */
export function setEngineFileMeta(filePath: string, mtime: number): void {
  global.__studentEngineFilePath = filePath;
  global.__studentEngineMtime    = mtime;
}