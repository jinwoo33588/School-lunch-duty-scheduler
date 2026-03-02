import type {
  SchedulerEngine,
  ScheduleContext,
  ScheduleDay,
  Zone,
} from "../core/types";

export const randomPickEngine: SchedulerEngine = {
  id: "random-pick",
  name: "기본(간단 선택)",
  run(ctx: ScheduleContext) {
    const { teachers, days, options } = ctx;

    const assignedCount = new Map<string, number>();
    for (const t of teachers) assignedCount.set(t.id, 0);

    const schedule: ScheduleDay[] = [];

    for (const day of days) {
      const candidates = teachers.filter((t) => t.available[day.dow]);

      // 덜 한 사람 우선 (공평성의 최소장치)
      candidates.sort(
        (a, b) => assignedCount.get(a.id)! - assignedCount.get(b.id)!,
      );

      const picked = candidates.slice(0, options.pickPerDay);

      if (picked.length < options.pickPerDay) {
        schedule.push({
          date: day.date,
          dow: day.dow,
          assignments: picked.map((t, idx) => ({
            teacherId: t.id,
            teacherName: t.name,
            zone: options.zones[idx] as Zone,
          })),
          status: picked.length === 0 ? "FAILED" : "PARTIAL",
          notes: ["후보 부족"],
        });
        // 부분 배정도 카운트는 반영
        for (const t of picked)
          assignedCount.set(t.id, (assignedCount.get(t.id) ?? 0) + 1);
        continue;
      }

      const assignments = picked.map((t, idx) => ({
        teacherId: t.id,
        teacherName: t.name,
        zone: options.zones[idx] as Zone,
      }));

      for (const t of picked)
        assignedCount.set(t.id, (assignedCount.get(t.id) ?? 0) + 1);

      schedule.push({
        date: day.date,
        dow: day.dow,
        assignments,
        status: "OK",
        notes: [],
      });
    }

    return { schedule };
  },
};
