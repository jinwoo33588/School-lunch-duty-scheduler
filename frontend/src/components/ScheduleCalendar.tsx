import dayjs from "dayjs";

type Zone = "입구" | "내부1" | "내부2퇴식";
type DayOfWeek = "월" | "화" | "수" | "목" | "금";

const ZONE_ORDER = ["입구", "내부1", "내부2퇴식"] as const;
function zoneRank(z: string) {
  const i = ZONE_ORDER.indexOf(z as any);
  return i === -1 ? 999 : i;
}

export type ScheduleDay = {
  date: string; // YYYY-MM-DD
  dow: DayOfWeek;
  assignments: Array<{ teacherId: string; teacherName: string; zone: Zone }>;
  status: "OK" | "PARTIAL" | "FAILED";
  notes?: string[];
};

function startOfCalendarGrid(month: dayjs.Dayjs) {
  // ✅ 월간 달력: 일요일 시작 그리드
  const first = month.startOf("month");
  const jsDay = first.day(); // 0=Sun..6=Sat
  return first.subtract(jsDay, "day");
}

function statusClass(status: ScheduleDay["status"]) {
  if (status === "OK") return "calOk";
  if (status === "PARTIAL") return "calPartial";
  return "calFailed";
}

export default function ScheduleCalendar({
  schedule,
  highlightTeacherId,
  onlyHighlighted,
}: {
  schedule: ScheduleDay[];
  highlightTeacherId?: string | null;
  onlyHighlighted?: boolean;
}) {
  const map = new Map(schedule.map((d) => [d.date, d]));
  const minDate = schedule.length ? dayjs(schedule[0].date) : dayjs();
  const [month, setMonth] = React.useState(() => minDate.startOf("month"));
  const [selected, setSelected] = React.useState<ScheduleDay | null>(null);

  // 월간 그리드(6주 * 7일 = 42칸)
  const gridStart = startOfCalendarGrid(month);
  const days = Array.from({ length: 42 }, (_, i) => gridStart.add(i, "day"));

  const monthLabel = month.format("YYYY년 M월");

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <h3 style={{ margin: 0 }}>달력 보기</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            className="btn btnLight"
            onClick={() => setMonth(month.subtract(1, "month"))}
          >
            ←
          </button>
          <div style={{ fontWeight: 800 }}>{monthLabel}</div>
          <button
            className="btn btnLight"
            onClick={() => setMonth(month.add(1, "month"))}
          >
            →
          </button>
        </div>
      </div>

      <div className="calGrid" style={{ marginTop: 12 }}>
        {["일", "월", "화", "수", "목", "금", "토"].map((h) => (
          <div key={h} className="calHead">
            {h}
          </div>
        ))}

        {days.map((d) => {
          const dateStr = d.format("YYYY-MM-DD");
          const item = map.get(dateStr) ?? null;
          const inMonth = d.month() === month.month();
          const cls = item ? statusClass(item.status) : "calEmpty";
          const isHighlighted =
            !!highlightTeacherId &&
            !!item?.assignments?.some(
              (a) => a.teacherId === highlightTeacherId,
            );

          if (onlyHighlighted && highlightTeacherId && item && !isHighlighted) {
            // "해당 교사 배정일만 보기" 옵션이면, 배정 없는 날짜는 빈칸처럼 처리
          }

          return (
            <button
              key={dateStr}
              className={`calCell ${cls} ${inMonth ? "" : "calOut"} ${
                isHighlighted ? "calHighlight" : ""
              } ${
                onlyHighlighted && highlightTeacherId && item && !isHighlighted
                  ? "calDim"
                  : ""
              }`}
              onClick={() => item && setSelected(item)}
              type="button"
              title={item ? `${dateStr} (${item.dow})` : dateStr}
              disabled={!item}
            >
              <div className="calDate">{d.date()}</div>

              {/* 배정 요약(3줄) */}
              {item &&
                (!onlyHighlighted || !highlightTeacherId || isHighlighted) && (
                  <div className="calLines">
                    {[...item.assignments]
                      .sort((a, b) => zoneRank(a.zone) - zoneRank(b.zone))
                      .map((a, idx) => (
                        <div
                          key={`${a.teacherId}-${a.zone}-${idx}`}
                          className="calLine"
                        >
                          <span className="calZone">{a.zone}</span>
                          <span className="calName">{a.teacherName}</span>
                        </div>
                      ))}
                    {item.status !== "OK" && (
                      <div className="calNote">
                        {item.notes?.join(", ") || item.status}
                      </div>
                    )}
                  </div>
                )}
            </button>
          );
        })}
      </div>

      {/* 클릭 상세 */}
      {selected && (
        <div
          className="card"
          style={{ marginTop: 12, borderRadius: 14, background: "#fafafa" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 900 }}>
                {selected.date} ({selected.dow}){" "}
                <span className="badge">{selected.status}</span>
              </div>
              {selected.notes?.length ? (
                <div style={{ color: "#b45309", fontSize: 13, marginTop: 4 }}>
                  {selected.notes.join(", ")}
                </div>
              ) : null}
            </div>
            <button className="btn btnLight" onClick={() => setSelected(null)}>
              닫기
            </button>
          </div>

          <table className="table" style={{ marginTop: 10 }}>
            <thead>
              <tr>
                <th>구역</th>
                <th>교사</th>
              </tr>
            </thead>
            <tbody>
              {selected.assignments.map((a, i) => (
                <tr key={i}>
                  <td>{a.zone}</td>
                  <td>{a.teacherName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// React import 누락 방지
import React from "react";
