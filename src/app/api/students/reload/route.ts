import { NextResponse } from "next/server";
import { ensureEngineReady } from "@/lib/data-loader";
import { studentLoaderConfig } from "@/lib/student-engine-config";
import { getEngine } from "@/lib/search-engine";
import { Student } from "@/lib/student-types";

export const dynamic = "force-dynamic";


export async function POST() {
  try {
    getEngine("students").invalidate();
    await ensureEngineReady(studentLoaderConfig);
    return NextResponse.json({ success: true, message: "Engine reloaded" });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
