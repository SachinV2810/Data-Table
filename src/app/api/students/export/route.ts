import { NextRequest, NextResponse } from "next/server";
import { ensureEngineReady } from "@/lib/data-loader";
import { studentLoaderConfig } from "@/lib/student-engine-config";
import { getEngine } from "@/lib/search-engine";
import { Student } from "@/lib/student-types";

export const dynamic = "force-dynamic";


const HEADERS = ["Roll No","Course","Department","Semester","Name","Email","Contact","Status","Subjects"];
const toRow    = (s: Student) => [s.rollNo, s.course, s.department, String(s.semester), s.name, s.email, s.contact, s.status, s.subjects];
const escape   = (v: string)  => `"${v.replace(/"/g, '""')}"`;
const toCSV    = (rows: Student[]) => [HEADERS.map(escape).join(","), ...rows.map((s) => toRow(s).map(escape).join(","))].join("\n");
const toTSV    = (rows: Student[]) => [HEADERS.join("\t"), ...rows.map((s) => toRow(s).join("\t"))].join("\n");

export async function GET(req: NextRequest) {
  try {
    await ensureEngineReady(studentLoaderConfig);
    const sp     = req.nextUrl.searchParams;
    const format = sp.get("format") === "excel" ? "excel" : "csv";

    const filters: Record<string, string> = {};
    for (const k of ["department", "semester", "status", "course"]) { const v = sp.get(k); if (v) filters[k] = v; }
    const columnFilters: Record<string, string> = {};
    for (const [k, v] of sp.entries()) if (k.startsWith("col_") && v.trim()) columnFilters[k.slice(4)] = v;

    const { data } = getEngine<Student>("students").search({
      query: sp.get("q") ?? "", filters, columnFilters,
      page: 1, rowsPerPage: 500000,
      sortField: sp.get("sortField") ?? undefined,
      sortDir:  (sp.get("sortDir") as "asc" | "desc") || "asc",
    });

    return format === "excel"
      ? new NextResponse(toTSV(data), { headers: { "Content-Type": "application/vnd.ms-excel; charset=utf-8", "Content-Disposition": `attachment; filename="students.xls"` } })
      : new NextResponse(toCSV(data), { headers: { "Content-Type": "text/csv; charset=utf-8",                "Content-Disposition": `attachment; filename="students.csv"` } });
  } catch (err) {
    return NextResponse.json({ error: "Export failed", message: String(err) }, { status: 500 });
  }
}
