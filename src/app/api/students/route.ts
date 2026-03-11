

import { NextRequest, NextResponse } from "next/server";
import { ensureEngineReady } from "@/lib/data-loader";
import { getSearchEngine } from "@/lib/search-engine";
import { Student } from "@/lib/types";

export const dynamic = "force-dynamic"; // Never cache — always live data

export async function GET(req: NextRequest) {
  try {
    await ensureEngineReady();

    const { searchParams } = req.nextUrl;

    const query      = searchParams.get("q") ?? "";
    const department = searchParams.get("department") ?? "";
    const semester   = searchParams.get("semester") ?? "";
    const status     = searchParams.get("status") ?? "";
    const course     = searchParams.get("course") ?? "";
    const sortField  = (searchParams.get("sortField") as keyof Student | null) ?? undefined;
    const sortDir    = (searchParams.get("sortDir") as "asc" | "desc") || "asc";
    const page       = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit      = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));


    const columnFilters: Partial<Record<keyof Student, string>> = {};
    for (const [key, val] of searchParams.entries()) {
      if (key.startsWith("col_") && val.trim()) {
        const colKey = key.slice(4) as keyof Student;
        columnFilters[colKey] = val;
      }
    }

    const engine = getSearchEngine();
    const result = engine.search({
      query,
      department,
      semester,
      status,
      course,
      columnFilters,
      page,
      rowsPerPage: limit,
      sortField,
      sortDir,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: {
        // Allow CDN/browser to cache GET responses briefly
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[/api/students] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: String(err) },
      { status: 500 }
    );
  }
}
