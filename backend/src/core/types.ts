export type DayOfWeek = "월" | "화" | "수" | "목" | "금";
export const DAYS: DayOfWeek[] = ["월", "화", "수", "목", "금"];

export type Zone = "입구" | "내부1" | "내부2퇴식";
export const DEFAULT_ZONES: Zone[] = ["입구", "내부1", "내부2퇴식"];

export type Teacher = {
  id: string;
  name: string;
  available: Record<DayOfWeek, boolean>;
};

export type SchoolDay = {
  date: string; // YYYY-MM-DD
  dow: DayOfWeek;
};

export type Assignment = {
  teacherId: string;
  teacherName: string;
  zone: Zone;
};

export type ScheduleDay = {
  date: string;
  dow: DayOfWeek;
  assignments: Assignment[];
  status: "OK" | "PARTIAL" | "FAILED";
  notes?: string[];
};

export type TeacherStats = {
  teacherId: string;
  name: string;
  total: number;
  byDow: Record<DayOfWeek, number>;
  byZone: Record<Zone, number>;
};

export type Report = {
  summary: {
    totalDays: number;
    totalSlots: number;
    okDays: number;
    partialDays: number;
    failedDays: number;
  };
  fairness: {
    minTotal: number;
    maxTotal: number;
    avgTotal: number;
    maxMinGap: number;
  };
  issues: Array<{
    date: string;
    dow: DayOfWeek;
    type: "NOT_ENOUGH_CANDIDATES" | "ENGINE_FAILED";
    message: string;
  }>;
};

export type EngineOptions = {
  engineId: string;
  pickPerDay: number; // 3
  zones: Zone[];
  avoidConsecutive?: boolean; // 나중에 확장
};

export type ScheduleContext = {
  teachers: Teacher[];
  days: SchoolDay[];
  options: EngineOptions;
};

export type EngineResult = {
  schedule: ScheduleDay[];
};

export interface SchedulerEngine {
  id: string;
  name: string;
  run(ctx: ScheduleContext): EngineResult;
}
