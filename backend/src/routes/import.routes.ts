import { Router } from "express";
import multer from "multer";
import { importExcel } from "../controllers/import.controller";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/excel", upload.single("file"), importExcel);

export default router;
