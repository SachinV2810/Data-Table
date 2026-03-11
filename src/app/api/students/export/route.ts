
import { NextRequest, NextResponse } from "next/server";
import { ensureEngineReady } from "@/lib/data-loader";
import { getSearchEngine } from "@/lib/search-engine";
import { Student } from "@/lib/types";

export const dynamic = "force-dynamic";

const HEADERS = [
  "Roll No", "Course", "Department", "Semester",
  "Name", "Email", "Contact", "Status", "Subjects",
];

function studentToRow(s: Student): string[] {
  return [s.rollNo, s.course, s.department, String(s.semester), s.name, s.email, s.contact, s.status, s.subjects];
}

function toCSV(students: Student[]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [
    HEADERS.map(escape).join(","),
    ...students.map((s) => studentToRow(s).map(escape).join(",")),
  ].join("\n");
}

function toTSV(students: Student[]): string {
  return [
    HEADERS.join("\t"),
    ...students.map((s) => studentToRow(s).join("\t")),
  ].join("\n");
}

export async function GET(req: NextRequest) {
  try {
    await ensureEngineReady();

    const { searchParams } = req.nextUrl;
    const format = searchParams.get("format") === "excel" ? "excel" : "csv";

    const columnFilters: Partial<Record<keyof Student, string>> = {};
    for (const [key, val] of searchParams.entries()) {
      if (key.startsWith("col_") && val.trim()) {
        columnFilters[key.slice(4) as keyof Student] = val;
      }
    }

    const result = getSearchEngine().search({
      query:      searchParams.get("q") ?? "",
      department: searchParams.get("department") ?? "",
      semester:   searchParams.get("semester") ?? "",
      status:     searchParams.get("status") ?? "",
      course:     searchParams.get("course") ?? "",
      columnFilters,
      page:       1,
      rowsPerPage: 500000, // get everything
      sortField:  (searchParams.get("sortField") as keyof Student) || undefined,
      sortDir:    (searchParams.get("sortDir") as "asc" | "desc") || "asc",
    });

    if (format === "excel") {
      const tsv = toTSV(result.data);
      return new NextResponse(tsv, {
        headers: {
          "Content-Type": "application/vnd.ms-excel; charset=utf-8",
          "Content-Disposition": `attachment; filename="students.xls"`,
        },
      });
    } else {
      const csv = toCSV(result.data);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="students.csv"`,
        },
      });
    }
  } catch (err) {
    console.error("[/api/students/export]", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
