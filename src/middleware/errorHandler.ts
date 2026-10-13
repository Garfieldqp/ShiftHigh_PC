import { Request, Response, NextFunction } from 'express';

// ตัวจับ error กลางของทั้งแอป (mount เป็นตัวสุดท้ายใน app.ts) - error ที่ throw จาก controller/service ไหนก็ตาม
// ที่ไม่ได้ถูก try/catch ไว้เอง จะมาโผล่ที่นี่แทนที่แอปจะล่มไปเลย
// ต้องรับ 4 พารามิเตอร์ (err, req, res, next) เสมอ Express ถึงจะรู้ว่านี่คือ error handler ไม่ใช่ middleware ปกติ
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(err);
  const status = err.status || 500;
  res.status(status);

  if (req.headers.accept?.includes('application/json')) {
    res.json({ error: err.message || 'Internal Server Error' });
    return;
  }

  const isEn = req.cookies?.lang === 'en';
  res.send(`<h1>${status} - ${isEn ? 'An error occurred' : 'เกิดข้อผิดพลาด'}</h1><p>${err.message || ''}</p>`);
}
