import React from "react";
import { ColumnDef } from "@/components/ui/PaginatedTable";

export interface FilterDef {
  key: string;
  label: string;
  staticOptions?: string[];
}

export interface StatCardDef {
  statKey: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  valueColor: string;
}
export interface ExportDef {
  endpoint: string;
  csvFilename?: string;
  excelFilename?: string;
}


export interface DataPageConfig<T> {
  endpoint: string;
  columns: ColumnDef<T>[];
  getRowKey: (row: T) => string | number;
  title: string;
  titleIcon?: React.ReactNode;
  entityLabel?: string;
  searchPlaceholder?: string;
  filters?: FilterDef[];
  statCards?: StatCardDef[];
  export?: ExportDef;
  actionColumn?: {
    label: string;
    render: (row: T) => React.ReactNode;
  };

  renderModal?: (selected: T | null, onClose: () => void) => React.ReactNode;

  defaultPageSize?: number;
  pageSizeOptions?: number[];
}
