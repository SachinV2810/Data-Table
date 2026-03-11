import { Student } from "./types";

class PrefixIndex {
  private sortedTokens: string[] = [];
  private tokenToIds: Map<string, Set<number>> = new Map();

  build(tokenMap: Map<string, Set<number>>) {
    this.tokenToIds = tokenMap;
    this.sortedTokens = Array.from(tokenMap.keys()).sort();
  }

  lookup(prefix: string): Set<number> {
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

class StudentSearchEngine {
  private students: Student[] = [];
  private allIdxs: Set<number> = new Set();
  private invertedIndex: Map<string, Set<number>> = new Map();
  private prefixIndex: PrefixIndex = new PrefixIndex();
  private deptIndex: Map<string, Set<number>> = new Map();
  private semesterIndex: Map<string, Set<number>> = new Map();
  private statusIndex: Map<string, Set<number>> = new Map();
  private courseIndex: Map<string, Set<number>> = new Map();
  private columnIndex: Map<keyof Student, Map<string, Set<number>>> = new Map();
  private _facets: SearchResult["facets"] | null = null;
  private _stats: SearchResult["stats"] | null = null;
  private initialized = false;

  build(students: Student[]) {
    console.time("[SearchEngine] build");
    this.students = students;
    this.allIdxs = new Set();
    this.invertedIndex.clear();
    this.prefixIndex.clear();
    this.deptIndex.clear();
    this.semesterIndex.clear();
    this.statusIndex.clear();
    this.courseIndex.clear();
    this.columnIndex.clear();
    this._facets = null;
    this._stats = null;

    const COLUMN_KEYS: (keyof Student)[] = [
      "rollNo", "name", "email", "contact", "course",
      "department", "subjects", "status", "semester",
    ];

    for (const key of COLUMN_KEYS) {
      this.columnIndex.set(key, new Map());
    }

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      this.allIdxs.add(i);

      const fullText = [
        s.rollNo, s.name, s.email, s.contact,
        s.course, s.department, s.subjects, s.status,
        String(s.semester),
      ].join(" ").toLowerCase();

      for (const token of this.tokenize(fullText)) {
        if (!this.invertedIndex.has(token)) this.invertedIndex.set(token, new Set());
        this.invertedIndex.get(token)!.add(i);
      }

      this.addToBitmapIndex(this.deptIndex, s.department, i);
      this.addToBitmapIndex(this.semesterIndex, String(s.semester), i);
      this.addToBitmapIndex(this.statusIndex, s.status, i);
      this.addToBitmapIndex(this.courseIndex, s.course, i);

      for (const key of COLUMN_KEYS) {
        const colMap = this.columnIndex.get(key)!;
        for (const tok of this.tokenize(String(s[key]).toLowerCase(), 1)) {
          if (!colMap.has(tok)) colMap.set(tok, new Set());
          colMap.get(tok)!.add(i);
        }
      }
    }

    this.initialized = true;
    this.prefixIndex.build(this.invertedIndex);
    console.timeEnd("[SearchEngine] build");
    console.log(`[SearchEngine] Indexed ${students.length} students, ${this.invertedIndex.size} tokens`);
  }

  search(params: SearchParams): SearchResult {
    if (!this.initialized) throw new Error("SearchEngine not initialized. Call build() first.");

    const {
      query = "", department = "", semester = "", status = "", course = "",
      columnFilters = {}, page = 1, rowsPerPage = 10, sortField, sortDir = "asc",
    } = params;

    let resultIdxs: Set<number> = this.allIdxs;
    const semesterKey = semester ? String(semester) : "";


    if (query.trim())  resultIdxs = this.intersect(resultIdxs, this.searchText(query.trim().toLowerCase()));
    if (department)    resultIdxs = this.intersect(resultIdxs, this.deptIndex.get(department) ?? new Set());
    if (semesterKey)      resultIdxs = this.intersect(resultIdxs, this.semesterIndex.get(semesterKey) ?? new Set());
    if (status)        resultIdxs = this.intersect(resultIdxs, this.statusIndex.get(status) ?? new Set());
    if (course)        resultIdxs = this.intersect(resultIdxs, this.courseIndex.get(course) ?? new Set());

    const EXACT_COLS: (keyof Student)[] = ["semester", "id"];
    for (const [key, val] of Object.entries(columnFilters)) {
      if (!val?.trim()) continue;
      const colMap = this.columnIndex.get(key as keyof Student);
      if (!colMap) continue;
      resultIdxs = this.intersect(
        resultIdxs,
        this.searchColumnText(colMap, val.trim().toLowerCase(), EXACT_COLS.includes(key as keyof Student))
      );
    }

    let matched: Student[] = [];
    for (const idx of resultIdxs) matched.push(this.students[idx]);

    if (sortField) matched = this.sort(matched, sortField, sortDir);

    const total = matched.length;
    const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const data = matched.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

    return { data, total, page: safePage, rowsPerPage, totalPages, facets: this.getFacets(), stats: this.getStats() };
  }

  private searchText(query: string): Set<number> {
    const tokens = this.tokenize(query);
    if (tokens.length === 0) return this.allIdxs;
    let result: Set<number> | null = null;
    for (const token of tokens) {
      const matches = this.prefixIndex.lookup(token);
      result = result === null ? matches : this.intersect(result, matches);
      if (result.size === 0) return result;
    }
    return result ?? this.allIdxs;
  }

  private searchColumnText(colMap: Map<string, Set<number>>, query: string, exact = false): Set<number> {
    const tokens = this.tokenize(query, 1);
    if (tokens.length === 0) return this.allIdxs;

    if (exact) {
      const result = new Set<number>();
      for (const token of tokens) {
        const ids = colMap.get(token);
        if (ids) for (const id of ids) result.add(id);
      }
      return result;
    }

    const KEY = "__prefixIndex__";
    let colPrefix = (colMap as any)[KEY] as PrefixIndex | undefined;
    if (!colPrefix) {
      colPrefix = new PrefixIndex();
      colPrefix.build(colMap);
      (colMap as any)[KEY] = colPrefix;
    }

    let result: Set<number> | null = null;
    for (const token of tokens) {
      const matches = colPrefix.lookup(token);
      result = result === null ? matches : this.intersect(result, matches);
      if (result.size === 0) return result;
    }
    return result ?? this.allIdxs;
  }

  private tokenize(text: string, minLen = 1): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length >= minLen);
  }

  private addToBitmapIndex(index: Map<string, Set<number>>, key: string, id: number) {
    if (!index.has(key)) index.set(key, new Set());
    index.get(key)!.add(id);
  }

  private intersect(a: Set<number>, b: Set<number>): Set<number> {
    const [small, large] = a.size <= b.size ? [a, b] : [b, a];
    const result = new Set<number>();
    for (const id of small) if (large.has(id)) result.add(id);
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
    return this.students.find(s => s.id === id) ?? null;
  }

  isReady() { return this.initialized; }

  invalidate() { this.initialized = false; }
}

declare global {
  // eslint-disable-next-line no-var
  var __studentEngine: StudentSearchEngine | undefined;
  var __studentEngineFilePath: string | undefined;
  var __studentEngineMtime: number | undefined;
}

export function getSearchEngine(): StudentSearchEngine {
  if (!global.__studentEngine) global.__studentEngine = new StudentSearchEngine();
  return global.__studentEngine;
}

export function getEngineFileMeta(): { filePath: string | null; mtime: number } {
  return { filePath: global.__studentEngineFilePath ?? null, mtime: global.__studentEngineMtime ?? 0 };
}

export function setEngineFileMeta(filePath: string, mtime: number): void {
  global.__studentEngineFilePath = filePath;
  global.__studentEngineMtime = mtime;
}
