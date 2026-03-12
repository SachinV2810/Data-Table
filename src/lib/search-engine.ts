import { EngineIndexes } from "./engine-types";


class PrefixIndex {
  private sortedTokens: string[] = [];
  private tokenToIds: Map<string, Set<number>> = new Map();

  build(tokenMap: Map<string, Set<number>>) {
    this.tokenToIds = tokenMap;
    this.sortedTokens = Array.from(tokenMap.keys()).sort();
  }

  lookup(prefix: string): Set<number> {
    const result = new Set<number>();
    const lo  = this.lowerBound(prefix);
    const end = prefix.slice(0, -1) + String.fromCharCode(prefix.charCodeAt(prefix.length - 1) + 1);
    for (let i = lo; i < this.sortedTokens.length; i++) {
      const tok = this.sortedTokens[i];
      if (tok >= end) break;
      if (tok.startsWith(prefix)) {
        const ids = this.tokenToIds.get(tok)!;
        ids.forEach((id) => result.add(id));
      }
    }
    return result;
  }

  private lowerBound(prefix: string): number {
    let lo = 0, hi = this.sortedTokens.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.sortedTokens[mid] < prefix) lo = mid + 1; else hi = mid;
    }
    return lo;
  }

  clear() { this.sortedTokens = []; this.tokenToIds.clear(); }
}



export interface SearchParams {
  query?:        string;
  filters?:      Record<string, string>;
  columnFilters?: Record<string, string>;
  exactCols?:    string[];
  page?:         number;
  rowsPerPage?:  number;
  sortField?:    string;
  sortDir?:      "asc" | "desc";
}

export interface SearchResult<T> {
  data:       T[];
  total:      number;
  page:       number;
  rowsPerPage: number;
  totalPages: number;
  facets:     Record<string, string[]>;
  stats:      Record<string, number>;
}

export interface EngineConfig<T> {

  searchFields: (keyof T)[];
  facetFields: (keyof T)[];
  columnFields: (keyof T)[];
  exactMatchFields?: (keyof T)[];
  facetSort?: Partial<Record<string, "alpha" | "numeric">>;

 
  stats: Record<string, (indexes: EngineIndexes<T>) => number>;
}


export class GenericSearchEngine<T extends Record<string, unknown>> {
  private records:       T[]      = [];
  private allIdxs:       Set<number> = new Set();
  private invertedIndex: Map<string, Set<number>> = new Map();
  private prefixIndex:   PrefixIndex = new PrefixIndex();

  private facetIndex:    Map<string, Map<string, Set<number>>> = new Map();
  private columnIndex:   Map<string, Map<string, Set<number>>> = new Map();

  private _facets: Record<string, string[]> | null = null;
  private _stats:  Record<string, number>  | null = null;

  private config!: EngineConfig<T>;
  private initialized = false;


  build(records: T[], config: EngineConfig<T>) {
    console.time("[SearchEngine] build");

    this.config        = config;
    this.records       = records;
    this.allIdxs       = new Set();
    this._facets       = null;
    this._stats        = null;
    this.invertedIndex.clear();
    this.prefixIndex.clear();
    this.facetIndex.clear();
    this.columnIndex.clear();

    for (const key of config.facetFields)  this.facetIndex.set(String(key),  new Map());
    for (const key of config.columnFields) this.columnIndex.set(String(key), new Map());

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      this.allIdxs.add(i);

      const text = config.searchFields.map((f) => String(r[f] ?? "")).join(" ").toLowerCase();
      for (const tok of this.tokenize(text)) {
        if (!this.invertedIndex.has(tok)) this.invertedIndex.set(tok, new Set());
        this.invertedIndex.get(tok)!.add(i);
      }

      for (const key of config.facetFields) {
        const k   = String(key);
        const val = String(r[key] ?? "");
        const map = this.facetIndex.get(k)!;
        if (!map.has(val)) map.set(val, new Set());
        map.get(val)!.add(i);
      }

      for (const key of config.columnFields) {
        const k      = String(key);
        const colMap = this.columnIndex.get(k)!;
        for (const tok of this.tokenize(String(r[key] ?? ""), 1)) {
          if (!colMap.has(tok)) colMap.set(tok, new Set());
          colMap.get(tok)!.add(i);
        }
      }
    }

    this.prefixIndex.build(this.invertedIndex);
    this.initialized = true;

    console.timeEnd("[SearchEngine] build");
    console.log(`[SearchEngine] Indexed ${records.length} records, ${this.invertedIndex.size} tokens`);
  }

  

  search(params: SearchParams): SearchResult<T> {
    if (!this.initialized) throw new Error("Engine not initialized — call build() first.");

    const {
      query        = "",
      filters      = {},
      columnFilters = {},
      exactCols    = this.config.exactMatchFields?.map(String) ?? [],
      page         = 1,
      rowsPerPage  = 10,
      sortField,
      sortDir      = "asc",
    } = params;

    let result: Set<number> = this.allIdxs;

    if (query.trim()) result = this.intersect(result, this.searchText(query.trim().toLowerCase()));

    
    for (const [key, val] of Object.entries(filters)) {
      if (!val) continue;
      const map = this.facetIndex.get(key);
      result = this.intersect(result, map?.get(val) ?? new Set());
    }

 
    for (const [key, val] of Object.entries(columnFilters)) {
      if (!val?.trim()) continue;
      const colMap = this.columnIndex.get(key);
      if (!colMap) continue;
      const exact = exactCols.includes(key);
      result = this.intersect(result, this.searchColumnText(colMap, val.trim().toLowerCase(), exact));
    }

  
    let matched: T[] = [];
    result.forEach((idx) => matched.push(this.records[idx]));

   
    if (sortField) {
      matched = [...matched].sort((a, b) => {
        const cmp = String(a[sortField] ?? "").localeCompare(String(b[sortField] ?? ""), undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }


    const total      = matched.length;
    const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
    const safePage   = Math.min(Math.max(1, page), totalPages);
    const data       = matched.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

    return { data, total, page: safePage, rowsPerPage, totalPages, facets: this.getFacets(), stats: this.getStats() };
  }

  findById(id: unknown, idField: keyof T = "id" as keyof T): T | null {
    return this.records.find((r) => r[idField] === id) ?? null;
  }

 

  private searchText(query: string): Set<number> {
    const tokens = this.tokenize(query);
    if (!tokens.length) return this.allIdxs;
    let res: Set<number> | null = null;
    for (const tok of tokens) {
      const m = this.prefixIndex.lookup(tok);
      res = res === null ? m : this.intersect(res, m);
      if (res.size === 0) return res;
    }
    return res ?? this.allIdxs;
  }

  private searchColumnText(colMap: Map<string, Set<number>>, query: string, exact: boolean): Set<number> {
    const tokens = this.tokenize(query, 1);
    if (!tokens.length) return this.allIdxs;

    if (exact) {
      const res = new Set<number>();
      tokens.forEach((tok) => {
        const ids = colMap.get(tok);
        if (ids) ids.forEach((id) => res.add(id));
      });
      return res;
    }

    const KEY = "__px__";
    let px = (colMap as any)[KEY] as PrefixIndex | undefined;
    if (!px) { px = new PrefixIndex(); px.build(colMap); (colMap as any)[KEY] = px; }

    let res: Set<number> | null = null;
    for (const tok of tokens) {
      const m = px.lookup(tok);
      res = res === null ? m : this.intersect(res, m);
      if (res.size === 0) return res;
    }
    return res ?? this.allIdxs;
  }

  private tokenize(text: string, minLen = 1): string[] {
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((t) => t.length >= minLen);
  }

  private intersect(a: Set<number>, b: Set<number>): Set<number> {
    const [small, large] = a.size <= b.size ? [a, b] : [b, a];
    const res = new Set<number>();
    small.forEach((id) => {
      if (large.has(id)) res.add(id);
    });
    return res;
  }

  private getFacets(): Record<string, string[]> {
    if (this._facets) return this._facets;
    const facets: Record<string, string[]> = {};
    this._facets = facets;
    this.facetIndex.forEach((map, key) => {
      const sort = this.config.facetSort?.[key] ?? "alpha";
      facets[key] = Array.from(map.keys()).sort(
        sort === "numeric" ? (a, b) => Number(a) - Number(b) : undefined
      );
    });
    return facets;
  }

  private getStats(): Record<string, number> {
    if (this._stats) return this._stats;
    const indexes: EngineIndexes<T> = {
      records:    this.records,
      totalCount: this.records.length,
      facetIndex: this.facetIndex,
    };
    this._stats = {};
    for (const [key, fn] of Object.entries(this.config.stats)) {
      this._stats[key] = fn(indexes);
    }
    return this._stats;
  }

  isReady()    { return this.initialized; }
  invalidate() { this.initialized = false; }
}

declare global {

  var __engineRegistry: Map<string, GenericSearchEngine<any>> | undefined;
}

function getRegistry(): Map<string, GenericSearchEngine<any>> {
  if (!global.__engineRegistry) global.__engineRegistry = new Map();
  return global.__engineRegistry;
}

export function getEngine<T extends Record<string, unknown>>(name: string): GenericSearchEngine<T> {
  const reg = getRegistry();
  if (!reg.has(name)) reg.set(name, new GenericSearchEngine<T>());
  return reg.get(name) as GenericSearchEngine<T>;
}
