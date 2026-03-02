import express from "express";
import cors from "cors";
import importRoutes from "./routes/import.routes";
import scheduleRoutes from "./routes/schedule.routes";

const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/import", importRoutes);
app.use("/api/schedule", scheduleRoutes);

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`[backend] listening on http://localhost:${port}`);
});
