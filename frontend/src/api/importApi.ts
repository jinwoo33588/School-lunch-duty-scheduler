import { api } from "./client";

export type DayOfWeek = "월" | "화" | "수" | "목" | "금";

export type Teacher = {
  id: string;
  name: string;
  available: Record<DayOfWeek, boolean>;
};

export async function importExcel(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  return await api<{
    importId: string;
    teachers: Teacher[];
    warnings: string[];
  }>("/api/import/excel", { method: "POST", body: fd });
}
