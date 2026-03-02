import type { Zone } from "./types";

type Picked = Array<{ teacherId: string; teacherName: string }>;

export function assignZonesMinCost(
  picked: Picked,
  zones: Zone[],
  zoneCount: Map<string, Record<Zone, number>>,
  opts?: {
    lastZone?: Map<string, Zone | null>;
    repeatPenalty?: number; // 직전 구역 반복 페널티
  },
): Array<{ teacherId: string; teacherName: string; zone: Zone }> {
  const lastZone = opts?.lastZone;
  const repeatPenalty = opts?.repeatPenalty ?? 3;

  if (picked.length !== zones.length) {
    // 안전장치: 길이가 다르면 순서대로
    return picked.map((t, i) => ({
      teacherId: t.teacherId,
      teacherName: t.teacherName,
      zone: zones[i]!,
    }));
  }

  const perms: Zone[][] = permutations(zones);
  let best = perms[0]!;
  let bestCost = Number.POSITIVE_INFINITY;

  for (const p of perms) {
    let cost = 0;

    for (let i = 0; i < picked.length; i++) {
      const t = picked[i]!;
      const z = p[i]!;
      const m = zoneCount.get(t.teacherId);

      // 1) 장기 균등(해당 구역 많이 했으면 비용 증가)
      cost += m?.[z] ?? 0;

      // 2) 단기 로테이션(직전 구역 반복이면 페널티)
      const last = lastZone?.get(t.teacherId) ?? null;
      if (last && last === z) cost += repeatPenalty;
    }

    if (cost < bestCost) {
      bestCost = cost;
      best = p;
    }
  }

  return picked.map((t, i) => ({
    teacherId: t.teacherId,
    teacherName: t.teacherName,
    zone: best[i]!,
  }));
}

function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr.slice()];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const head = arr[i]!;
    const rest = arr.slice(0, i).concat(arr.slice(i + 1));
    for (const p of permutations(rest)) out.push([head, ...p]);
  }
  return out;
}
