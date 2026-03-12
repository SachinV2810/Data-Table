import { NextRequest, NextResponse } from "next/server";
import { ensureEngineReady } from "@/lib/data-loader";
import { studentLoaderConfig } from "@/lib/student-engine-config";
import { getEngine } from "@/lib/search-engine";
import { Student } from "@/lib/student-types";

export const dynamic = "force-dynamic";

// ─── Student engine config ────────────────────────────────────────────────────


// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const engine = await ensureEngineReady(studentLoaderConfig);
    const sp     = req.nextUrl.searchParams;

    const query      = sp.get("q")         ?? "";
    const page       = Math.max(1, parseInt(sp.get("page")  ?? "1",  10));
    const limit      = Math.min(500, Math.max(1, parseInt(sp.get("limit") ?? "10", 10)));
    const sortField  = sp.get("sortField") ?? undefined;
    const sortDir    = (sp.get("sortDir") as "asc" | "desc") || "asc";

    // Named facet filters
    const filters: Record<string, string> = {};
    for (const key of ["department", "semester", "status", "course"]) {
      const v = sp.get(key);
      if (v) filters[key] = v;
    }

    // Column filters: col_<field>
    const columnFilters: Record<string, string> = {};
    for (const [key, val] of sp.entries()) {
      if (key.startsWith("col_") && val.trim()) columnFilters[key.slice(4)] = val;
    }

    const result = engine.search({ query, filters, columnFilters, page, rowsPerPage: limit, sortField, sortDir });

    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[/api/students]", err);
    return NextResponse.json({ error: "Internal server error", message: String(err) }, { status: 500 });
  }
}
