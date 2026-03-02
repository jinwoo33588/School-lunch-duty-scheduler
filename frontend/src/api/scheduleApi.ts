import { api } from "./client";
import type { Teacher } from "./importApi";

export type Zone = "입구" | "내부1" | "내부2퇴식";
export type DayOfWeek = "월" | "화" | "수" | "목" | "금";

export async function fetchEngines() {
  return await api<{ engines: Array<{ id: string; name: string }> }>(
    "/api/schedule/engines",
  );
}

export async function generateSchedule(input: {
  importId: string;
  term: { startDate: string; endDate: string };
  options: { engineId: string; pickPerDay: number; zones: Zone[] };
}) {
  return await api<{
    resultId: string;
    schedule: Array<{
      date: string;
      dow: DayOfWeek;
      assignments: Array<{
        teacherId: string;
        teacherName: string;
        zone: Zone;
      }>;
      status: "OK" | "PARTIAL" | "FAILED";
      notes?: string[];
    }>;
    stats: Array<{
      teacherId: string;
      name: string;
      total: number;
      byDow: Record<DayOfWeek, number>;
      byZone: Record<Zone, number>;
    }>;
    report: any;
  }>("/api/schedule/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
