// frontend/src/pages/ResultPage.tsx
import { useMemo, useState } from "react";
import ScheduleCalendar from "../components/ScheduleCalendar";

type Zone = "입구" | "내부1" | "내부2퇴식";
type DayOfWeek = "월" | "화" | "수" | "목" | "금";

type Assignment = {
  teacherId: string;
  teacherName: string;
  zone: Zone;
};

type ScheduleDay = {
  date: string; // YYYY-MM-DD
  dow: DayOfWeek;
  assignments: Assignment[];
  status: "OK" | "PARTIAL" | "FAILED";
  notes?: string[];
};

type TeacherStat = {
  teacherId: string;
  name: string;
  total: number;
  byDow: Record<DayOfWeek, number>;
  byZone: Record<Zone, number>;
};

type ResultPayload = {
  schedule: ScheduleDay[];
  stats: TeacherStat[];
  report: {
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
      type: string;
      message: string;
    }>;
  };
};

export default function ResultPage({ result }: { result: ResultPayload }) {
  const { report, schedule, stats } = result;

  const [view, setView] = useState<"calendar" | "table">("calendar");
  const [teacherId, setTeacherId] = useState<string>(""); // "" = 전체
  const [onlyHighlighted, setOnlyHighlighted] = useState<boolean>(false);

  const teacherOptions = useMemo(
    () => stats.map((s) => ({ id: s.teacherId, name: s.name })),
    [stats],
  );

  const teacherName = useMemo(() => {
    if (!teacherId) return "";
    return teacherOptions.find((t) => t.id === teacherId)?.name ?? "";
  }, [teacherId, teacherOptions]);

  const personalRows = useMemo(() => {
    if (!teacherId) return [];
    const rows: Array<{ date: string; dow: DayOfWeek; zone: Zone }> = [];
    for (const d of schedule) {
      for (const a of d.assignments) {
        if (a.teacherId === teacherId) {
          rows.push({ date: d.date, dow: d.dow, zone: a.zone });
        }
      }
    }
    return rows;
  }, [schedule, teacherId]);

  return (
    <div>
      <h2>3) 결과</h2>

      {/* 요약 KPI */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="kpi">
          <span className="badge">총 일수 {report.summary.totalDays}</span>
          <span className="badge">총 슬롯 {report.summary.totalSlots}</span>
          <span className="badge">OK {report.summary.okDays}</span>
          <span className="badge">PARTIAL {report.summary.partialDays}</span>
          <span className="badge">FAILED {report.summary.failedDays}</span>
          <span className="badge">max-min {report.fairness.maxMinGap}</span>
          <span className="badge">
            avg {report.fairness.avgTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* 교사 선택 + 보기 옵션 */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="row" style={{ alignItems: "flex-end" }}>
          <label>
            교사 선택
            <br />
            <select
              className="input"
              value={teacherId}
              onChange={(e) => {
                setTeacherId(e.target.value);
                setOnlyHighlighted(false); // 교사 바꾸면 강조옵션 초기화(선택)
              }}
              style={{ minWidth: 220 }}
            >
              <option value="">(전체)</option>
              {teacherOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={onlyHighlighted}
              onChange={(e) => setOnlyHighlighted(e.target.checked)}
              disabled={!teacherId}
            />
            선택 교사만 강조 보기
          </label>

          <div style={{ marginLeft: "auto" }} className="row">
            <button
              className="btn btnLight"
              type="button"
              onClick={() => setView("calendar")}
            >
              달력
            </button>
            <button
              className="btn btnLight"
              type="button"
              onClick={() => setView("table")}
            >
              표
            </button>
          </div>
        </div>

        {teacherId && (
          <div style={{ marginTop: 10, fontSize: 13, color: "#555" }}>
            <b>{teacherName}</b> 배정일 수: <b>{personalRows.length}</b>
          </div>
        )}
      </div>

      {/* 날짜별 배정: 달력/표 */}
      <div className="card" style={{ marginBottom: 12 }}>
        <h3 style={{ marginTop: 0 }}>날짜별 배정</h3>

        {view === "calendar" ? (
          <ScheduleCalendar
            schedule={schedule as any}
            highlightTeacherId={teacherId || null}
            onlyHighlighted={onlyHighlighted}
          />
        ) : (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>요일</th>
                  <th>상태</th>
                  <th>배정</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((d) => (
                  <tr key={d.date}>
                    <td>{d.date}</td>
                    <td>{d.dow}</td>
                    <td>{d.status}</td>
                    <td>
                      {d.assignments
                        .map((a) => {
                          const mark =
                            teacherId && a.teacherId === teacherId ? "★ " : "";
                          return `${mark}${a.zone}:${a.teacherName}`;
                        })
                        .join(" / ")}
                      {d.notes?.length ? (
                        <div style={{ color: "#b45309", fontSize: 12 }}>
                          {d.notes.join(", ")}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 개인 스케줄 */}
      {teacherId && (
        <div className="card" style={{ marginBottom: 12 }}>
          <h3 style={{ marginTop: 0 }}>{teacherName} 개인 스케줄</h3>
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>요일</th>
                  <th>구역</th>
                </tr>
              </thead>
              <tbody>
                {personalRows.map((r, idx) => (
                  <tr key={`${r.date}-${idx}`}>
                    <td>{r.date}</td>
                    <td>{r.dow}</td>
                    <td>{r.zone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 교사별 통계 */}
      <div className="card" style={{ marginBottom: 12 }}>
        <h3 style={{ marginTop: 0 }}>교사별 총 횟수</h3>
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>이름</th>
                <th>총</th>
                <th>입구</th>
                <th>내부1</th>
                <th>내부2퇴식</th>
                <th>월</th>
                <th>화</th>
                <th>수</th>
                <th>목</th>
                <th>금</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.teacherId}>
                  <td>{s.name}</td>
                  <td>{s.total}</td>
                  <td>{s.byZone?.["입구"] ?? 0}</td>
                  <td>{s.byZone?.["내부1"] ?? 0}</td>
                  <td>{s.byZone?.["내부2퇴식"] ?? 0}</td>
                  <td>{s.byDow?.["월"] ?? 0}</td>
                  <td>{s.byDow?.["화"] ?? 0}</td>
                  <td>{s.byDow?.["수"] ?? 0}</td>
                  <td>{s.byDow?.["목"] ?? 0}</td>
                  <td>{s.byDow?.["금"] ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 문제(FAILED/PARTIAL) 리스트(선택) */}
      {report.issues?.length ? (
        <div className="card" style={{ marginBottom: 12 }}>
          <h3 style={{ marginTop: 0 }}>이슈</h3>
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>요일</th>
                  <th>유형</th>
                  <th>메시지</th>
                </tr>
              </thead>
              <tbody>
                {report.issues.map((it, idx) => (
                  <tr key={`${it.date}-${idx}`}>
                    <td>{it.date}</td>
                    <td>{it.dow}</td>
                    <td>{it.type}</td>
                    <td>{it.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
