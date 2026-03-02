import * as XLSX from "xlsx";
import { DAYS, type DayOfWeek, type Teacher } from "../core/types";

function isBlank(v: any) {
  return v === null || v === undefined || String(v).trim() === "";
}

function norm(v: any) {
  return String(v ?? "").trim();
}

function looksLikeWeekHeaderRow(row: any[]): boolean {
  // B~F가 월화수목금인지 확인
  const b = norm(row[1]);
  const c = norm(row[2]);
  const d = norm(row[3]);
  const e = norm(row[4]);
  const f = norm(row[5]);
  return b === "월" && c === "화" && d === "수" && e === "목" && f === "금";
}

function findPeriodRowIndex(
  grid: any[][],
  startRow: number,
  maxScan: number,
  periodNo: number,
) {
  const targetPrefix = `${periodNo}교시`;
  const end = Math.min(grid.length, startRow + maxScan);
  for (let r = startRow; r < end; r++) {
    const a = norm(grid[r]?.[0]);
    if (a.startsWith(targetPrefix)) return r;
  }
  return -1;
}

export function parseTeachersFromExcel(
  buffer: Buffer,
  targetPeriod = 4,
): {
  teachers: Teacher[];
  warnings: string[];
} {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error("No sheets in excel file");
  const ws = wb.Sheets[sheetName];

  // ✅ 2D 배열로 읽기 (빈칸 포함)
  const grid = XLSX.utils.sheet_to_json<any[]>(ws, {
    header: 1,
    defval: "",
    blankrows: false,
  });

  const teachers: Teacher[] = [];
  const warnings: string[] = [];
  const seen = new Set<string>();

  for (let r = 0; r < grid.length; r++) {
    const row = grid[r] ?? [];
    const name = norm(row[0]);

    // 이름칸 비어있으면 패스
    if (!name) continue;

    // ✅ "교사 블록 시작" 판별: 같은 행에 월화수목금 헤더가 있는지
    if (!looksLikeWeekHeaderRow(row)) continue;

    // 교시 행(4교시) 찾기: 블록 시작 다음부터 15행 정도 스캔
    const periodRow = findPeriodRowIndex(grid, r + 1, 20, targetPeriod);
    if (periodRow === -1) {
      warnings.push(
        `"${name}" 블록에서 ${targetPeriod}교시 행을 못 찾음 (row ${r + 1})`,
      );
      continue;
    }

    // 중복 이름 처리
    if (seen.has(name)) {
      warnings.push(`중복 이름 "${name}" 스킵`);
      continue;
    }
    seen.add(name);

    // periodRow의 B~F가 비어있으면 공강(true)
    const pr = grid[periodRow] ?? [];
    const available: Record<DayOfWeek, boolean> = {
      월: isBlank(pr[1]),
      화: isBlank(pr[2]),
      수: isBlank(pr[3]),
      목: isBlank(pr[4]),
      금: isBlank(pr[5]),
    };

    teachers.push({
      id: `t_${teachers.length + 1}`,
      name,
      available,
    });
  }

  if (teachers.length === 0) {
    warnings.push(
      "교사 블록을 하나도 찾지 못했습니다. (월화수목금 헤더 행이 있는지 확인)",
    );
  }

  return { teachers, warnings };
}
