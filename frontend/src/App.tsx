import { useState } from "react";
import "./styles/global.css";

import ImportPage from "./pages/ImportPage";
import GeneratePage from "./pages/GeneratePage";
import type { Teacher } from "./api/importApi";

type ImportedState = {
  importId: string;
  teachers: Teacher[];
  warnings: string[];
};

export default function App() {
  const [imported, setImported] = useState<ImportedState | null>(null);

  return (
    <div>
      {!imported ? (
        <ImportPage
          onImported={(payload) => {
            setImported(payload);
            // 업로드 성공하면 GeneratePage를 보여줌(자동 전환)
          }}
        />
      ) : (
        <GeneratePage
          importId={imported.importId}
          teachers={imported.teachers}
          warnings={imported.warnings}
        />
      )}

      <div className="container" style={{ paddingTop: 6, paddingBottom: 24 }}>
        {imported && (
          <button
            className="btn"
            onClick={() => setImported(null)}
            style={{ background: "#111" }}
          >
            새로 업로드
          </button>
        )}
      </div>
    </div>
  );
}
