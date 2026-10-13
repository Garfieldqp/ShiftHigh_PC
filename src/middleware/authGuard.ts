import { Request, Response, NextFunction } from 'express';

// currentUser (mount ก่อนหน้านี้ใน app.ts) เป็นคนแนบ req.employee ให้แล้ว - guard นี้แค่เช็คว่ามีไหม
export function authGuard(req: Request, res: Response, next: NextFunction) {
  if (!req.employee) {
    return res.redirect('/staff/auth/login');
  }
  return next();
}
