import type { Teacher, ScheduleDay, TeacherStats, Report } from "../core/types";

type ImportPayload = {
  teachers: Teacher[];
  warnings: string[];
  createdAt: number;
};

type ResultPayload = {
  schedule: ScheduleDay[];
  stats: TeacherStats[];
  report: Report;
  createdAt: number;
};

const imports = new Map<string, ImportPayload>();
const results = new Map<string, ResultPayload>();

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export const memoryStore = {
  saveImport(payload: ImportPayload) {
    const id = makeId("imp");
    imports.set(id, { ...payload, createdAt: Date.now() });
    return id;
  },
  getImport(importId: string) {
    return imports.get(importId) ?? null;
  },
  saveResult(payload: Omit<ResultPayload, "createdAt">) {
    const id = makeId("res");
    results.set(id, { ...payload, createdAt: Date.now() });
    return id;
  },
  getResult(resultId: string) {
    return results.get(resultId) ?? null;
  },
};
