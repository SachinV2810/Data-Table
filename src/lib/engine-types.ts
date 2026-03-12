
export interface EngineIndexes<T> {
  records:    T[];
  totalCount: number;
  facetIndex: Map<string, Map<string, Set<number>>>;
}
