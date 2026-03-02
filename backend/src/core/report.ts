import type { Report, ScheduleDay, TeacherStats } from "./types";

export function buildReport(
  schedule: ScheduleDay[],
  stats: TeacherStats[],
): Report {
  const totalDays = schedule.length;
  const totalSlots = schedule.reduce((acc, d) => acc + d.assignments.length, 0);

  const okDays = schedule.filter((d) => d.status === "OK").length;
  const partialDays = schedule.filter((d) => d.status === "PARTIAL").length;
  const failedDays = schedule.filter((d) => d.status === "FAILED").length;

  const totals = stats.map((s) => s.total);
  const minTotal = totals.length ? Math.min(...totals) : 0;
  const maxTotal = totals.length ? Math.max(...totals) : 0;
  const avgTotal = totals.length
    ? totals.reduce((a, b) => a + b, 0) / totals.length
    : 0;

  const issues: Report["issues"] = [];
  for (const d of schedule) {
    if (d.status !== "OK") {
      issues.push({
        date: d.date,
        dow: d.dow,
        type: "NOT_ENOUGH_CANDIDATES",
        message: d.notes?.join(", ") || "배정 실패/부분 배정",
      });
    }
  }

  return {
    summary: { totalDays, totalSlots, okDays, partialDays, failedDays },
    fairness: { minTotal, maxTotal, avgTotal, maxMinGap: maxTotal - minTotal },
    issues,
  };
}
