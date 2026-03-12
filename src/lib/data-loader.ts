import path from "path";
import fs   from "fs";
import { GenericSearchEngine, EngineConfig, getEngine } from "./search-engine";

declare global {

  var __engineFileMeta: Map<string, { filePath: string; mtime: number }> | undefined;
  var __engineRebuildPromise: Map<string, Promise<void>> | undefined;
}

function getMeta(name: string) {
  if (!global.__engineFileMeta) global.__engineFileMeta = new Map();
  return global.__engineFileMeta.get(name) ?? { filePath: "", mtime: 0 };
}
function setMeta(name: string, filePath: string, mtime: number) {
  if (!global.__engineFileMeta) global.__engineFileMeta = new Map();
  global.__engineFileMeta.set(name, { filePath, mtime });
}
function getRebuildMap() {
  if (!global.__engineRebuildPromise) global.__engineRebuildPromise = new Map();
  return global.__engineRebuildPromise;
}

const mtimeCache = new Map<string, { value: number; at: number }>();
const MTIME_TTL  = 2000;

function getFileMtime(filePath: string): number {
  const cached = mtimeCache.get(filePath);
  if (cached && Date.now() - cached.at < MTIME_TTL) return cached.value;
  try {
    const value = fs.statSync(filePath).mtimeMs;
    mtimeCache.set(filePath, { value, at: Date.now() });
    return value;
  } catch { return 0; }
}

export interface LoaderConfig<T extends Record<string, unknown>> {
 
  name: string;
 
  dataCandidates: string[];

  engineConfig: EngineConfig<T>;
}

async function loadAndBuild<T extends Record<string, unknown>>(
  filePath: string,
  loaderConfig: LoaderConfig<T>
): Promise<void> {
  console.log(`[DataLoader:${loaderConfig.name}] Loading ${path.basename(filePath)}…`);
  const start = Date.now();

  const raw     = fs.readFileSync(filePath, "utf-8");
  const records = JSON.parse(raw) as T[];

  if (!Array.isArray(records) || records.length === 0) {
    throw new Error(`[DataLoader:${loaderConfig.name}] No valid records in ${filePath}`);
  }

  getEngine<T>(loaderConfig.name).build(records, loaderConfig.engineConfig);
  setMeta(loaderConfig.name, filePath, getFileMtime(filePath));

  console.log(
    `[DataLoader:${loaderConfig.name}] ✓ ${records.length.toLocaleString()} records loaded in ${Date.now() - start}ms`
  );
}

export async function ensureEngineReady<T extends Record<string, unknown>>(
  loaderConfig: LoaderConfig<T>
): Promise<GenericSearchEngine<T>> {
  const { name, dataCandidates } = loaderConfig;

  const filePath = dataCandidates.find((c) => fs.existsSync(c)) ?? null;
  if (!filePath) throw new Error(`[DataLoader:${name}] No data file found. Tried: ${dataCandidates.join(", ")}`);

  const engine        = getEngine<T>(name);
  const currentMtime  = getFileMtime(filePath);
  const meta          = getMeta(name);
  const fileChanged   = filePath !== meta.filePath || currentMtime !== meta.mtime;
  const needsBuild    = !engine.isReady() || fileChanged;

  if (!needsBuild) return engine;

  if (fileChanged && engine.isReady()) {
    console.log(`[DataLoader:${name}] File changed — rebuilding…`);
  }

  const rebuilds = getRebuildMap();
  if (rebuilds.has(name)) {
    await rebuilds.get(name)!;
    return engine;
  }

  const promise = loadAndBuild(filePath, loaderConfig).finally(() => rebuilds.delete(name));
  rebuilds.set(name, promise);
  await promise;

  return engine;
}
