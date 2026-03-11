

import path from "path";
import fs from "fs";
import { Student } from "./types";
import { getSearchEngine, getEngineFileMeta, setEngineFileMeta } from "./search-engine";

// Candidates in priority order
const DATA_CANDIDATES = [
  path.join(process.cwd(), "src/data/students-100k.json"),
  path.join(process.cwd(), "src/data/students.json"),
  // Vercel bundles files relative to project root
  path.join(process.cwd(), ".next/server/src/data/students-100k.json"),
  path.join(process.cwd(), ".next/server/src/data/students.json"),
];

let rebuildPromise: Promise<void> | null = null;

// Cache the mtime check — only hit the disk every 2 seconds max
let lastMtimeCheckAt = 0;
let cachedMtime = 0;
const MTIME_CACHE_TTL = 2000; // ms

function resolveDataFile(): string | null {
  for (const candidate of DATA_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function getFileMtime(filePath: string): number {
  const now = Date.now();
  if (now - lastMtimeCheckAt < MTIME_CACHE_TTL) {
    return cachedMtime; // use cached value — skip disk hit
  }
  try {
    cachedMtime = fs.statSync(filePath).mtimeMs;
    lastMtimeCheckAt = now;
    return cachedMtime;
  } catch {
    return 0;
  }
}

async function loadAndBuild(filePath: string): Promise<void> {
  console.log(`[DataLoader] Loading ${path.basename(filePath)}...`);
  const start = Date.now();

  const raw = fs.readFileSync(filePath, "utf-8");
  const students = JSON.parse(raw) as Student[];

  if (!Array.isArray(students) || students.length === 0) {
    throw new Error(`[DataLoader] No valid records in ${filePath}`);
  }

  getSearchEngine().build(students);

  // Persist file meta to global so it survives hot reloads
  setEngineFileMeta(filePath, getFileMtime(filePath));

  console.log(
    `[DataLoader] ✓ ${students.length.toLocaleString()} students loaded from ` +
    `${path.basename(filePath)} in ${Date.now() - start}ms`
  );
}

export async function ensureEngineReady(): Promise<void> {
  const engine   = getSearchEngine();
  const filePath = resolveDataFile();

  if (!filePath) {
    throw new Error("[DataLoader] No student data file found. Expected src/data/students.json");
  }

  const currentMtime             = getFileMtime(filePath);
  const { filePath: lastPath, mtime: lastMtime } = getEngineFileMeta();

  // Key fix: always compare mtime, not just engine.isReady().
  // engine.isReady() can return true even when the file has been updated,
  // because the engine was built from the OLD version of the file.
  const fileChanged = filePath !== lastPath || currentMtime !== lastMtime;
  const needsBuild  = !engine.isReady() || fileChanged;

  if (!needsBuild) return;

  if (fileChanged && engine.isReady()) {
    console.log(`[DataLoader] Detected change in ${path.basename(filePath)} — rebuilding...`);
  }

  if (rebuildPromise) {
    await rebuildPromise;
    return;
  }

  rebuildPromise = loadAndBuild(filePath).finally(() => {
    rebuildPromise = null;
  });

  await rebuildPromise;
}