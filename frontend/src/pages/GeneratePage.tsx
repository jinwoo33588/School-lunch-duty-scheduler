import { useEffect, useMemo, useState } from "react";
import type { Teacher } from "../api/importApi";
import { fetchEngines, generateSchedule, type Zone } from "../api/scheduleApi";
import ResultPage from "./ResultPage";

type Props = {
  importId: string;
  teachers: Teacher[];
  warnings: string[];
};

const ZONES: Zone[] = ["입구", "내부1", "내부2퇴식"];

export default function GeneratePage({ importId, teachers, warnings }: Props) {
  const [engines, setEngines] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [engineId, setEngineId] = useState("random-pick");
  const [startDate, setStartDate] = useState("2026-03-02");
  const [endDate, setEndDate] = useState("2026-07-17");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ✅ 생성 결과를 페이지 내부에 보관
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetchEngines()
      .then((r) => setEngines(r.engines))
      .catch(() => {});
  }, []);

  async function onRun() {
    setLoading(true);
    setErr(null);
    try {
      const res = await generateSchedule({
        importId,
        term: { startDate, endDate },
        options: { engineId, pickPerDay: 3, zones: ZONES },
      });
      setResult(res);

      // (선택) 결과 섹션으로 자동 스크롤
      setTimeout(() => {
        document
          .getElementById("result-section")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    } catch (e: any) {
      setErr(e?.message ?? "생성 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h2>2) 설정 & 생성</h2>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="kpi">
          <span className="badge">교사 {teachers.length}명</span>
          <span className="badge">경고 {warnings.length}건</span>
        </div>
        {warnings.length > 0 && (
          <ul style={{ marginTop: 10, paddingLeft: 18, color: "#555" }}>
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <h3 style={{ marginTop: 0 }}>교사/공강 미리보기</h3>

        {/* ✅ 전체 표시 + 스크롤 래퍼 권장 */}
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>이름</th>
                <th>월</th>
                <th>화</th>
                <th>수</th>
                <th>목</th>
                <th>금</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>{t.available["월"] ? "O" : ""}</td>
                  <td>{t.available["화"] ? "O" : ""}</td>
                  <td>{t.available["수"] ? "O" : ""}</td>
                  <td>{t.available["목"] ? "O" : ""}</td>
                  <td>{t.available["금"] ? "O" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="row">
          <label>
            시작일
            <br />
            <input
              className="input"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label>
            종료일
            <br />
            <input
              className="input"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
          <label>
            엔진
            <br />
            <select
              className="input"
              value={engineId}
              onChange={(e) => setEngineId(e.target.value)}
            >
              {engines.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.id})
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ marginTop: 12 }} className="row">
          <button className="btn" onClick={onRun} disabled={loading}>
            {loading ? "생성 중..." : "스케줄 생성"}
          </button>

          {result && (
            <button
              className="btn"
              onClick={() => setResult(null)}
              style={{ background: "white", color: "#111" }}
              disabled={loading}
            >
              결과 숨기기
            </button>
          )}
        </div>

        {err && <p style={{ color: "crimson" }}>{err}</p>}
      </div>

      {/* ✅ 결과는 같은 화면 아래에 */}
      {result && (
        <div id="result-section" style={{ marginTop: 16 }}>
          <ResultPage result={result} />
        </div>
      )}
    </div>
  );
}
