import { Request, Response, NextFunction } from 'express';

// currentUser (mount ก่อนหน้านี้ใน app.ts) เป็นคนแนบ req.customer ให้แล้ว - guard นี้แค่เช็คว่ามีไหม
export function customerAuthGuard(req: Request, res: Response, next: NextFunction) {
  if (!req.customer) {
    return res.redirect('/auth/login');
  }
  return next();
}
