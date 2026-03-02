import type { Request, Response } from "express";
import { parseTeachersFromExcel } from "../io/excelImport";
import { memoryStore } from "../store/memoryStore";

export async function importExcel(req: Request, res: Response) {
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file?.buffer) {
    return res.status(400).json({ error: "엑셀 파일이 필요합니다(file)" });
  }

  const { teachers, warnings } = parseTeachersFromExcel(file.buffer);
  if (teachers.length === 0) {
    return res
      .status(400)
      .json({ error: "유효한 교사 데이터가 없습니다", warnings });
  }

  const importId = memoryStore.saveImport({ teachers, warnings });

  return res.json({ importId, teachers, warnings });
}
