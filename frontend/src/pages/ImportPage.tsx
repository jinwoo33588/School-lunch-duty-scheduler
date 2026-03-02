import { useState } from "react";
import { importExcel, type Teacher } from "../api/importApi";

type Props = {
  onImported: (payload: {
    importId: string;
    teachers: Teacher[];
    warnings: string[];
  }) => void;
};

export default function ImportPage({ onImported }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onUpload() {
    if (!file) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await importExcel(file);
      onImported(res);
    } catch (e: any) {
      setErr(e?.message ?? "업로드 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h2>1) 엑셀 업로드</h2>
      <div className="card">
        <div className="row">
          <input
            className="input"
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button
            className="btn"
            onClick={onUpload}
            disabled={!file || loading}
          >
            {loading ? "업로드 중..." : "업로드"}
          </button>
        </div>
        <p style={{ marginTop: 10, fontSize: 13, color: "#555" }}>
          권장 포맷: 헤더 <b>이름, 월, 화, 수, 목, 금</b> / 공강은 <b>O</b>
        </p>
        {err && <p style={{ color: "crimson" }}>{err}</p>}
      </div>
    </div>
  );
}
