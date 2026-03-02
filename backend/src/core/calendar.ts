import dayjs from "dayjs";
import { DAYS, type DayOfWeek, type SchoolDay } from "./types";

function dowToKor(dow0: number): DayOfWeek | null {
  // dayjs: 0=Sunday ... 6=Saturday
  if (dow0 === 1) return "월";
  if (dow0 === 2) return "화";
  if (dow0 === 3) return "수";
  if (dow0 === 4) return "목";
  if (dow0 === 5) return "금";
  return null; // 주말 제외
}

export function buildSchoolDays(
  startDate: string,
  endDate: string,
): SchoolDay[] {
  const start = dayjs(startDate);
  const end = dayjs(endDate);

  if (!start.isValid() || !end.isValid()) {
    throw new Error("Invalid date range");
  }
  if (end.isBefore(start)) {
    throw new Error("endDate must be >= startDate");
  }

  const days: SchoolDay[] = [];
  let cur = start;

  while (cur.isBefore(end) || cur.isSame(end, "day")) {
    const kor = dowToKor(cur.day());
    if (kor && DAYS.includes(kor)) {
      days.push({ date: cur.format("YYYY-MM-DD"), dow: kor });
    }
    cur = cur.add(1, "day");
  }
  return days;
}
