import { Router } from "express";
import { generateSchedule } from "../controllers/schedule.controller";
import { engines } from "../engines";

const router = Router();

router.get("/engines", (req, res) => {
  res.json({ engines: engines.map((e) => ({ id: e.id, name: e.name })) });
});

router.post("/generate", generateSchedule);

export default router;
