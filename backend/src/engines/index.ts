import type { SchedulerEngine } from "../core/types";
import { randomPickEngine } from "./randomPick";
import { roundRotationEngine } from "./roundRotation";

export const engines: SchedulerEngine[] = [
  randomPickEngine,
  roundRotationEngine,
];

export function getEngine(engineId: string): SchedulerEngine {
  const found = engines.find((e) => e.id === engineId);
  if (!found) throw new Error(`Unknown engine: ${engineId}`);
  return found;
}
