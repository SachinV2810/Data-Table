export interface Student {
  id: number;
  rollNo: string;
  course: string;
  department: string;
  semester: number;
  name: string;
  email: string;
  contact: string;
  subjects: string;
  status: "Active" | "Inactive";
}

export type SortField = keyof Student;
export type SortDirection = "asc" | "desc";

export interface FilterState {
  department: string;
  semester: string;
  status: string;
  course: string;
}

export interface PaginationState {
  page: number;
  rowsPerPage: number;
}
