import type {
  SchedulerEngine,
  ScheduleContext,
  ScheduleDay,
  Teacher,
  Zone,
} from "../core/types";
import { assignZonesMinCost } from "../core/zoneAssign";

/**
 * ✅ 회차 로테이션(라운드) 엔진 - 완성본
 *
 * 목적:
 * - 총 배정 횟수는 base/base+1 목표로 최대한 균등
 * - 회차(라운드) 안에서는 "아직 이번 회차에 안 한 사람" 우선
 * - 구역은 3구역이 돌아가게(직전 구역 반복 페널티 + 누적 균등)
 * - 연속 배정은 우선 피하되(전날), 후보 부족이면 깨질 수 있음(현실적)
 */
export const roundRotationEngine: SchedulerEngine = {
  id: "round-rotation",
  name: "회차 로테이션(라운드)",
  run(ctx: ScheduleContext) {
    const { teachers, days, options } = ctx;
    const zones = options.zones;
    const pickPerDay = options.pickPerDay;

    // ---- 목표(base/base+1) ----
    const totalSlots = days.length * pickPerDay;
    const N = teachers.length || 1;
    const base = Math.floor(totalSlots / N);
    const extra = totalSlots % N;

    // 가능 요일 수(안정성 지표)
    const availCount = new Map<string, number>();
    for (const t of teachers) {
      availCount.set(t.id, countTrueDays(t));
    }

    // extra 배정 대상: 가능 요일 수 많은 사람 우선(실패/부분배정 줄이기)
    const byAvailDesc = teachers
      .slice()
      .sort((a, b) => availCount.get(b.id)! - availCount.get(a.id)!);

    const target = new Map<string, number>();
    for (const t of teachers) target.set(t.id, base);
    for (let i = 0; i < extra; i++) {
      const t = byAvailDesc[i];
      if (t) target.set(t.id, (target.get(t.id) ?? base) + 1);
    }

    // ---- 카운터/상태 ----
    const assignedCount = new Map<string, number>();
    const zoneCount = new Map<string, Record<Zone, number>>();
    const roundAssigned = new Map<string, boolean>();

    // 연속 배정 회피용(마지막 배정 날짜 인덱스)
    const lastAssignedIndex = new Map<string, number>();

    // 구역 로테이션용(직전 구역)
    const lastZone = new Map<string, Zone | null>();

    for (const t of teachers) {
      assignedCount.set(t.id, 0);
      zoneCount.set(
        t.id,
        Object.fromEntries(zones.map((z) => [z, 0])) as Record<Zone, number>,
      );
      roundAssigned.set(t.id, false);
      lastAssignedIndex.set(t.id, -9999);
      lastZone.set(t.id, null);
    }

    // 남은 가능일(남은 날짜에서 배정 기회가 얼마나 남았는지)
    const remainAvailDays = new Map<string, number>();
    initRemainAvailDays(remainAvailDays, teachers, days);

    const schedule: ScheduleDay[] = [];

    for (let di = 0; di < days.length; di++) {
      const day = days[di]!;
      const candidates = teachers.filter((t) => t.available[day.dow]);

      if (candidates.length === 0) {
        schedule.push({
          date: day.date,
          dow: day.dow,
          assignments: [],
          status: "FAILED",
          notes: ["후보 없음"],
        });
        decayRemainAvailDays(remainAvailDays, teachers, day.dow);
        continue;
      }

      // ✅ 회차 리셋 조건(막힘 방지)
      // - 목표 미달 && 이번 회차 미배정(P1)이 오늘 후보 기준으로 너무 적으면 회차를 리셋
      // - 단, 이미 모든 사람이 목표 채웠으면 리셋 의미 없으니 체크
      if (anyNeedRemain(teachers, assignedCount, target)) {
        const p1Count = candidates.filter((t) =>
          isP1(t, assignedCount, target, roundAssigned),
        ).length;

        if (p1Count < Math.min(pickPerDay, candidates.length)) {
          resetRound(roundAssigned, teachers);
        }
      }

      // ---- 풀(P1→P2→P3) ----
      const P1 = candidates.filter((t) =>
        isP1(t, assignedCount, target, roundAssigned),
      );
      const P2 = candidates.filter((t) => isP2(t, roundAssigned));
      const P3 = candidates.filter((t) => isP3(t, assignedCount, target));

      // 정렬: 덜 한 사람 우선 + deficit + 남은가능일 + (전날 배정 회피) + 가능요일 + 이름
      const cmp = (a: Teacher, b: Teacher) =>
        comparePick(
          a,
          b,
          assignedCount,
          target,
          remainAvailDays,
          lastAssignedIndex,
          di,
          availCount,
        );

      P1.sort(cmp);
      P2.sort(cmp);
      P3.sort(cmp);

      // pickPerDay 만큼 채우기
      const picked: Teacher[] = [];
      for (const t of P1) {
        if (picked.length >= pickPerDay) break;
        picked.push(t);
      }
      for (const t of P2) {
        if (picked.length >= pickPerDay) break;
        if (!picked.includes(t)) picked.push(t);
      }
      for (const t of P3) {
        if (picked.length >= pickPerDay) break;
        if (!picked.includes(t)) picked.push(t);
      }

      if (picked.length === 0) {
        schedule.push({
          date: day.date,
          dow: day.dow,
          assignments: [],
          status: "FAILED",
          notes: ["선발 실패"],
        });
        decayRemainAvailDays(remainAvailDays, teachers, day.dow);
        continue;
      }

      // ---- 구역 배정(누적 균등 + 직전 반복 회피) ----
      const pickedLite = picked.map((t) => ({
        teacherId: t.id,
        teacherName: t.name,
      }));

      const assignments = assignZonesMinCost(pickedLite, zones, zoneCount, {
        lastZone,
        repeatPenalty: 3, // ✅ 여기 조절(2~5 추천)
      });

      // ---- 커밋 ----
      for (const a of assignments) {
        assignedCount.set(
          a.teacherId,
          (assignedCount.get(a.teacherId) ?? 0) + 1,
        );

        const zc = zoneCount.get(a.teacherId);
        if (zc) zc[a.zone] = (zc[a.zone] ?? 0) + 1;

        roundAssigned.set(a.teacherId, true);
        lastAssignedIndex.set(a.teacherId, di);
        lastZone.set(a.teacherId, a.zone);
      }

      schedule.push({
        date: day.date,
        dow: day.dow,
        assignments,
        status: assignments.length === pickPerDay ? "OK" : "PARTIAL",
        notes:
          assignments.length === pickPerDay ? [] : ["후보 부족(부분 배정)"],
      });

      // 날짜가 지나감 → 오늘 요일이 가능한 사람은 남은 가능일 -1
      decayRemainAvailDays(remainAvailDays, teachers, day.dow);
    }

    return { schedule };
  },
};

// ------------------------
// 조건/정렬/유틸
// ------------------------

function isP1(
  t: Teacher,
  assignedCount: Map<string, number>,
  target: Map<string, number>,
  roundAssigned: Map<string, boolean>,
) {
  const done = assignedCount.get(t.id) ?? 0;
  const tar = target.get(t.id) ?? 0;
  return done < tar && (roundAssigned.get(t.id) ?? false) === false;
}

function isP2(t: Teacher, roundAssigned: Map<string, boolean>) {
  return (roundAssigned.get(t.id) ?? false) === false;
}

function isP3(
  t: Teacher,
  assignedCount: Map<string, number>,
  target: Map<string, number>,
) {
  const done = assignedCount.get(t.id) ?? 0;
  const tar = target.get(t.id) ?? 0;
  return done < tar;
}

function comparePick(
  a: Teacher,
  b: Teacher,
  assignedCount: Map<string, number>,
  target: Map<string, number>,
  remainAvailDays: Map<string, number>,
  lastAssignedIndex: Map<string, number>,
  currentIndex: number,
  availCount: Map<string, number>,
) {
  // 1) 덜 한 사람 우선
  const da = assignedCount.get(a.id) ?? 0;
  const db = assignedCount.get(b.id) ?? 0;
  if (da !== db) return da - db;

  // 2) deficit 큰 사람 우선 (target - done)
  const defA = (target.get(a.id) ?? 0) - da;
  const defB = (target.get(b.id) ?? 0) - db;
  if (defA !== defB) return defB - defA;

  // 3) ✅ 연속 배정(전날) 회피
  const la = lastAssignedIndex.get(a.id) ?? -9999;
  const lb = lastAssignedIndex.get(b.id) ?? -9999;
  const gapA = currentIndex - la;
  const gapB = currentIndex - lb;
  const consecA = gapA <= 1;
  const consecB = gapB <= 1;
  if (consecA !== consecB) return consecA ? 1 : -1;

  // 4) 남은 가능일 적은 사람 우선(막힘 방지)
  const ra = remainAvailDays.get(a.id) ?? 0;
  const rb = remainAvailDays.get(b.id) ?? 0;
  if (ra !== rb) return ra - rb;

  // 5) 가능 요일 많은 사람 우선(안정)
  const aa = availCount.get(a.id) ?? 0;
  const ab = availCount.get(b.id) ?? 0;
  if (aa !== ab) return ab - aa;

  return a.name.localeCompare(b.name, "ko");
}

function resetRound(roundAssigned: Map<string, boolean>, teachers: Teacher[]) {
  for (const t of teachers) roundAssigned.set(t.id, false);
}

function anyNeedRemain(
  teachers: Teacher[],
  assignedCount: Map<string, number>,
  target: Map<string, number>,
) {
  for (const t of teachers) {
    const done = assignedCount.get(t.id) ?? 0;
    const tar = target.get(t.id) ?? 0;
    if (done < tar) return true;
  }
  return false;
}

function countTrueDays(t: Teacher) {
  return Object.values(t.available).filter(Boolean).length;
}

function initRemainAvailDays(
  remainAvailDays: Map<string, number>,
  teachers: Teacher[],
  days: Array<{ dow: any }>,
) {
  for (const t of teachers) {
    let cnt = 0;
    for (const d of days) {
      if (t.available[d.dow]) cnt++;
    }
    remainAvailDays.set(t.id, cnt);
  }
}

function decayRemainAvailDays(
  remainAvailDays: Map<string, number>,
  teachers: Teacher[],
  dow: any,
) {
  for (const t of teachers) {
    if (t.available[dow]) {
      remainAvailDays.set(
        t.id,
        Math.max(0, (remainAvailDays.get(t.id) ?? 0) - 1),
      );
    }
  }
}
