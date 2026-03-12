import path from "path";
import { EngineConfig } from "./search-engine";
import { LoaderConfig } from "./data-loader";
import { Student } from "./student-types";

export const studentEngineConfig: EngineConfig<Student> = {
  searchFields:     ["rollNo", "name", "email", "contact", "course", "department", "subjects", "status"],
  facetFields:      ["department", "semester", "status", "course"],
  columnFields:     ["rollNo", "name", "email", "contact", "course", "department", "subjects", "status", "semester"],
  exactMatchFields: ["semester", "id"],
  facetSort:        { semester: "numeric" },
  stats: {
    total:       ({ totalCount })  => totalCount,
    active:      ({ facetIndex }) => facetIndex.get("status")?.get("Active")?.size   ?? 0,
    inactive:    ({ facetIndex }) => facetIndex.get("status")?.get("Inactive")?.size ?? 0,
    departments: ({ facetIndex }) => facetIndex.get("department")?.size              ?? 0,
  },
};

export const studentLoaderConfig: LoaderConfig<Student> = {
  name: "students",
  dataCandidates: [
    path.join(process.cwd(), "src/data/students-100k.json"),
    path.join(process.cwd(), "src/data/students.json"),
    path.join(process.cwd(), ".next/server/src/data/students-100k.json"),
    path.join(process.cwd(), ".next/server/src/data/students.json"),
  ],
  engineConfig: studentEngineConfig,
};
