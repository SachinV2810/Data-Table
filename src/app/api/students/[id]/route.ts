import { NextRequest, NextResponse } from "next/server";
import { ensureEngineReady } from "@/lib/data-loader";
import { studentLoaderConfig } from "@/lib/student-engine-config";
import { getEngine } from "@/lib/search-engine";
import { Student } from "@/lib/student-types";

export const dynamic = "force-dynamic";


export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureEngineReady(studentLoaderConfig);
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const student = getEngine<Student>("students").findById(id);
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    return NextResponse.json(student);
  } catch (err) {
    return NextResponse.json({ error: "Internal server error", message: String(err) }, { status: 500 });
  }
}
