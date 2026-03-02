import {
  DAYS,
  type DayOfWeek,
  type ScheduleDay,
  type Teacher,
  type TeacherStats,
  type Zone,
} from "./types";

export function buildStats(
  teachers: Teacher[],
  schedule: ScheduleDay[],
  zones: Zone[],
): TeacherStats[] {
  const map = new Map<string, TeacherStats>();

  for (const t of teachers) {
    map.set(t.id, {
      teacherId: t.id,
      name: t.name,
      total: 0,
      byDow: { 월: 0, 화: 0, 수: 0, 목: 0, 금: 0 },
      byZone: Object.fromEntries(zones.map((z) => [z, 0])) as Record<
        Zone,
        number
      >,
    });
  }

  for (const day of schedule) {
    for (const a of day.assignments) {
      const st = map.get(a.teacherId);
      if (!st) continue;
      st.total += 1;
      st.byDow[day.dow as DayOfWeek] += 1;
      st.byZone[a.zone as Zone] = (st.byZone[a.zone as Zone] ?? 0) + 1;
    }
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}
