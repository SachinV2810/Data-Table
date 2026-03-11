import { Student, FilterState } from "./types";


export function buildSearchIndex(students: Student[]) {
  return students.map((s) => ({
    ...s,
    _searchText: [
      s.rollNo,
      s.name,
      s.email,
      s.contact,
      s.course,
      s.department,
      s.semester.toString(),
      s.subjects,
      s.status,
    ]
      .join(" ")
      .toLowerCase(),
  }));
}

export function filterStudents(
  students: ReturnType<typeof buildSearchIndex>,
  query: string,
  filters: FilterState,
  columnFilters: Partial<Record<keyof Student, string>>
) {
  const q = query.toLowerCase().trim();

  return students.filter((s) => {
    // Global search
    if (q && !s._searchText.includes(q)) return false;

    // Dropdown filters
    if (filters.department && s.department !== filters.department) return false;
    if (filters.semester && s.semester.toString() !== filters.semester) return false;
    if (filters.status && s.status !== filters.status) return false;
    if (filters.course && s.course !== filters.course) return false;

    // Column-specific filters
    for (const [key, val] of Object.entries(columnFilters)) {
      if (val && val.trim()) {
        const fieldVal = String(s[key as keyof Student]).toLowerCase();
        if (!fieldVal.includes(val.toLowerCase())) return false;
      }
    }

    return true;
  });
}

export function exportToCSV(students: Student[], filename = "students.csv") {
  const headers = ["Roll No", "Course", "Department", "Semester", "Name", "Email", "Contact", "Status", "Subjects"];
  const rows = students.map((s) => [
    s.rollNo,
    s.course,
    s.department,
    s.semester,
    s.name,
    s.email,
    s.contact,
    s.status,
    `"${s.subjects}"`,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToExcel(students: Student[], filename = "students.xlsx") {
  // Simple TSV-based Excel export (works without xlsx library)
  const headers = ["Roll No", "Course", "Department", "Semester", "Name", "Email", "Contact", "Status", "Subjects"];
  const rows = students.map((s) => [
    s.rollNo, s.course, s.department, s.semester, s.name, s.email, s.contact, s.status, s.subjects,
  ]);

  const tsv = [headers.join("\t"), ...rows.map((r) => r.join("\t"))].join("\n");
  const blob = new Blob([tsv], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function getUniqueValues<K extends keyof Student>(students: Student[], key: K): string[] {
  return Array.from(new Set(students.map((s) => String(s[key])))).sort();
}
