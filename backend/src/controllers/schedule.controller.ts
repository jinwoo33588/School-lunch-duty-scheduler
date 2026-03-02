import type { Request, Response } from "express";
import { z } from "zod";
import { memoryStore } from "../store/memoryStore";
import { buildSchoolDays } from "../core/calendar";
import { DEFAULT_ZONES } from "../core/types";
import { getEngine } from "../engines";
import { buildStats } from "../core/stats";
import { buildReport } from "../core/report";

const GenerateSchema = z.object({
  importId: z.string().min(1),
  term: z.object({
    startDate: z.string().min(8),
    endDate: z.string().min(8),
  }),
  options: z.object({
    engineId: z.string().min(1),
    pickPerDay: z.number().int().min(1).max(10).default(3),
    zones: z.array(z.string()).optional(),
  }),
});

export async function generateSchedule(req: Request, res: Response) {
  const parsed = GenerateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Invalid payload", detail: parsed.error.flatten() });
  }

  const { importId, term, options } = parsed.data;

  const imp = memoryStore.getImport(importId);
  if (!imp) return res.status(404).json({ error: "importId not found" });

  const days = buildSchoolDays(term.startDate, term.endDate);

  const engine = getEngine(options.engineId);
  const zones = options.zones?.length ? (options.zones as any) : DEFAULT_ZONES;

  const result = engine.run({
    teachers: imp.teachers,
    days,
    options: {
      engineId: engine.id,
      pickPerDay: options.pickPerDay,
      zones,
    },
  });

  const stats = buildStats(imp.teachers, result.schedule, zones);
  const report = buildReport(result.schedule, stats);

  const resultId = memoryStore.saveResult({
    schedule: result.schedule,
    stats,
    report,
  });

  return res.json({
    resultId,
    schedule: result.schedule,
    stats,
    report,
  });
}
